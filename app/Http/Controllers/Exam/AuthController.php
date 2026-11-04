<?php

namespace App\Http\Controllers\Exam;

use App\Http\Controllers\Controller;
use App\Models\Exam;
use App\Models\Participant;
use App\Services\ExamService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class AuthController extends Controller
{
    public function create(): Response
    {
        $exams = Exam::where('is_active', true)
            ->withCount('questions')
            ->orderBy('title')
            ->get(['id', 'title', 'subject_name', 'duration_minutes', 'total_questions']);

        return Inertia::render('Exam/Login', [
            'exams' => $exams,
        ]);
    }

    public function store(Request $request, ExamService $examService): RedirectResponse
    {
        $request->merge([
            'exam_number' => is_string($request->input('exam_number')) ? trim($request->input('exam_number')) : $request->input('exam_number'),
            'full_name' => is_string($request->input('full_name')) ? $this->normalizeName($request->input('full_name')) : $request->input('full_name'),
        ]);

        $data = $request->validate([
            'exam_id' => ['required', 'exists:exams,id'],
            'exam_number' => ['required', 'string', 'max:50'],
            'full_name' => ['required', 'string', 'max:150'],
        ]);

        $exam = Exam::where('is_active', true)->find($data['exam_id']);

        if (! $exam) {
            return back()->withErrors(['exam_id' => 'Ujian tidak aktif atau tidak ditemukan.'])->withInput();
        }

        $participant = Participant::where('exam_number', $data['exam_number'])
            ->where('is_active', true)
            ->first();

        if (! $participant) {
            return back()->withErrors([
                'exam_number' => 'Data tidak ditemukan - No Peserta tidak ada di Database.',
            ])->withInput();
        }

        if (mb_strtolower($this->normalizeName($participant->full_name)) !== mb_strtolower($data['full_name'])) {
            return back()->withErrors([
                'full_name' => 'Nama peserta tidak cocok dengan nomor peserta.',
            ])->withInput();
        }

        $exam->loadCount('participantCategories');

        if ($exam->participant_categories_count > 0) {
            $allowed = $exam->participantCategories()
                ->where('participant_categories.id', $participant->category_id)
                ->exists();

            if (! $allowed) {
                return back()->withErrors([
                    'exam_id' => 'Kategori Anda tidak terdaftar untuk ujian ini. Hubungi admin.',
                ])->withInput();
            }
        }

        try {
            $session = $examService->start($exam, $participant, $request);
        } catch (RuntimeException $exception) {
            return back()->withErrors(['exam_number' => $exception->getMessage()])->withInput();
        }

        $request->session()->put('exam_session_id', $session->id);
        $request->session()->regenerate();

        return redirect()->route('exam.workspace');
    }

    public function destroy(Request $request): RedirectResponse
    {
        $request->session()->forget('exam_session_id');

        return redirect()->route('exam.login');
    }

    private function normalizeName(string $name): string
    {
        $name = str_replace("\u{00a0}", ' ', $name);
        $name = preg_replace('/\s+/', ' ', $name) ?? $name;

        return trim($name);
    }
}
