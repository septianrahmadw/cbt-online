<?php

namespace App\Http\Middleware;

use App\Models\ExamSession;
use App\Services\ExamService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureParticipant
{
    public function handle(Request $request, Closure $next): Response
    {
        $sessionId = $request->session()->get('exam_session_id');

        if (! $sessionId) {
            return redirect()->route('exam.login');
        }

        $examSession = ExamSession::with(['exam', 'participant'])->find($sessionId);

        if (! $examSession) {
            $request->session()->forget('exam_session_id');

            return redirect()->route('exam.login');
        }

        if ($examSession->is_completed) {
            return redirect()->route('exam.result');
        }

        if (! $examSession->isActive()) {
            $request->session()->forget('exam_session_id');

            return redirect()->route('exam.login');
        }

        $examEndDate = $examSession->exam?->exam_end_date;

        if ($examEndDate !== null && now()->greaterThan($examEndDate)) {
            app(ExamService::class)->submit($examSession, true);
            $request->session()->forget('exam_session_id');

            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Waktu ujian telah berakhir. Jawaban Anda telah dikirim otomatis.',
                    'redirect' => route('exam.result'),
                ], 409);
            }

            return redirect()->route('exam.result');
        }

        $request->attributes->set('examSession', $examSession);

        return $next($request);
    }
}
