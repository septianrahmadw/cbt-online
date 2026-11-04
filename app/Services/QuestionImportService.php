<?php

namespace App\Services;

use App\Models\Exam;
use App\Models\Module;
use App\Models\Question;
use App\Models\QuestionOption;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use ZipArchive;

class QuestionImportService
{
    /**
     * @return array{imported: int, failed: int, errors: array<string>}
     */
    public function import(UploadedFile $file, int $examId, ?int $defaultModuleId = null): array
    {
        $exam = Exam::findOrFail($examId);
        $rows = $this->parseFile($file);

        if (empty($rows)) {
            return [
                'imported' => 0,
                'failed' => 0,
                'errors' => ['File tidak memiliki baris data yang valid atau kosong.'],
            ];
        }

        $modulesByCode = Module::pluck('id', 'code')->all();
        $imported = 0;
        $failed = 0;
        $errors = [];

        DB::transaction(function () use (
            $rows,
            $exam,
            $defaultModuleId,
            $modulesByCode,
            &$imported,
            &$failed,
            &$errors
        ) {
            $nextNumber = (int) Question::where('exam_id', $exam->id)->max('question_number') + 1;

            foreach ($rows as $index => $row) {
                $rowNumber = $index + 2; // header is row 1
                $questionText = trim((string) ($row['question_text'] ?? $row['soal'] ?? $row['pertanyaan'] ?? ''));

                if ($questionText === '') {
                    $failed++;

                    continue;
                }

                $passage = trim((string) ($row['passage'] ?? $row['bacaan'] ?? $row['lembar_bacaan'] ?? ''));
                $explanation = trim((string) ($row['explanation'] ?? $row['pembahasan'] ?? ''));
                $imageUrl = trim((string) ($row['image'] ?? $row['gambar'] ?? ''));
                $rawType = strtolower(trim((string) ($row['type'] ?? $row['jenis'] ?? $row['tipe'] ?? 'single')));
                $rawDifficulty = strtolower(trim((string) ($row['difficulty'] ?? $row['kesukaran'] ?? $row['tingkat_kesukaran'] ?? '')));
                $rawModule = trim((string) ($row['module_code'] ?? $row['module'] ?? $row['modul'] ?? ''));
                $rawScore = trim((string) ($row['score_weight'] ?? $row['bobot'] ?? '1'));
                $rawCorrect = strtoupper(trim((string) ($row['correct'] ?? $row['kunci'] ?? $row['jawaban'] ?? '')));

                // Determine correct labels (e.g. "B" or "A,C" or "A, C")
                $correctLabels = array_filter(array_map('trim', preg_split('/[,;\s]+/', $rawCorrect) ?: []));

                $type = ($rawType === 'multiple' || count($correctLabels) > 1) ? 'multiple' : 'single';

                $difficulty = match ($rawDifficulty) {
                    'mudah', 'easy' => 'mudah',
                    'sedang', 'medium' => 'sedang',
                    'sulit', 'hard' => 'sulit',
                    default => null,
                };

                $moduleId = $defaultModuleId;
                if ($rawModule !== '' && isset($modulesByCode[$rawModule])) {
                    $moduleId = $modulesByCode[$rawModule];
                } elseif ($rawModule !== '' && is_numeric($rawModule) && in_array((int) $rawModule, $modulesByCode, true)) {
                    $moduleId = (int) $rawModule;
                }

                $scoreWeight = is_numeric($rawScore) && (float) $rawScore > 0 ? (float) $rawScore : 1.0;

                $question = Question::create([
                    'exam_id' => $exam->id,
                    'module_id' => $moduleId,
                    'question_number' => $nextNumber++,
                    'passage' => $passage !== '' ? $passage : null,
                    'type' => $type,
                    'difficulty' => $difficulty,
                    'question_text' => $questionText,
                    'image_url' => $imageUrl !== '' ? $imageUrl : null,
                    'explanation' => $explanation !== '' ? $explanation : null,
                    'score_weight' => $scoreWeight,
                    'is_active' => true,
                ]);

                // Options A through F
                $hasOptions = false;
                foreach (['A', 'B', 'C', 'D', 'E', 'F'] as $label) {
                    $lower = strtolower($label);
                    $optText = trim((string) (
                        $row["option_{$lower}"]
                        ?? $row["opsi_{$lower}"]
                        ?? $row["pilihan_{$lower}"]
                        ?? $row[$lower]
                        ?? ''
                    ));
                    $optImage = trim((string) (
                        $row["option_{$lower}_image"]
                        ?? $row["opsi_{$lower}_image"]
                        ?? $row["gambar_{$lower}"]
                        ?? ''
                    ));

                    if ($optText === '' && $optImage === '') {
                        continue;
                    }

                    $isCorrect = in_array($label, $correctLabels, true);

                    QuestionOption::create([
                        'question_id' => $question->id,
                        'label' => $label,
                        'option_text' => $optText !== '' ? $optText : null,
                        'image_url' => $optImage !== '' ? $optImage : null,
                        'is_correct' => $isCorrect,
                    ]);
                    $hasOptions = true;
                }

                // If no options were found, ensure at least default dummy options are not corrupted
                if (! $hasOptions) {
                    $errors[] = "Baris {$rowNumber}: Soal '{$questionText}' tidak memiliki pilihan jawaban.";
                }

                $imported++;
            }

            $exam->update([
                'total_questions' => Question::where('exam_id', $exam->id)->count(),
            ]);
        });

        return [
            'imported' => $imported,
            'failed' => $failed,
            'errors' => $errors,
        ];
    }

