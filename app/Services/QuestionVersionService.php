<?php

namespace App\Services;

use App\Models\Question;
use App\Models\QuestionOption;
use App\Models\QuestionVersion;
use Illuminate\Support\Facades\DB;

class QuestionVersionService
{
    /**
     * Buat versi baru dari question saat ada perubahan
     */
    public function createVersion(Question $question, int $createdBy, ?string $reviewStatus = null, ?string $reviewNote = null): QuestionVersion
    {
        return DB::transaction(function () use ($question, $createdBy, $reviewStatus, $reviewNote) {
            // Ambil version number terbaru
            $latestVersion = $question->versions()->latest('version_number')->first();
            $nextVersion = ($latestVersion?->version_number ?? 0) + 1;

            // Siapkan data snapshot
            $data = $this->getQuestionSnapshot($question);
            $optionsData = $this->getOptionsSnapshot($question);

            // Tentukan status review
            $status = $reviewStatus ?? $question->review_status->value;

            $version = QuestionVersion::create([
                'question_id' => $question->id,
                'created_by' => $createdBy,
                'version_number' => $nextVersion,
                'review_status' => $status,
                'review_note' => $reviewNote,
                'data' => $data,
                'options_data' => $optionsData,
                'reviewed_at' => $question->reviewed_at,
                'reviewed_by' => $question->reviewed_by,
            ]);

            // Update current_version di question
            $question->update(['current_version' => $nextVersion]);

            return $version;
        });
    }

    /**
     * Buat versi otomatis saat status review berubah (submit for review, approve, reject)
     */
    public function createVersionOnStatusChange(Question $question, int $createdBy, string $newStatus, ?string $note = null): QuestionVersion
    {
        return $this->createVersion($question, $createdBy, $newStatus, $note);
    }

    /**
     * Snapshot field question untuk disimpan
     */
    protected function getQuestionSnapshot(Question $question): array
    {
        return [
            'exam_id' => $question->exam_id,
            'module_id' => $question->module_id,
            'question_number' => $question->question_number,
            'passage' => $question->passage,
            'type' => $question->type,
            'difficulty' => $question->difficulty,
            'question_text' => $question->question_text,
            'image_url' => $question->image_url,
            'explanation' => $question->explanation,
            'is_active' => $question->is_active,
            'score_weight' => $question->score_weight,
            'review_status' => $question->review_status->value,
            'review_note' => $question->review_note,
        ];
    }

    /**
     * Snapshot options untuk disimpan
     */
    protected function getOptionsSnapshot(Question $question): array
    {
        return $question->options->map(function (QuestionOption $option) {
            return [
                'id' => $option->id,
                'label' => $option->label,
                'option_text' => $option->option_text,
                'image_url' => $option->image_url,
                'is_correct' => $option->is_correct,
            ];
        })->values()->toArray();
    }

    /**
     * Restore question ke versi tertentu
     */
    public function restoreVersion(Question $question, int $versionNumber, int $restoredBy): void
    {
        $version = $question->versions()->where('version_number', $versionNumber)->firstOrFail();

        DB::transaction(function () use ($question, $version, $restoredBy) {
            // Update question dengan data dari versi
            $question->update([
                'exam_id' => $version->data['exam_id'],
                'module_id' => $version->data['module_id'],
                'question_number' => $version->data['question_number'],
                'passage' => $version->data['passage'],
                'type' => $version->data['type'],
                'difficulty' => $version->data['difficulty'],
                'question_text' => $version->data['question_text'],
                'image_url' => $version->data['image_url'],
                'explanation' => $version->data['explanation'],
                'is_active' => $version->data['is_active'],
                'score_weight' => $version->data['score_weight'],
                'review_status' => $version->data['review_status'],
                'review_note' => $version->data['review_note'],
                'reviewed_at' => $version->reviewed_at,
                'reviewed_by' => $version->reviewed_by,
            ]);

            // Update options
            $question->options()->delete();
            foreach ($version->options_data as $optionData) {
                QuestionOption::create([
                    'question_id' => $question->id,
                    'label' => $optionData['label'],
                    'option_text' => $optionData['option_text'],
                    'image_url' => $optionData['image_url'] ?? null,
                    'is_correct' => $optionData['is_correct'],
                ]);
            }

            // Buat versi baru sebagai catatan restore
            $this->createVersion($question, $restoredBy, $question->review_status->value, "Restored from version {$versionNumber}");
        });
    }

    /**
     * Ambil perbandingan antara dua versi
     */
    public function compareVersions(Question $question, int $versionA, int $versionB): array
    {
        $vA = $question->versions()->where('version_number', $versionA)->firstOrFail();
        $vB = $question->versions()->where('version_number', $versionB)->firstOrFail();

        return [
            'version_a' => [
                'number' => $vA->version_number,
                'data' => $vA->data,
                'options' => $vA->options_data,
                'created_at' => $vA->created_at,
                'created_by' => $vA->creator?->full_name,
            ],
            'version_b' => [
                'number' => $vB->version_number,
                'data' => $vB->data,
                'options' => $vB->options_data,
                'created_at' => $vB->created_at,
                'created_by' => $vB->creator?->full_name,
            ],
            'diff' => $this->diffArrays($vA->data, $vB->data),
        ];
    }

    /**
     * Simple array diff
     */
    protected function diffArrays(array $a, array $b): array
    {
        $allKeys = array_unique(array_merge(array_keys($a), array_keys($b)));
        $diff = [];

        foreach ($allKeys as $key) {
            $valA = $a[$key] ?? null;
            $valB = $b[$key] ?? null;

            if ($valA !== $valB) {
                $diff[$key] = ['old' => $valA, 'new' => $valB];
            }
        }

        return $diff;
    }
}
