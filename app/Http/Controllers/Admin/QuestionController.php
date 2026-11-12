<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Exam;
use App\Models\Module;
use App\Models\Question;
use App\Models\QuestionOption;
use App\QuestionReviewStatus;
use App\Services\NotificationService;
use App\Services\QuestionImportService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class QuestionController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Question::class);

        $exams = Exam::visibleTo($request->user())
            ->orderBy('title')
            ->get(['id', 'title', 'subject_name', 'total_questions']);
        $selectedExamId = $request->integer('exam_id') ?: $exams->first()?->id;
        $selectedExam = $selectedExamId ? $exams->firstWhere('id', $selectedExamId) : null;

        if ($selectedExamId && ! $selectedExam) {
            abort(403, 'Anda tidak memiliki akses ke ujian ini.');
        }

        $modules = $this->moduleOptions();
        $selectedModuleId = $request->input('module_id');

        $questions = $selectedExamId
            ? Question::with(['options', 'module:id,name,code,color'])
                ->where('exam_id', $selectedExamId)
                ->when($selectedModuleId === 'none', fn ($query) => $query->whereNull('module_id'))
                ->when(
                    is_numeric($selectedModuleId),
                    fn ($query) => $query->where('module_id', (int) $selectedModuleId)
                )
                ->orderBy('question_number')
                ->get()
                ->map(fn (Question $question) => [
                    'id' => $question->id,
                    'exam_id' => $question->exam_id,
                    'module_id' => $question->module_id,
                    'question_number' => $question->question_number,
                    'passage' => $question->passage,
                    'type' => $question->type ?: 'single',
                    'difficulty' => $question->difficulty,
                    'question_text' => $question->question_text,
                    'image_url' => $question->image_url,
                    'explanation' => $question->explanation,
                    'is_active' => (bool) $question->is_active,
                    'score_weight' => (float) $question->score_weight,
                    'review_status' => $question->review_status?->value,
                    'review_status_label' => $question->review_status?->label(),
                    'review_note' => $question->review_note,
                    'can_edit' => $request->user()->can('update', $question),
                    'can_submit_review' => $request->user()->can('submitForReview', $question),
                    'can_review' => $request->user()->can('review', $question),
                    'module' => $question->module ? [
                        'id' => $question->module->id,
                        'name' => $question->module->name,
                        'code' => $question->module->code,
                        'color' => $question->module->color,
                    ] : null,
                    'options' => $question->options->map(fn (QuestionOption $option) => [
                        'id' => $option->id,
                        'label' => $option->label,
                        'option_text' => $option->option_text,
                        'image_url' => $option->image_url,
                        'is_correct' => (bool) $option->is_correct,
                    ]),
                ])
            : collect();

        return Inertia::render('Admin/Questions', [
            'exams' => $exams,
            'selectedExam' => $selectedExam,
            'selectedExamId' => $selectedExamId,
            'questions' => $questions,
            'modules' => $modules,
            'selectedModuleId' => $selectedModuleId ?? '',
        ]);
    }

    public function create(Request $request): Response
    {
        $this->authorize('create', Question::class);

        $exams = Exam::visibleTo($request->user())->orderBy('title')->get(['id', 'title', 'subject_name']);
        $selectedExamId = $request->integer('exam_id') ?: $exams->first()?->id;

        if ($selectedExamId && ! $exams->firstWhere('id', $selectedExamId)) {
            abort(403, 'Anda tidak memiliki akses ke ujian ini.');
        }

        $nextQuestionNumber = $selectedExamId
            ? (int) Question::where('exam_id', $selectedExamId)->max('question_number') + 1
            : 1;

        return Inertia::render('Admin/QuestionForm', [
            'exams' => $exams,
            'question' => null,
            'selectedExamId' => $selectedExamId,
            'modules' => $this->moduleOptions(),
            'selectedModuleId' => is_numeric($request->input('module_id')) ? (int) $request->input('module_id') : null,
            'nextQuestionNumber' => $nextQuestionNumber,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', Question::class);

        $data = $this->validated($request);
        $exam = Exam::findOrFail($data['exam_id']);
        $this->authorize('manageQuestions', $exam);

        $isDosen = $request->user()->isDosen();

        $question = Question::create([
            'exam_id' => $data['exam_id'],
            'module_id' => $data['module_id'] ?? null,
            'question_number' => $data['question_number'],
            'passage' => $data['passage'] ?? null,
            'type' => $data['type'] ?? 'single',
            'difficulty' => $data['difficulty'] ?? null,
            'question_text' => $data['question_text'] ?? '',
            'image_url' => $this->storeImage($request->file('image')),
            'explanation' => $data['explanation'] ?? null,
            'is_active' => (bool) ($request->input('is_active', true)),
            'score_weight' => $data['score_weight'],
            'review_status' => $isDosen ? QuestionReviewStatus::Draft : QuestionReviewStatus::Approved,
            'reviewed_by' => $isDosen ? null : $request->user()->id,
            'reviewed_at' => $isDosen ? null : now(),
            'created_by' => $request->user()->id,
        ]);

        $this->saveOptions($question, $request);
        $this->syncTotalQuestions($question->exam_id);

        return redirect()
            ->route('admin.questions.index', ['exam_id' => $question->exam_id])
            ->with('success', $isDosen
                ? 'Soal berhasil disimpan sebagai draf. Kirim ke admin untuk direview.'
                : 'Soal berhasil ditambahkan.');
    }

    public function edit(Question $question): Response
    {
        $this->authorize('update', $question);

        $question->load(['options', 'module:id,name,code,color']);

        return Inertia::render('Admin/QuestionForm', [
            'exams' => Exam::visibleTo(request()->user())->orderBy('title')->get(['id', 'title', 'subject_name']),
            'question' => [
                'id' => $question->id,
                'exam_id' => $question->exam_id,
                'module_id' => $question->module_id,
                'question_number' => $question->question_number,
                'passage' => $question->passage,
                'type' => $question->type ?: 'single',
                'difficulty' => $question->difficulty,
                'question_text' => $question->question_text,
                'image_url' => $question->image_url,
                'explanation' => $question->explanation,
                'is_active' => (bool) $question->is_active,
                'score_weight' => (float) $question->score_weight,
                'review_status' => $question->review_status?->value,
                'review_status_label' => $question->review_status?->label(),
                'review_note' => $question->review_note,
                'options' => $question->options->map(fn (QuestionOption $option) => [
                    'id' => $option->id,
                    'label' => $option->label,
                    'text' => $option->option_text ?? '',
                    'image' => $option->image_url,
                    'correct' => (bool) $option->is_correct,
                ]),
            ],
            'selectedExamId' => $question->exam_id,
            'modules' => $this->moduleOptions(),
            'selectedModuleId' => $question->module_id,
            'nextQuestionNumber' => $question->question_number,
        ]);
    }

    public function update(Request $request, Question $question): RedirectResponse
    {
        $this->authorize('update', $question);

        $data = $this->validated($request, $question);
        $exam = Exam::findOrFail($data['exam_id']);
        $this->authorize('manageQuestions', $exam);

        $imageUrl = $question->image_url;
        if ($request->boolean('image_remove')) {
            $imageUrl = null;
        } elseif ($request->hasFile('image')) {
            $imageUrl = $this->storeImage($request->file('image'));
        }

        $attributes = [
            'exam_id' => $data['exam_id'],
            'module_id' => $data['module_id'] ?? null,
            'question_number' => $data['question_number'],
            'passage' => $data['passage'] ?? null,
            'type' => $data['type'] ?? 'single',
            'difficulty' => $data['difficulty'] ?? null,
            'question_text' => $data['question_text'] ?? '',
            'image_url' => $imageUrl,
            'explanation' => $data['explanation'] ?? null,
            'is_active' => (bool) ($request->input('is_active', true)),
            'score_weight' => $data['score_weight'],
        ];

        if ($request->user()->isDosen()) {
            $attributes += [
                'review_status' => QuestionReviewStatus::Draft,
                'review_note' => null,
                'reviewed_by' => null,
                'reviewed_at' => null,
            ];
        }

        $question->update($attributes);

        $this->updateOptions($question, $request);
        $this->syncTotalQuestions($question->exam_id);

        return redirect()
            ->route('admin.questions.index', ['exam_id' => $question->exam_id])
            ->with('success', $request->user()->isDosen()
                ? 'Soal diperbarui dan dikembalikan ke draf untuk direview ulang.'
                : 'Soal diperbarui.');
    }

    public function destroy(Question $question): RedirectResponse
    {
        $this->authorize('delete', $question);

        $examId = $question->exam_id;
        $question->delete();
        $this->syncTotalQuestions($examId);

        return back()->with('success', 'Soal dihapus.');
    }

    public function submitForReview(Request $request, Question $question, NotificationService $notificationService): RedirectResponse
    {
        $this->authorize('submitForReview', $question);

        if (! $question->review_status?->isEditableByDosen()) {
            return back()->with('error', 'Soal ini sudah dikirim atau sudah disetujui.');
        }

        $question->update([
            'review_status' => QuestionReviewStatus::Pending,
            'review_note' => null,
            'reviewed_by' => null,
            'reviewed_at' => null,
        ]);

        $notificationService->notifyQuestionSubmittedForReview($question, $request->user());

        return back()->with('success', 'Soal dikirim ke admin untuk direview.');
    }

    public function review(Request $request, Question $question, NotificationService $notificationService): RedirectResponse
    {
        $this->authorize('review', $question);

        $data = $request->validate([
            'decision' => ['required', 'in:approve,reject'],
            'review_note' => ['nullable', 'string', 'max:2000'],
        ]);

        if ($data['decision'] === 'reject' && empty(trim((string) ($data['review_note'] ?? '')))) {
            return back()->withErrors(['review_note' => 'Catatan review wajib diisi saat menolak soal.']);
        }

        $newStatus = $data['decision'] === 'approve'
            ? QuestionReviewStatus::Approved
            : QuestionReviewStatus::Rejected;

        $question->update([
            'review_status' => $newStatus,
            'review_note' => $data['review_note'] ?? null,
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        $notificationService->notifyQuestionReviewed($question, $request->user(), $newStatus->value, $data['review_note'] ?? null);

        return back()->with('success', $data['decision'] === 'approve'
            ? 'Soal disetujui.'
            : 'Soal ditolak dan dikembalikan ke dosen.');
    }

    public function import(Request $request, QuestionImportService $importService): RedirectResponse
    {
        $request->validate([
            'exam_id' => ['required', 'exists:exams,id'],
            'module_id' => ['nullable', 'exists:modules,id'],
            'file' => ['required', 'file', 'max:10240'],
        ]);

        $examId = (int) $request->input('exam_id');
        $moduleId = $request->input('module_id') ? (int) $request->input('module_id') : null;
        $exam = Exam::findOrFail($examId);
        $this->authorize('manageQuestions', $exam);

        $result = $importService->import(
            $request->file('file'),
            $examId,
            $moduleId,
            $request->user()->id,
            $request->user()->isDosen() ? QuestionReviewStatus::Draft : QuestionReviewStatus::Approved,
        );

        if ($result['imported'] === 0) {
            $msg = ! empty($result['errors']) ? implode(', ', $result['errors']) : 'Tidak ada soal yang berhasil diimport.';

            return back()->with('error', $msg);
        }

        $msg = "Berhasil mengimport {$result['imported']} soal.";
        if ($result['failed'] > 0) {
            $msg .= " ({$result['failed']} baris dilewati karena kosong atau tidak valid).";
        }

        return redirect()
            ->route('admin.questions.index', ['exam_id' => $examId])
            ->with('success', $msg);
    }

    public function template(): StreamedResponse
    {
        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="template-soal.csv"',
        ];

        return response()->streamDownload(function () {
            $output = fopen('php://output', 'w');
            // Write UTF-8 BOM so Excel opens it correctly
            fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF));

            fputcsv($output, [
                'question_text',
                'passage',
                'type',
                'image',
                'option_a',
                'option_b',
                'option_c',
                'option_d',
                'option_e',
                'option_a_image',
                'option_b_image',
                'option_c_image',
                'option_d_image',
                'option_e_image',
                'correct',
                'explanation',
                'difficulty',
                'module_code',
            ]);

            fputcsv($output, [
                'Berapa hasil dari 2 + 3?',
                '(opsional lembar bacaan / petikan di atas soal)',
                'single',
                '',
                '4',
                '5',
                '6',
                '7',
                '8',
                '',
                '',
                '',
                '',
                '',
                'B',
                'Penjelasan: 2 + 3 = 5.',
                'mudah',
                'umum',
            ]);

            fputcsv($output, [
                'Manakah dari berikut yang merupakan bilangan prima?',
                '',
                'multiple',
                '',
                '2',
                '3',
                '4',
                '9',
                '',
                '',
                '',
                '',
                '',
                '',
                'A,B',
                'Bilangan prima hanya habis dibagi 1 dan dirinya sendiri.',
                'sedang',
                'penalaran-matematika',
            ]);

            fclose($output);
        }, 'template-soal.csv', $headers);
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request, ?Question $question = null): array
    {
        $request->merge([
            'module_id' => $request->input('module_id') ?: null,
            'type' => $request->input('type') ?: 'single',
            'score_weight' => $request->input('score_weight') ?: 1,
        ]);

        return $request->validate([
            'exam_id' => ['required', 'exists:exams,id'],
            'module_id' => ['nullable', 'exists:modules,id'],
            'question_number' => [
                'required', 'integer', 'min:1',
                Rule::unique('questions')
                    ->where(fn ($query) => $query->where('exam_id', $request->input('exam_id')))
                    ->ignore($question?->id),
            ],
            'type' => ['required', Rule::in(Question::TYPES)],
            'difficulty' => ['nullable', Rule::in(Question::DIFFICULTIES)],
            'passage' => ['nullable', 'string'],
            'question_text' => ['required_without:image', 'nullable', 'string'],
            'score_weight' => ['required', 'numeric', 'min:0.1', 'max:100'],
            'image' => ['nullable', 'image', 'max:4096'],
            'explanation' => ['nullable', 'string'],
            'is_active' => ['boolean'],
            'options' => ['required', 'array', 'min:2'],
        ]);
    }

    /**
     * @return Collection<int, array{id: int, name: string, code: string, color: string, is_active: bool}>
     */
    private function moduleOptions()
    {
        return Module::orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'name', 'code', 'color', 'is_active']);
    }

    private function saveOptions(Question $question, Request $request): void
    {
        $optionsInput = $request->input('options', []);
        $optionsFiles = $request->file('options', []);
        $type = $request->input('type', 'single');
        $correctChoice = $request->input('correct');

        foreach ($optionsInput as $index => $opt) {
            $label = $opt['label'] ?? ('ABCDEF'[$index] ?? (string) $index);
            $text = $opt['text'] ?? $opt['option_text'] ?? null;
            $file = $optionsFiles[$index]['image'] ?? null;

            if ((! $text || trim((string) $text) === '') && ! $file) {
                continue;
            }

            $isCorrect = false;
            if ($type === 'multiple') {
                $isCorrect = ! empty($opt['correct']) || ! empty($opt['is_correct']);
            } else {
                $isCorrect = ($correctChoice === $label) || ! empty($opt['correct']) || ! empty($opt['is_correct']);
            }

            $question->options()->create([
                'label' => $label,
                'option_text' => $text,
                'image_url' => $this->storeImage($file),
                'is_correct' => (bool) $isCorrect,
            ]);
        }
    }

    private function updateOptions(Question $question, Request $request): void
    {
        $optionsInput = $request->input('options', []);
        $optionsFiles = $request->file('options', []);
        $type = $request->input('type', 'single');
        $correctChoice = $request->input('correct');

        $question->options()->delete();

        foreach ($optionsInput as $index => $opt) {
            $label = $opt['label'] ?? ('ABCDEF'[$index] ?? (string) $index);
            $text = $opt['text'] ?? $opt['option_text'] ?? null;
            $file = $optionsFiles[$index]['image'] ?? null;
            $existingImage = $opt['existing_image'] ?? $opt['image'] ?? null;

            if (! empty($opt['remove_image']) || ! empty($opt['image_remove'])) {
                $existingImage = null;
            }

            $imageUrl = $file ? $this->storeImage($file) : $existingImage;

            if ((! $text || trim((string) $text) === '') && ! $imageUrl) {
                continue;
            }

            $isCorrect = false;
            if ($type === 'multiple') {
                $isCorrect = ! empty($opt['correct']) || ! empty($opt['is_correct']);
            } else {
                $isCorrect = ($correctChoice === $label) || ! empty($opt['correct']) || ! empty($opt['is_correct']);
            }

            $question->options()->create([
                'label' => $label,
                'option_text' => $text,
                'image_url' => $imageUrl,
                'is_correct' => (bool) $isCorrect,
            ]);
        }
    }

    private function storeImage($file): ?string
    {
        if (! $file) {
            return null;
        }

        $path = $file->store('question-media', 'public');

        return Storage::disk('public')->url($path);
    }

    private function syncTotalQuestions(int $examId): void
    {
        Exam::whereKey($examId)->update([
            'total_questions' => Question::where('exam_id', $examId)->count(),
        ]);
    }
}
