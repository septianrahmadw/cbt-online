<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Exam;
use App\Models\ExamSession;
use App\Models\User;
use App\Services\ExamService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class SessionController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', ExamSession::class);

        $sessions = ExamSession::query()
            ->whereHas('exam', fn ($query) => $query->visibleTo($request->user()))
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

        $this->authorize('stop', $examSession);

        if ($data['action'] === 'delete') {
            $this->authorize('delete', $examSession);
        }

        if (! $examSession->isActive()) {
            return back()->with('error', 'Sesi ini sudah tidak aktif.');
        }

        $this->applyStop($examSession, $data['action'], actor: $request->user());

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

        $exam = Exam::findOrFail($data['exam_id']);
        $this->authorize('supervise', $exam);

        if ($data['action'] === 'delete' && ! $request->user()->isAdmin()) {
            abort(403, 'Hanya admin yang dapat menghapus sesi.');
        }

        $sessions = ExamSession::where('exam_id', $data['exam_id'])
            ->where('status', 'active')
            ->where('is_completed', false)
            ->lockForUpdate()
            ->get();

        if ($sessions->isEmpty()) {
            return back()->with('error', 'Tidak ada sesi berjalan untuk ujian ini.');
        }

        $actor = $request->user();

        DB::transaction(function () use ($sessions, $data, $actor) {
            foreach ($sessions as $session) {
                $this->applyStop($session, $data['action'], recordAudit: false);
            }

            AuditLog::record('exam.session_stop_all', $actor->role?->value, $actor->id, 'exam', (int) $data['exam_id'], [
                'action' => $data['action'],
                'sessions_affected' => $sessions->count(),
            ]);
        });

        return back()->with('success', $sessions->count().' sesi berjalan dihentikan.');
    }

    private function applyStop(ExamSession $session, string $action, bool $recordAudit = true, ?User $actor = null): void
    {
        if ($action === 'submit') {
            app(ExamService::class)->submit($session, true);
        } else {
            $session->delete();
        }

        if ($recordAudit) {
            $actor ??= auth()->user();

            AuditLog::record('exam.session_stopped', $actor?->role?->value, $actor?->id, 'exam_session', $session->id, [
                'action' => $action,
                'exam_id' => $session->exam_id,
                'participant_id' => $session->participant_id,
            ]);
        }
    }
}
