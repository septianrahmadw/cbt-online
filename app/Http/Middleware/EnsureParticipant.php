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
            return $this->unauthenticated($request);
        }

        $examSession = ExamSession::with(['exam', 'participant'])->find($sessionId);

        if (! $examSession) {
            $request->session()->forget('exam_session_id');

            return $this->unauthenticated($request);
        }

        if ($examSession->is_completed) {
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Ujian sudah selesai.',
                    'redirect' => route('exam.result'),
                ], 409);
            }

            return redirect()->route('exam.result');
        }

        if (! $examSession->isActive()) {
            $request->session()->forget('exam_session_id');

            return $this->unauthenticated($request);
        }

        if ($examSession->hasExpired()) {
            app(ExamService::class)->submit($examSession, true);

            $message = $this->expiryMessage($examSession);

            if ($request->expectsJson()) {
                return response()->json([
                    'message' => $message,
                    'redirect' => route('exam.result'),
                ], 409);
            }

            return redirect()->route('exam.result')->with('error', $message);
        }

        $request->attributes->set('examSession', $examSession);

        return $next($request);
    }

    private function expiryMessage(ExamSession $examSession): string
    {
        $examEndDate = $examSession->exam?->exam_end_date;

        if ($examEndDate !== null && now()->greaterThan($examEndDate)) {
            return 'Waktu ujian telah berakhir. Jawaban Anda telah dikirim otomatis.';
        }

        return 'Waktu sesi ujian Anda telah berakhir. Jawaban Anda telah dikirim otomatis.';
    }

    private function unauthenticated(Request $request): Response
    {
        if ($request->expectsJson()) {
            return response()->json([
                'message' => 'Sesi ujian tidak ditemukan.',
                'redirect' => route('exam.login'),
            ], 409);
        }

        return redirect()->route('exam.login');
    }
}
