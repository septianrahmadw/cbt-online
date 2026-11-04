<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Participant;
use App\Models\ParticipantCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ParticipantController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));
        $categoryId = $request->integer('category_id') ?: null;

        $participants = Participant::query()
            ->with('category:id,name,code')
            ->withCount('results')
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('full_name', 'like', "%{$search}%")
                        ->orWhere('exam_number', 'like', "%{$search}%")
                        ->orWhere('nisn', 'like', "%{$search}%");
                });
            })
            ->when($categoryId, fn ($query) => $query->where('category_id', $categoryId))
            ->orderBy('full_name')
            ->paginate(15)
            ->withQueryString();

        $categories = ParticipantCategory::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'code']);

        return Inertia::render('Admin/Participants', [
            'participants' => $participants,
            'filters' => ['search' => $search, 'category_id' => $categoryId],
            'categories' => $categories,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);

        Participant::create($data);

        return back()->with('success', 'Peserta berhasil ditambahkan.');
    }

    public function update(Request $request, Participant $participant): RedirectResponse
    {
        $data = $this->validated($request, $participant);

        $participant->update($data);

        return back()->with('success', 'Data peserta diperbarui.');
    }

    public function destroy(Participant $participant): RedirectResponse
    {
        $participant->delete();

        return back()->with('success', 'Peserta dihapus.');
    }

    public function import(Request $request): RedirectResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:csv,txt', 'max:5120'],
        ]);

        $handle = fopen($request->file('file')->getRealPath(), 'r');

        if ($handle === false) {
            return back()->with('error', 'File tidak dapat dibaca.');
        }

        $header = fgetcsv($handle);
        $header = array_map(fn ($value) => strtolower(trim((string) $value)), $header ?: []);

        $required = ['exam_number', 'full_name'];
        $missing = array_diff($required, $header);

        if ($missing !== []) {
            fclose($handle);

            return back()->with('error', 'Header CSV tidak valid. Kolom wajib: exam_number, full_name.');
        }

        $index = array_flip($header);
        $created = 0;
        $updated = 0;
        $failed = 0;

        DB::transaction(function () use ($handle, $index, &$created, &$updated, &$failed) {
            while (($row = fgetcsv($handle)) !== false) {
                $examNumber = trim((string) ($row[$index['exam_number']] ?? ''));
                $fullName = trim((string) ($row[$index['full_name']] ?? ''));

                if ($examNumber === '' || $fullName === '') {
                    $failed++;

                    continue;
                }

                $payload = [
                    'full_name' => $fullName,
                    'nisn' => isset($index['nisn']) ? trim((string) ($row[$index['nisn']] ?? '')) : null,
                    'class_name' => isset($index['class_name']) ? trim((string) ($row[$index['class_name']] ?? '')) : null,
                    'is_active' => true,
                ];

                if (isset($index['category_code'])) {
                    $code = trim((string) ($row[$index['category_code']] ?? ''));

                    if ($code !== '') {
                        $category = ParticipantCategory::where('code', $code)->first();

                        if (! $category) {
                            $failed++;

                            continue;
                        }

                        $payload['category_id'] = $category->id;
                    }
                }

                $participant = Participant::where('exam_number', $examNumber)->first();

                if ($participant) {
                    $participant->update($payload);
                    $updated++;
                } else {
                    Participant::create(['exam_number' => $examNumber, ...$payload]);
                    $created++;
                }
            }
        });

        fclose($handle);

        return back()->with('success', "Import selesai: {$created} baru, {$updated} diperbarui, {$failed} baris gagal.");
    }

    public function template(): StreamedResponse
    {
        $headers = ['Content-Type' => 'text/csv', 'Content-Disposition' => 'attachment; filename="template-peserta.csv"'];

        return response()->streamDownload(function () {
            $output = fopen('php://output', 'w');
            fputcsv($output, ['exam_number', 'full_name', 'nisn', 'class_name', 'category_code']);
            fputcsv($output, ['2026001', 'Contoh Peserta', '1234567890', 'XII IPA 1', 'umum']);
            fclose($output);
        }, 'template-peserta.csv', $headers);
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request, ?Participant $participant = null): array
    {
        return $request->validate([
            'exam_number' => ['required', 'string', 'max:50', 'unique:participants,exam_number,'.($participant->id ?? 'null')],
            'full_name' => ['required', 'string', 'max:150'],
            'nisn' => ['nullable', 'string', 'max:30'],
            'class_name' => ['nullable', 'string', 'max:50'],
            'category_id' => ['nullable', 'integer', 'exists:participant_categories,id'],
            'is_active' => ['boolean'],
        ]);
    }
}
