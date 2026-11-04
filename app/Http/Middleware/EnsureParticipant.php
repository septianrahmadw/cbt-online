<?php

namespace App\Http\Middleware;

use App\Models\ExamSession;
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

        if (! $examSession || ! $examSession->isActive()) {
            $request->session()->forget('exam_session_id');

            return redirect()->route('exam.login');
        }

        $request->attributes->set('examSession', $examSession);

        return $next($request);
    }
}
