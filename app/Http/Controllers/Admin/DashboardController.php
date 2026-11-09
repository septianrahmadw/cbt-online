<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Exam;
use App\Models\ExamResult;
use App\Models\ExamSession;
use App\Models\Participant;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $visibleExamIds = $user->isAdmin()
            ? null
            : Exam::visibleTo($user)->pluck('id')->all();

        $totalParticipants = $user->isAdmin()
            ? Participant::count()
            : ExamSession::whereIn('exam_id', $visibleExamIds)
                ->distinct()
                ->count('participant_id');
        $totalExams = $user->isAdmin()
            ? Exam::count()
            : count($visibleExamIds);
        $completed = ExamResult::query()
            ->when($visibleExamIds !== null, fn ($query) => $query->whereIn('exam_id', $visibleExamIds))
            ->count();
        $averageScore = round((float) (ExamResult::query()
            ->when($visibleExamIds !== null, fn ($query) => $query->whereIn('exam_id', $visibleExamIds))
            ->avg('final_score') ?? 0), 2);

        $recentResults = ExamResult::with(['exam:id,title,subject_name', 'participant:id,exam_number,full_name'])
            ->when($visibleExamIds !== null, fn ($query) => $query->whereIn('exam_id', $visibleExamIds))
            ->latest('completed_at')
            ->limit(8)
            ->get();

        $exams = Exam::visibleTo($user)
            ->withCount(['questions', 'results', 'sessions'])
            ->latest()
            ->limit(6)
            ->get();

        $scoreDistribution = $this->scoreDistribution($visibleExamIds);

        $activeSessions = ExamSession::with(['participant:id,exam_number,full_name', 'exam:id,title'])
            ->when($visibleExamIds !== null, fn ($query) => $query->whereIn('exam_id', $visibleExamIds))
            ->where('status', 'active')
            ->latest('start_time')
            ->limit(6)
            ->get();

        return Inertia::render('Admin/Dashboard', [
            'stats' => [
                'total_participants' => $totalParticipants,
                'total_exams' => $totalExams,
                'completed' => $completed,
                'not_started' => max(0, $totalParticipants - $completed),
                'average_score' => $averageScore,
                'active_sessions' => $activeSessions->count(),
            ],
            'recentResults' => $recentResults,
            'exams' => $exams,
            'scoreDistribution' => $scoreDistribution,
            'activeSessions' => $activeSessions,
        ]);
    }

    /**
     * @param  array<int, int>|null  $visibleExamIds
     * @return array<int, array{label: string, count: int}>
     */
    private function scoreDistribution(?array $visibleExamIds): array
    {
        $buckets = array_fill(0, 11, 0);
        $scores = ExamResult::query()
            ->when($visibleExamIds !== null, fn ($query) => $query->whereIn('exam_id', $visibleExamIds))
            ->pluck('final_score');

        foreach ($scores as $score) {
            $index = min(10, max(0, (int) floor((float) $score / 10)));
            $buckets[$index]++;
        }

        $labels = ['0–9', '10–19', '20–29', '30–39', '40–49', '50–59', '60–69', '70–79', '80–89', '90–99', '100'];

        return collect($labels)
            ->map(fn (string $label, int $index) => ['label' => $label, 'count' => $buckets[$index]])
            ->values()
            ->all();
    }
}
