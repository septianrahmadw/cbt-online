<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Exam;
use App\Models\ExamResult;
use App\Models\ExamSession;
use App\Models\Participant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ResultController extends Controller
{
    public function index(Request $request): Response
    {
        $exams = Exam::visibleTo($request->user())
            ->orderBy('title')
            ->get(['id', 'title', 'subject_name']);
        $selectedExamId = $request->integer('exam_id') ?: $exams->first()?->id;
        $selectedExam = $selectedExamId ? $exams->firstWhere('id', $selectedExamId) : null;

        if ($selectedExamId && ! $selectedExam) {
            abort(403, 'Anda tidak memiliki akses ke ujian ini.');
        }

        $results = $selectedExamId
            ? ExamResult::with(['participant:id,exam_number,full_name,class_name'])
                ->where('exam_id', $selectedExamId)
                ->orderByDesc('final_score')
                ->get()
            : collect();

        $visibleExamIds = $exams->pluck('id');

        $activeSessions = ExamSession::with(['participant:id,exam_number,full_name', 'exam:id,title'])
            ->whereIn('exam_id', $visibleExamIds)
            ->where('status', 'active')
            ->when($selectedExamId, fn ($query) => $query->where('exam_id', $selectedExamId))
            ->latest('start_time')
            ->get();

        $participants = $request->user()->isAdmin()
            ? Participant::orderBy('full_name')->get(['id', 'exam_number', 'full_name'])
            : collect();
        $totalParticipants = $request->user()->isAdmin()
            ? Participant::count()
            : ExamSession::whereIn('exam_id', $visibleExamIds)->distinct()->count('participant_id');

        return Inertia::render('Admin/Results', [
            'exams' => $exams,
            'selectedExamId' => $selectedExamId,
            'selectedExam' => $selectedExam,
            'results' => $results,
            'activeSessions' => $activeSessions,
            'participants' => $participants,
            'summary' => [
                'total_participants' => $totalParticipants,
                'total_completed' => $results->count(),
                'average' => $results->count() ? round((float) $results->avg('final_score'), 2) : 0,
                'passed' => $results->where('passing_status', 'lulus')->count(),
            ],
        ]);
    }

    public function export(Request $request): StreamedResponse
    {
        $examId = $request->integer('exam_id');
        $visibleExamIds = Exam::visibleTo($request->user())->pluck('id');

        if ($examId && ! $visibleExamIds->contains($examId)) {
            abort(403, 'Anda tidak memiliki akses ke ujian ini.');
        }

        $results = ExamResult::with(['participant:id,exam_number,full_name,class_name', 'exam:id,title,subject_name'])
            ->when($examId, fn ($query) => $query->where('exam_id', $examId))
            ->when(! $examId, fn ($query) => $query->whereIn('exam_id', $visibleExamIds))
            ->orderByDesc('final_score')
            ->get();

        return response()->streamDownload(function () use ($results) {
            $output = fopen('php://output', 'w');
            fputcsv($output, ['No Peserta', 'Nama', 'Kelas', 'Ujian', 'Benar', 'Salah', 'Kosong', 'Nilai', 'Status']);

            foreach ($results as $result) {
                fputcsv($output, [
                    $result->participant?->exam_number,
                    $result->participant?->full_name,
                    $result->participant?->class_name,
                    $result->exam?->title,
                    $result->total_correct,
                    $result->total_wrong,
                    $result->total_empty,
                    $result->final_score,
                    $result->passing_status === 'lulus' ? 'Lulus' : 'Belum Lulus',
                ]);
            }

            fclose($output);
        }, 'rekap-nilai-'.now()->format('Ymd-His').'.csv', [
            'Content-Type' => 'text/csv',
        ]);
    }

    public function print(Request $request): Response
    {
        $examId = $request->integer('exam_id');
        $visibleExamIds = Exam::visibleTo($request->user())->pluck('id');

        if ($examId && ! $visibleExamIds->contains($examId)) {
            abort(403, 'Anda tidak memiliki akses ke ujian ini.');
        }

        $results = ExamResult::with(['participant:id,exam_number,full_name,class_name', 'exam:id,title,subject_name'])
            ->when($examId, fn ($query) => $query->where('exam_id', $examId))
            ->when(! $examId, fn ($query) => $query->whereIn('exam_id', $visibleExamIds))
            ->orderByDesc('final_score')
            ->get();

        return Inertia::render('Admin/ResultPrint', [
            'results' => $results,
            'examTitle' => $results->first()?->exam?->title,
        ]);
    }

    public function reset(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'exam_id' => ['required', 'exists:exams,id'],
            'participant_id' => ['required', 'exists:participants,id'],
        ]);

        $exam = Exam::findOrFail($data['exam_id']);
        $this->authorize('reset', $exam);

        $deleted = DB::transaction(function () use ($data) {
            $sessions = ExamSession::where('exam_id', $data['exam_id'])
                ->where('participant_id', $data['participant_id'])
                ->get();

            foreach ($sessions as $session) {
                $session->delete();
            }

            ExamResult::where('exam_id', $data['exam_id'])
                ->where('participant_id', $data['participant_id'])
                ->delete();

            AuditLog::record('exam.reset', 'admin', auth()->id(), 'participant', $data['participant_id'], [
                'exam_id' => $data['exam_id'],
                'sessions_deleted' => $sessions->count(),
            ]);

            return $sessions->count();
        });

        return back()->with('success', "Status peserta direset. {$deleted} sesi dihapus.");
    }
}
