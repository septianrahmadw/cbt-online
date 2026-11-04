<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\Exam;
use App\Models\ExamResult;
use App\Models\ExamSession;
use App\Models\ExamSessionQuestion;
use App\Models\Participant;
use App\Models\ViolationLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;

class ExamService
{
    public function start(Exam $exam, Participant $participant, Request $request): ExamSession
    {
        if (ExamResult::where('exam_id', $exam->id)->where('participant_id', $participant->id)->exists()) {
            throw new RuntimeException('Anda sudah mengikuti ujian ini. Hubungi admin untuk mengulang.');
        }

        $session = DB::transaction(function () use ($exam, $participant, $request) {
            $existing = ExamSession::where('exam_id', $exam->id)
                ->where('participant_id', $participant->id)
                ->where('status', 'active')
                ->lockForUpdate()
                ->first();

            if ($existing) {
                return $existing;
            }

            $questions = $exam->questions()->get();

            if ($questions->isEmpty()) {
                throw new RuntimeException('Soal untuk ujian ini belum tersedia.');
            }

            $session = ExamSession::create([
                'exam_id' => $exam->id,
                'participant_id' => $participant->id,
                'start_time' => now(),
                'remaining_seconds' => $exam->duration_minutes * 60,
                'is_completed' => false,
                'violations_count' => 0,
                'status' => 'active',
                'ip_address' => $request->ip(),
                'user_agent' => Str::limit((string) $request->userAgent(), 250, ''),
            ]);

            $ordered = $exam->randomize_questions ? $questions->shuffle() : $questions->values();

            foreach ($ordered->values() as $index => $question) {
                ExamSessionQuestion::create([
                    'session_id' => $session->id,
                    'question_id' => $question->id,
                    'display_order' => $index + 1,
                ]);
            }

            AuditLog::record('exam.start', 'participant', $participant->id, 'exam_session', $session->id, [
                'exam_id' => $exam->id,
            ]);

            return $session;
        });

        return $session->load(['exam', 'participant', 'sessionQuestions.question.options', 'answers']);
    }

    public function submit(ExamSession $session, bool $forced = false): ExamResult
    {
        return DB::transaction(function () use ($session, $forced) {
            $session = ExamSession::whereKey($session->id)->lockForUpdate()->firstOrFail();

            if ($session->is_completed) {
                return $session->result()->firstOrFail();
            }

            $session->load(['exam', 'sessionQuestions.question.options', 'answers']);
            $answers = $session->answers->keyBy('question_id');

            $totalWeight = 0.0;
            $correctWeight = 0.0;
            $correct = 0;
            $wrong = 0;
            $empty = 0;

            foreach ($session->sessionQuestions as $sessionQuestion) {
                $question = $sessionQuestion->question;

                if (! $question) {
                    continue;
                }

                $totalWeight += (float) $question->score_weight;
                $answer = $answers->get($question->id);
                $correctOptionId = $question->options->firstWhere('is_correct', true)?->id;

                if (! $answer || ! $answer->selected_option_id) {
                    $empty++;

                    continue;
                }

                if ((int) $answer->selected_option_id === (int) $correctOptionId) {
                    $correct++;
                    $correctWeight += (float) $question->score_weight;
                } else {
                    $wrong++;
                }
            }

            $score = $totalWeight > 0 ? round(($correctWeight / $totalWeight) * 100, 2) : 0.0;
            $passingStatus = $score >= $session->exam->passing_grade ? 'lulus' : 'belum_lulus';

            $session->update([
                'status' => $forced ? 'forced_submit' : 'submitted',
                'is_completed' => true,
                'end_time' => now(),
                'remaining_seconds' => 0,
            ]);

            $result = ExamResult::updateOrCreate(
                ['session_id' => $session->id],
                [
                    'exam_id' => $session->exam_id,
                    'participant_id' => $session->participant_id,
                    'total_correct' => $correct,
                    'total_wrong' => $wrong,
                    'total_empty' => $empty,
                    'final_score' => $score,
                    'passing_status' => $passingStatus,
                    'completed_at' => now(),
                ]
            );

            AuditLog::record(
                $forced ? 'exam.forced_submit' : 'exam.submit',
                'participant',
                $session->participant_id,
                'exam_session',
                $session->id,
                ['score' => $score, 'status' => $passingStatus]
            );

            return $result;
        });
    }

    /**
     * @return array{violations: int, forced: bool}
     */
    public function recordViolation(ExamSession $session, string $type, int $durationSeconds = 0, array $metadata = []): array
    {
        $allowed = ['blur', 'fullscreen_exit', 'tab_switch', 'shortcut'];

        if (! in_array($type, $allowed, true)) {
            $type = 'blur';
        }

        return DB::transaction(function () use ($session, $type, $durationSeconds, $metadata) {
            $session = ExamSession::whereKey($session->id)->lockForUpdate()->first();

            if (! $session || ! $session->isActive()) {
                return ['violations' => $session?->violations_count ?? 0, 'forced' => false];
            }

            ViolationLog::create([
                'session_id' => $session->id,
                'type' => $type,
                'duration_seconds' => max(0, $durationSeconds),
                'metadata' => $metadata,
                'occurred_at' => now(),
            ]);

            $session->increment('violations_count');
            $session->refresh();

            $forced = false;

            if ($session->violations_count >= 3) {
                $this->submit($session, true);
                $forced = true;
            }

            return ['violations' => $session->violations_count, 'forced' => $forced];
        });
    }
}