    /**
     * @return array<int, array<string, string>>
     */
    public function parseFile(UploadedFile $file): array
    {
        $path = $file->getRealPath();
        $extension = strtolower($file->getClientOriginalExtension());

        if (in_array($extension, ['xlsx', 'xlsm'], true) || $this->isZip($path)) {
            return $this->parseXlsx($path);
        }

        return $this->parseCsv($path);
    }

    private function isZip(string $path): bool
    {
        $handle = @fopen($path, 'r');
        if (! $handle) {
            return false;
        }
        $header = fread($handle, 4);
        fclose($handle);

        return $header === "PK\x03\x04";
    }

    /**
     * @return array<int, array<string, string>>
     */
    private function parseCsv(string $path): array
    {
        $handle = fopen($path, 'r');
        if (! $handle) {
            return [];
        }

        // Detect delimiter
        $firstLine = fgets($handle);
        if ($firstLine === false) {
            fclose($handle);

            return [];
        }

        $delimiter = strpos($firstLine, ';') !== false && substr_count($firstLine, ';') > substr_count($firstLine, ',')
            ? ';'
            : ',';

        rewind($handle);

        // Strip UTF-8 BOM if present
        $bom = fread($handle, 3);
        if ($bom !== "\xEF\xBB\xBF") {
            rewind($handle);
        }

        $header = fgetcsv($handle, 0, $delimiter);
        if (! $header) {
            fclose($handle);

            return [];
        }

        $header = array_map(fn ($col) => strtolower(trim((string) $col)), $header);
        $rows = [];

        while (($data = fgetcsv($handle, 0, $delimiter)) !== false) {
            if (empty(array_filter($data, fn ($v) => trim((string) $v) !== ''))) {
                continue;
            }

            $row = [];
            foreach ($header as $idx => $key) {
                if ($key !== '') {
                    $row[$key] = isset($data[$idx]) ? trim((string) $data[$idx]) : '';
                }
            }
            $rows[] = $row;
        }

        fclose($handle);

        return $rows;
    }

    /**
     * @return array<int, array<string, string>>
     */
    private function parseXlsx(string $path): array
    {
        $zip = new ZipArchive;
        if ($zip->open($path) !== true) {
            return [];
        }

        $sharedStrings = [];
        $sharedXml = $zip->getFromName('xl/sharedStrings.xml');
        if ($sharedXml !== false) {
            $xml = @simplexml_load_string($sharedXml);
            if ($xml && isset($xml->si)) {
                foreach ($xml->si as $si) {
                    if (isset($si->t)) {
                        $sharedStrings[] = (string) $si->t;
                    } elseif (isset($si->r)) {
                        $text = '';
                        foreach ($si->r as $r) {
                            $text .= (string) $r->t;
                        }
                        $sharedStrings[] = $text;
                    } else {
                        $sharedStrings[] = '';
                    }
                }
            }
        }

        $sheetXml = $zip->getFromName('xl/worksheets/sheet1.xml');
        if ($sheetXml === false) {
            $zip->close();

            return [];
        }

        $xml = @simplexml_load_string($sheetXml);
        $zip->close();

        if (! $xml || ! isset($xml->sheetData->row)) {
            return [];
        }

        $rawRows = [];
        foreach ($xml->sheetData->row as $row) {
            $cells = [];
            foreach ($row->c as $c) {
                $ref = (string) ($c['r'] ?? $c['ref'] ?? '');
                $colIndex = $this->columnRefToIndex($ref);
                $type = (string) ($c['t'] ?? '');
                $val = (string) $c->v;

                if ($type === 's') {
                    $val = $sharedStrings[(int) $val] ?? '';
                } elseif ($type === 'inlineStr' && isset($c->is->t)) {
                    $val = (string) $c->is->t;
                }

                $cells[$colIndex] = trim($val);
            }
            $rawRows[] = $cells;
        }

        if (empty($rawRows)) {
            return [];
        }

        $headerRow = array_shift($rawRows);
        $headerMap = [];
        foreach ($headerRow as $colIdx => $colName) {
            $key = strtolower(trim((string) $colName));
            if ($key !== '') {
                $headerMap[$colIdx] = $key;
            }
        }

        $rows = [];
        foreach ($rawRows as $cells) {
            if (empty(array_filter($cells, fn ($v) => $v !== ''))) {
                continue;
            }

            $row = [];
            foreach ($headerMap as $colIdx => $key) {
                $row[$key] = $cells[$colIdx] ?? '';
            }
            $rows[] = $row;
        }

        return $rows;
    }

    private function columnRefToIndex(string $ref): int
    {
        $letters = preg_replace('/[^A-Z]/', '', strtoupper($ref)) ?: 'A';
        $index = 0;
        for ($i = 0; $i < strlen($letters); $i++) {
            $index = $index * 26 + (ord($letters[$i]) - ord('A') + 1);
        }

        return $index - 1;
    }
}
