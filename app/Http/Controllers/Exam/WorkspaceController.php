<?php

namespace App\Http\Controllers\Exam;

use App\Http\Controllers\Controller;
use App\Models\ExamSession;
use App\Models\ExamSessionQuestion;
use App\Models\QuestionOption;
use App\Models\StudentAnswer;
use App\Services\ExamService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class WorkspaceController extends Controller
{
    public function index(Request $request): Response|RedirectResponse
    {
        /** @var ExamSession $session */
        $session = $request->attributes->get('examSession');

        if ($session->hasExpired()) {
            app(ExamService::class)->submit($session, true);

            return redirect()->route('exam.result');
        }

        $session->load([
            'exam',
            'participant',
            'sessionQuestions.question.options',
            'answers',
        ]);

        $answers = $session->answers->keyBy('question_id');

        $questions = $session->sessionQuestions->map(function (ExamSessionQuestion $item) use ($answers) {
            $question = $item->question;
            $answer = $answers->get($question->id);

            return [
                'id' => $question->id,
                'number' => $item->display_order,
                'question_number' => $question->question_number,
                'passage' => $question->passage,
                'text' => $question->question_text,
                'image_url' => $question->image_url,
                'score_weight' => (float) $question->score_weight,
                'options' => $question->options->map(fn (QuestionOption $option) => [
                    'id' => $option->id,
                    'label' => $option->label,
                    'text' => $option->option_text,
                    'image_url' => $option->image_url,
                ])->values(),
                'answer' => [
                    'selected_option_id' => $answer?->selected_option_id,
                    'is_doubtful' => (bool) ($answer?->is_doubtful ?? false),
                ],
            ];
        })->values();

        $violationSettings = $session->exam->effectiveViolationSettings();

        return Inertia::render('Exam/Workspace', [
            'session' => [
                'id' => $session->id,
                'remaining_seconds' => $session->secondsRemaining(),
                'violations_count' => $session->violations_count,
            ],
            'violationSettings' => $violationSettings,
            'examEndsAt' => $session->exam->exam_end_date?->toIso8601String(),
            'exam' => $session->exam->only(['id', 'title', 'subject_name', 'duration_minutes', 'passing_grade']),
            'participant' => $session->participant->only(['id', 'exam_number', 'full_name', 'class_name']),
            'questions' => $questions,
            'serverTime' => now()->toIso8601String(),
        ]);
    }

    public function heartbeat(Request $request): JsonResponse
    {
        /** @var ExamSession $session */
        $session = $request->attributes->get('examSession');

        return response()->json([
            'ok' => true,
            'remaining_seconds' => $session->secondsRemaining(),
            'exam_ends_at' => $session->exam?->exam_end_date?->toIso8601String(),
            'server_time' => now()->toIso8601String(),
        ]);
    }

    public function answer(Request $request): JsonResponse
    {
        /** @var ExamSession $session */
        $session = $request->attributes->get('examSession');

        $data = $request->validate([
            'question_id' => ['required', 'integer'],
            'selected_option_id' => ['nullable', 'integer'],
            'is_doubtful' => ['boolean'],
        ]);

        $belongsToSession = ExamSessionQuestion::where('session_id', $session->id)
            ->where('question_id', $data['question_id'])
            ->exists();

        abort_unless($belongsToSession, 422, 'Soal tidak termasuk dalam sesi ini.');

        if (! empty($data['selected_option_id'])) {
            $optionValid = QuestionOption::where('id', $data['selected_option_id'])
                ->where('question_id', $data['question_id'])
                ->exists();

            abort_unless($optionValid, 422, 'Opsi jawaban tidak valid.');
        }

        $answer = DB::transaction(function () use ($session, $data) {
            return StudentAnswer::updateOrCreate(
                [
                    'session_id' => $session->id,
                    'question_id' => $data['question_id'],
                ],
                [
                    'selected_option_id' => $data['selected_option_id'] ?? null,
                    'is_doubtful' => (bool) ($data['is_doubtful'] ?? false),
                    'answered_at' => now(),
                ]
            );
        });

        return response()->json([
            'saved' => true,
            'answered_at' => $answer->answered_at?->toIso8601String(),
        ]);
    }

    public function violation(Request $request, ExamService $examService): JsonResponse
    {
        /** @var ExamSession $session */
        $session = $request->attributes->get('examSession');

        $data = $request->validate([
            'type' => ['required', 'in:blur,fullscreen_exit,tab_switch,shortcut'],
            'duration_seconds' => ['nullable', 'integer', 'min:0', 'max:3600'],
            'metadata' => ['nullable', 'array'],
        ]);

        $result = $examService->recordViolation(
            $session,
            $data['type'],
            (int) ($data['duration_seconds'] ?? 0),
            $data['metadata'] ?? []
        );

        return response()->json([
            'violations' => $result['violations'],
            'forced' => $result['forced'],
            'redirect' => $result['forced'] ? route('exam.result') : null,
        ]);
    }

    public function submit(Request $request, ExamService $examService): JsonResponse|RedirectResponse
    {
        /** @var ExamSession $session */
        $session = $request->attributes->get('examSession');

        $examService->submit($session, false);

        if ($request->expectsJson()) {
            return response()->json(['submitted' => true, 'redirect' => route('exam.result')]);
        }

        return redirect()->route('exam.result');
    }
}
