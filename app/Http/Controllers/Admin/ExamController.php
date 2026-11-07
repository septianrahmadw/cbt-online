<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Exam;
use App\Models\ParticipantCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ExamController extends Controller
{
    public function index(): Response
    {
        $exams = Exam::with(['participantCategories' => fn ($query) => $query->orderBy('name')->get(['participant_categories.id', 'name', 'code'])])
            ->withCount(['questions', 'sessions', 'results', 'participantCategories'])
            ->latest()
            ->paginate(10);

        return Inertia::render('Admin/Exams', [
            'exams' => $exams,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Exams/Form', [
            'exam' => null,
            'categories' => $this->categoryOptions(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);
        $exam = Exam::create($data['exam']);
        $exam->participantCategories()->sync($data['category_ids']);

        return redirect()
            ->route('admin.exams.index')
            ->with('success', 'Ujian berhasil dibuat.');
    }

    public function edit(Exam $exam): Response
    {
        $exam->load('participantCategories:id,name,code');

        return Inertia::render('Admin/Exams/Form', [
            'exam' => [
                'id' => $exam->id,
                'title' => $exam->title,
                'subject_name' => $exam->subject_name,
                'duration_minutes' => $exam->duration_minutes,
                'exam_date' => $exam->exam_date?->format('Y-m-d\TH:i'),
                'exam_end_date' => $exam->exam_end_date?->format('Y-m-d\TH:i'),
                'is_active' => $exam->is_active,
                'violations_enabled' => $exam->violations_enabled,
                'violation_limit' => $exam->violation_limit,
                'randomize_questions' => $exam->randomize_questions,
                'passing_grade' => $exam->passing_grade,
                'category_ids' => $exam->participantCategories->pluck('id')->values(),
            ],
            'categories' => $this->categoryOptions(),
        ]);
    }

    public function update(Request $request, Exam $exam): RedirectResponse
    {
        $data = $this->validated($request);
        $exam->update($data['exam']);
        $exam->participantCategories()->sync($data['category_ids']);

        return redirect()
            ->route('admin.exams.index')
            ->with('success', 'Ujian diperbarui.');
    }

    public function destroy(Exam $exam): RedirectResponse
    {
        $exam->delete();

        return back()->with('success', 'Ujian dihapus.');
    }

    /**
     * @return array{exam: array<string, mixed>, category_ids: array<int>}
     */
    private function validated(Request $request): array
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'subject_name' => ['required', 'string', 'max:150'],
            'duration_minutes' => ['required', 'integer', 'min:1', 'max:600'],
            'exam_date' => ['required', 'date'],
            'exam_end_date' => ['required', 'date', 'after_or_equal:exam_date'],
            'violation_setting' => ['nullable', 'in:global,enabled,disabled'],
            'violation_limit' => ['nullable', 'integer', 'min:1', 'max:10'],
            'is_active' => ['boolean'],
            'randomize_questions' => ['boolean'],
            'passing_grade' => ['required', 'integer', 'min:0', 'max:100'],
            'category_ids' => ['nullable', 'array'],
            'category_ids.*' => ['integer', 'exists:participant_categories,id'],
        ]);

        $violationSetting = $data['violation_setting'] ?? 'global';
        $violationsEnabled = match ($violationSetting) {
            'enabled' => true,
            'disabled' => false,
            default => null,
        };
        $violationLimit = $violationSetting === 'global' ? null : ($data['violation_limit'] ?? null);

        $exam = [
            'title' => $data['title'],
            'subject_name' => $data['subject_name'],
            'duration_minutes' => $data['duration_minutes'],
            'exam_date' => $data['exam_date'],
            'exam_end_date' => $data['exam_end_date'],
            'is_active' => (bool) ($data['is_active'] ?? false),
            'violations_enabled' => $violationsEnabled,
            'violation_limit' => $violationLimit,
            'randomize_questions' => (bool) ($data['randomize_questions'] ?? false),
            'passing_grade' => $data['passing_grade'],
        ];

        return [
            'exam' => $exam,
            'category_ids' => $data['category_ids'] ?? [],
        ];
    }

    /**
     * @return array<int, array{id: int, name: string, code: string, participants_count: int}>
     */
    private function categoryOptions(): array
    {
        return ParticipantCategory::where('is_active', true)
            ->withCount('participants')
            ->orderBy('name')
            ->get(['id', 'name', 'code'])
            ->map(fn (ParticipantCategory $category) => [
                'id' => $category->id,
                'name' => $category->name,
                'code' => $category->code,
                'participants_count' => $category->participants_count,
            ])
            ->values()
            ->all();
    }
}
