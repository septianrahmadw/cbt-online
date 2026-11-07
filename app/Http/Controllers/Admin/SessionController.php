<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\ExamSession;
use App\Services\ExamService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class SessionController extends Controller
{
    public function index(): Response
    {
        $sessions = ExamSession::query()
            ->with([
                'participant:id,exam_number,full_name,class_name',
                'exam:id,title,subject_name,is_active,duration_minutes',
                'violations' => fn ($query) => $query->latest('occurred_at')->limit(1),
            ])
            ->withCount([
                'sessionQuestions as total_questions',
                'answers as answered_count' => fn ($query) => $query->whereNotNull('selected_option_id'),
            ])
            ->where('status', 'active')
            ->where('is_completed', false)
            ->latest('start_time')
            ->get()
            ->map(fn (ExamSession $session) => [
                'id' => $session->id,
                'start_time' => $session->start_time?->toIso8601String(),
                'remaining_seconds' => $session->secondsRemaining(),
                'violations_count' => $session->violations_count,
                'last_violation_type' => $session->violations->first()?->type,
                'answered_count' => (int) $session->answered_count,
                'total_questions' => (int) $session->total_questions,
                'participant' => $session->participant?->only(['id', 'exam_number', 'full_name', 'class_name']),
                'exam' => $session->exam?->only(['id', 'title', 'subject_name', 'is_active', 'duration_minutes']),
            ])
            ->values();

        return Inertia::render('Admin/Sessions', [
            'sessions' => $sessions,
            'serverTime' => now()->toIso8601String(),
        ]);
    }

    public function stop(Request $request, ExamSession $examSession): RedirectResponse
    {
        $data = $request->validate([
            'action' => ['required', 'in:submit,delete'],
        ]);

        if (! $examSession->isActive()) {
            return back()->with('error', 'Sesi ini sudah tidak aktif.');
        }

        $this->applyStop($examSession, $data['action']);

        return back()->with('success', $data['action'] === 'submit'
            ? 'Sesi dihentikan dan jawaban dikirim untuk dinilai.'
            : 'Sesi dihapus. Peserta dapat login kembali jika ujian masih dibuka.');
    }

    public function stopAll(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'exam_id' => ['required', 'exists:exams,id'],
            'action' => ['required', 'in:submit,delete'],
        ]);

        $sessions = ExamSession::where('exam_id', $data['exam_id'])
            ->where('status', 'active')
            ->where('is_completed', false)
            ->lockForUpdate()
            ->get();

        if ($sessions->isEmpty()) {
            return back()->with('error', 'Tidak ada sesi berjalan untuk ujian ini.');
        }

        DB::transaction(function () use ($sessions, $data) {
            foreach ($sessions as $session) {
                $this->applyStop($session, $data['action'], recordAudit: false);
            }

            AuditLog::record('exam.session_stop_all', 'admin', auth()->id(), 'exam', (int) $data['exam_id'], [
                'action' => $data['action'],
                'sessions_affected' => $sessions->count(),
            ]);
        });

        return back()->with('success', $sessions->count().' sesi berjalan dihentikan.');
    }

    private function applyStop(ExamSession $session, string $action, bool $recordAudit = true): void
    {
        if ($action === 'submit') {
            app(ExamService::class)->submit($session, true);
        } else {
            $session->delete();
        }

        if ($recordAudit) {
            AuditLog::record('exam.session_stopped', 'admin', auth()->id(), 'exam_session', $session->id, [
                'action' => $action,
                'exam_id' => $session->exam_id,
                'participant_id' => $session->participant_id,
            ]);
        }
    }
}
