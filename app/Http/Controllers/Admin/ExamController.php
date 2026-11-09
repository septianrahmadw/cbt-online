<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Exam;
use App\Models\ParticipantCategory;
use App\Models\User;
use App\UserRole;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ExamController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Exam::class);

        $exams = Exam::visibleTo($request->user())
            ->with([
                'participantCategories' => fn ($query) => $query->orderBy('name')->get(['participant_categories.id', 'name', 'code']),
                'assignedUsers:id,name,role',
            ])
            ->withCount(['questions', 'sessions', 'results', 'participantCategories'])
            ->latest()
            ->paginate(10);

        return Inertia::render('Admin/Exams', [
            'exams' => $exams,
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', Exam::class);

        return Inertia::render('Admin/Exams/Form', [
            'exam' => null,
            'categories' => $this->categoryOptions(),
            ...$this->staffOptions(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', Exam::class);

        $data = $this->validated($request);
        $exam = Exam::create([
            ...$data['exam'],
            'created_by' => $request->user()->id,
        ]);
        $exam->participantCategories()->sync($data['category_ids']);
        $this->syncAssignments($exam, $data, $request);

        return redirect()
            ->route('admin.exams.index')
            ->with('success', 'Ujian berhasil dibuat.');
    }

    public function edit(Exam $exam): Response
    {
        $this->authorize('update', $exam);

        $exam->load(['participantCategories:id,name,code', 'assignedUsers:id,name,role']);

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
                'dosen_ids' => $exam->assignedUsers
                    ->where('role', UserRole::Dosen)
                    ->pluck('id')
                    ->values(),
                'pengawas_ids' => $exam->assignedUsers
                    ->where('role', UserRole::Pengawas)
                    ->pluck('id')
                    ->values(),
            ],
            'categories' => $this->categoryOptions(),
            ...$this->staffOptions(),
        ]);
    }

    public function update(Request $request, Exam $exam): RedirectResponse
    {
        $this->authorize('update', $exam);

        $data = $this->validated($request);
        $exam->update($data['exam']);
        $exam->participantCategories()->sync($data['category_ids']);
        $this->syncAssignments($exam, $data, $request);

        return redirect()
            ->route('admin.exams.index')
            ->with('success', 'Ujian diperbarui.');
    }

    public function destroy(Exam $exam): RedirectResponse
    {
        $this->authorize('delete', $exam);

        $exam->delete();

        return back()->with('success', 'Ujian dihapus.');
    }

    /**
     * @return array{exam: array<string, mixed>, category_ids: array<int>, dosen_ids: array<int>, pengawas_ids: array<int>}
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
            'dosen_ids' => ['nullable', 'array'],
            'dosen_ids.*' => [
                'integer',
                Rule::exists('users', 'id')->where('role', UserRole::Dosen->value),
            ],
            'pengawas_ids' => ['nullable', 'array'],
            'pengawas_ids.*' => [
                'integer',
                Rule::exists('users', 'id')->where('role', UserRole::Pengawas->value),
            ],
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
            'dosen_ids' => $data['dosen_ids'] ?? [],
            'pengawas_ids' => $data['pengawas_ids'] ?? [],
        ];
    }

    /**
     * @param  array{dosen_ids: array<int>, pengawas_ids: array<int>}  $data
     */
    private function syncAssignments(Exam $exam, array $data, Request $request): void
    {
        $staffIds = array_values(array_unique([
            ...$data['dosen_ids'],
            ...$data['pengawas_ids'],
        ]));

        $exam->assignedUsers()->syncWithPivotValues($staffIds, [
            'assigned_by' => $request->user()->id,
        ]);
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

    /**
     * @return array{dosens: array<int, array{id: int, name: string}>, pengawas: array<int, array{id: int, name: string}>}
     */
    private function staffOptions(): array
    {
        $staff = User::whereIn('role', [UserRole::Dosen->value, UserRole::Pengawas->value])
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'role']);

        return [
            'dosens' => $staff
                ->where('role', UserRole::Dosen)
                ->map(fn (User $user) => ['id' => $user->id, 'name' => $user->name])
                ->values()
                ->all(),
            'pengawas' => $staff
                ->where('role', UserRole::Pengawas)
                ->map(fn (User $user) => ['id' => $user->id, 'name' => $user->name])
                ->values()
                ->all(),
        ];
    }
}
