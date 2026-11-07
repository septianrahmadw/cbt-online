<?php

namespace App\Http\Controllers\Exam;

use App\Http\Controllers\Controller;
use App\Models\Exam;
use App\Models\Participant;
use App\Services\ExamService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class AuthController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('Exam/Login');
    }

    public function checkNumber(Request $request): JsonResponse
    {
        $request->merge([
            'exam_number' => is_string($request->input('exam_number')) ? trim($request->input('exam_number')) : $request->input('exam_number'),
        ]);

        $data = $request->validate([
            'exam_number' => ['required', 'string', 'max:50'],
        ]);

        $registered = Participant::where('exam_number', $data['exam_number'])
            ->where('is_active', true)
            ->exists();

        return response()->json(['registered' => $registered]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->merge([
            'exam_number' => is_string($request->input('exam_number')) ? trim($request->input('exam_number')) : $request->input('exam_number'),
            'full_name' => is_string($request->input('full_name')) ? $this->normalizeName($request->input('full_name')) : $request->input('full_name'),
        ]);

        $data = $request->validate([
            'exam_number' => ['required', 'string', 'max:50'],
            'full_name' => ['required', 'string', 'max:150'],
        ]);

        $participant = $this->findParticipant($data['exam_number'], $data['full_name']);

        if ($participant instanceof RedirectResponse) {
            return $participant;
        }

        $request->session()->put('exam_lookup_participant_id', $participant->id);

        return redirect()->route('exam.confirm');
    }

    public function confirm(Request $request): Response|RedirectResponse
    {
        $participant = $this->lookupParticipant($request);

        if (! $participant) {
            return redirect()->route('exam.login');
        }

        $participant->load('category:id,name,code');

        $exams = Exam::eligibleFor($participant)
            ->withCount('questions')
            ->orderBy('exam_date')
            ->get(['id', 'title', 'subject_name', 'duration_minutes', 'passing_grade', 'total_questions', 'exam_date', 'exam_end_date'])
            ->map(fn (Exam $exam) => [
                'id' => $exam->id,
                'title' => $exam->title,
                'subject_name' => $exam->subject_name,
                'duration_minutes' => $exam->duration_minutes,
                'passing_grade' => $exam->passing_grade,
                'questions_count' => $exam->questions_count,
                'exam_date' => $exam->exam_date?->toIso8601String(),
                'exam_end_date' => $exam->exam_end_date?->toIso8601String(),
                'window_state' => $exam->windowState(),
            ]);

        return Inertia::render('Exam/Confirm', [
            'participant' => [
                'exam_number' => $participant->exam_number,
                'full_name' => $participant->full_name,
                'class_name' => $participant->class_name,
                'category_name' => $participant->category?->name,
            ],
            'exams' => $exams,
            'serverTime' => now()->toIso8601String(),
        ]);
    }

    public function start(Request $request, ExamService $examService): RedirectResponse
    {
        $data = $request->validate([
            'exam_id' => ['required', 'exists:exams,id'],
        ]);

        $participant = $this->lookupParticipant($request);

        if (! $participant) {
            return redirect()->route('exam.login');
        }

        $exam = Exam::eligibleFor($participant)->find($data['exam_id']);

        if (! $exam) {
            return back()->withErrors(['exam_id' => 'Ujian tidak tersedia untuk kategori Anda atau tidak aktif.']);
        }

        $windowState = $exam->windowState();

        if ($windowState === 'unscheduled') {
            return back()->withErrors(['exam_id' => 'Ujian belum dijadwalkan. Hubungi admin.']);
        }

        if ($windowState === 'not_open') {
            return back()->withErrors(['exam_id' => 'Ujian belum dibuka. Ujian mulai pada '.$exam->exam_date?->translatedFormat('d M Y H:i').' WIB.']);
        }

        if ($windowState === 'closed') {
            return back()->withErrors(['exam_id' => 'Ujian sudah ditutup sejak '.$exam->exam_end_date?->translatedFormat('d M Y H:i').' WIB.']);
        }

        try {
            $session = $examService->start($exam, $participant, $request);
        } catch (RuntimeException $exception) {
            return back()->withErrors(['exam_id' => $exception->getMessage()]);
        }

        $request->session()->forget('exam_lookup_participant_id');
        $request->session()->put('exam_session_id', $session->id);
        $request->session()->regenerate();

        return redirect()->route('exam.workspace');
    }

    public function resetLookup(Request $request): RedirectResponse
    {
        $request->session()->forget('exam_lookup_participant_id');

        return redirect()->route('exam.login');
    }

    public function destroy(Request $request): RedirectResponse
    {
        $request->session()->forget('exam_session_id');

        return redirect()->route('exam.login');
    }

    private function findParticipant(string $examNumber, string $fullName): Participant|RedirectResponse
    {
        $participant = Participant::where('exam_number', $examNumber)
            ->where('is_active', true)
            ->first();

        if (! $participant) {
            return back()->withErrors([
                'exam_number' => 'Anda Tidak Terdaftar / Nomor Ujian Salah.',
            ])->withInput();
        }

        if (mb_strtolower($this->normalizeName($participant->full_name)) !== mb_strtolower($fullName)) {
            return back()->withErrors([
                'full_name' => 'Nama peserta tidak cocok dengan nomor peserta.',
            ])->withInput();
        }

        return $participant;
    }

    private function lookupParticipant(Request $request): ?Participant
    {
        $id = $request->session()->get('exam_lookup_participant_id');

        if (! $id) {
            return null;
        }

        return Participant::where('is_active', true)->find($id);
    }

    private function normalizeName(string $name): string
    {
        $name = str_replace("\u{00a0}", ' ', $name);
        $name = preg_replace('/\s+/', ' ', $name) ?? $name;

        return trim($name);
    }
}
