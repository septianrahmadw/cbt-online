<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Exam;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ExamController extends Controller
{
    public function index(): Response
    {
        $exams = Exam::withCount(['questions', 'sessions', 'results'])
            ->latest()
            ->paginate(10);

        return Inertia::render('Admin/Exams', [
            'exams' => $exams,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);
        Exam::create($data);

        return back()->with('success', 'Ujian berhasil dibuat.');
    }

    public function update(Request $request, Exam $exam): RedirectResponse
    {
        $data = $this->validated($request);
        $exam->update($data);

        return back()->with('success', 'Ujian diperbarui.');
    }

    public function destroy(Exam $exam): RedirectResponse
    {
        $exam->delete();

        return back()->with('success', 'Ujian dihapus.');
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request): array
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'subject_name' => ['required', 'string', 'max:150'],
            'duration_minutes' => ['required', 'integer', 'min:1', 'max:600'],
            'exam_date' => ['nullable', 'date'],
            'is_active' => ['boolean'],
            'randomize_questions' => ['boolean'],
            'passing_grade' => ['required', 'integer', 'min:0', 'max:100'],
        ]);

        $data['is_active'] = (bool) ($data['is_active'] ?? false);
        $data['randomize_questions'] = (bool) ($data['randomize_questions'] ?? false);

        return $data;
    }
}
