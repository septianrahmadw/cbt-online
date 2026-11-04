<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Exam;
use App\Models\Module;
use App\Models\Question;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ModuleController extends Controller
{
    public function index(): Response
    {
        $usage = Question::query()
            ->whereNotNull('module_id')
            ->select('module_id', DB::raw('count(distinct exam_id) as exams_count'))
            ->groupBy('module_id')
            ->pluck('exams_count', 'module_id');

        $modules = Module::query()
            ->withCount('questions')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->map(fn (Module $module) => [
                'id' => $module->id,
                'name' => $module->name,
                'code' => $module->code,
                'color' => $module->color,
                'sort_order' => $module->sort_order,
                'is_active' => $module->is_active,
                'description' => $module->description,
                'questions_count' => $module->questions_count,
                'exams_count' => (int) ($usage[$module->id] ?? 0),
            ]);

        return Inertia::render('Admin/Modules/Index', [
            'modules' => $modules,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Modules/Form', [
            'module' => null,
            'nextSortOrder' => (int) Module::max('sort_order') + 1,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);

        $module = Module::create($data);

        return redirect()
            ->route('admin.modules.index')
            ->with('success', "Modul {$module->name} berhasil ditambahkan.");
    }

    public function show(Module $module): Response
    {
        $module->loadCount('questions');

        $questionsQuery = Question::query()->where('module_id', $module->id);

        $easyCount = (clone $questionsQuery)->where('difficulty', 'mudah')->count();
        $mediumCount = (clone $questionsQuery)->where('difficulty', 'sedang')->count();
        $hardCount = (clone $questionsQuery)->where('difficulty', 'sulit')->count();

        $singleCount = (clone $questionsQuery)->where(fn ($q) => $q->where('type', 'single')->orWhereNull('type'))->count();
        $multipleCount = (clone $questionsQuery)->where('type', 'multiple')->count();

        $exams = Exam::query()
            ->whereHas('questions', fn ($query) => $query->where('module_id', $module->id))
            ->withCount(['questions' => fn ($query) => $query->where('module_id', $module->id)])
            ->orderBy('title')
            ->get(['id', 'title', 'subject_name'])
            ->map(fn (Exam $exam) => [
                'id' => $exam->id,
                'title' => $exam->title,
                'subject_name' => $exam->subject_name,
                'module_questions_count' => $exam->questions_count,
            ]);

        $questions = Question::query()
            ->with(['exam:id,title', 'options:id,question_id'])
            ->where('module_id', $module->id)
            ->orderBy('exam_id')
            ->orderBy('question_number')
            ->limit(100)
            ->get()
            ->map(fn (Question $question) => [
                'id' => $question->id,
                'question_number' => $question->question_number,
                'type' => $question->type ?: 'single',
                'difficulty' => $question->difficulty,
                'passage' => $question->passage,
                'question_text' => $question->question_text,
                'options_count' => $question->options->count(),
                'exam' => $question->exam ? ['id' => $question->exam->id, 'title' => $question->exam->title] : null,
            ]);

        return Inertia::render('Admin/Modules/Show', [
            'module' => [
                'id' => $module->id,
                'name' => $module->name,
                'code' => $module->code,
                'color' => $module->color,
                'sort_order' => $module->sort_order,
                'is_active' => $module->is_active,
                'description' => $module->description,
                'questions_count' => $module->questions_count,
                'exams_count' => $exams->count(),
                'easy_count' => $easyCount,
                'medium_count' => $mediumCount,
                'hard_count' => $hardCount,
                'single_count' => $singleCount,
                'multiple_count' => $multipleCount,
            ],
            'exams' => $exams,
            'questions' => $questions,
        ]);
    }

    public function edit(Module $module): Response
    {
        return Inertia::render('Admin/Modules/Form', [
            'module' => [
                'id' => $module->id,
                'name' => $module->name,
                'code' => $module->code,
                'color' => $module->color,
                'sort_order' => $module->sort_order,
                'is_active' => $module->is_active,
                'description' => $module->description,
            ],
            'nextSortOrder' => null,
        ]);
    }

    public function update(Request $request, Module $module): RedirectResponse
    {
        $data = $this->validated($request, $module);

        $module->update($data);

        return redirect()
            ->route('admin.modules.show', $module)
            ->with('success', "Modul {$module->name} berhasil diperbarui.");
    }

    public function destroy(Module $module): RedirectResponse
    {
        $name = $module->name;
        $module->delete();

        return redirect()
            ->route('admin.modules.index')
            ->with('success', "Modul {$name} dihapus. Soal terkait tidak ikut dihapus.");
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request, ?Module $module = null): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => [
                'required',
                'string',
                'max:100',
                'regex:/^[a-z0-9_-]+$/',
                Rule::unique('modules', 'code')->ignore($module?->id),
            ],
            'color' => ['required', Rule::in(Module::COLORS)],
            'sort_order' => ['required', 'integer', 'min:0'],
            'is_active' => ['boolean'],
            'description' => ['nullable', 'string', 'max:1000'],
        ]);
    }
}
