<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Participant;
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

        $participants = Participant::query()
            ->withCount('results')
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('full_name', 'like', "%{$search}%")
                        ->orWhere('exam_number', 'like', "%{$search}%")
                        ->orWhere('nisn', 'like', "%{$search}%");
                });
            })
            ->orderBy('full_name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Admin/Participants', [
            'participants' => $participants,
            'filters' => ['search' => $search],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'exam_number' => ['required', 'string', 'max:50', 'unique:participants,exam_number'],
            'full_name' => ['required', 'string', 'max:150'],
            'nisn' => ['nullable', 'string', 'max:30'],
            'class_name' => ['nullable', 'string', 'max:50'],
            'is_active' => ['boolean'],
        ]);

        Participant::create($data);

        return back()->with('success', 'Peserta berhasil ditambahkan.');
    }

    public function update(Request $request, Participant $participant): RedirectResponse
    {
        $data = $request->validate([
            'exam_number' => ['required', 'string', 'max:50', 'unique:participants,exam_number,'.$participant->id],
            'full_name' => ['required', 'string', 'max:150'],
            'nisn' => ['nullable', 'string', 'max:30'],
            'class_name' => ['nullable', 'string', 'max:50'],
            'is_active' => ['boolean'],
        ]);

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
            fputcsv($output, ['exam_number', 'full_name', 'nisn', 'class_name']);
            fputcsv($output, ['2026001', 'Contoh Peserta', '1234567890', 'XII IPA 1']);
            fclose($output);
        }, 'template-peserta.csv', $headers);
    }
}
