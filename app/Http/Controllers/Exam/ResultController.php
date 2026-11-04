<?php

namespace App\Http\Controllers\Exam;

use App\Http\Controllers\Controller;
use App\Models\ExamResult;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ResultController extends Controller
{
    public function show(Request $request): Response|RedirectResponse
    {
        $sessionId = $request->session()->get('exam_session_id');

        if (! $sessionId) {
            return redirect()->route('exam.login');
        }

        $result = ExamResult::with(['exam', 'participant'])
            ->where('session_id', $sessionId)
            ->first();

        if (! $result) {
            return redirect()->route('exam.workspace');
        }

        return Inertia::render('Exam/Result', [
            'result' => [
                'final_score' => (float) $result->final_score,
                'passing_status' => $result->passing_status,
                'total_correct' => $result->total_correct,
                'total_wrong' => $result->total_wrong,
                'total_empty' => $result->total_empty,
                'completed_at' => $result->completed_at?->toIso8601String(),
            ],
            'exam' => $result->exam->only(['id', 'title', 'subject_name', 'passing_grade']),
            'participant' => $result->participant->only(['id', 'exam_number', 'full_name', 'class_name']),
        ]);
    }
}
