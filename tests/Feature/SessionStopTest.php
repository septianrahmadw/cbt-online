<?php

namespace Tests\Feature;

use App\Models\Exam;
use App\Models\ExamSession;
use App\Models\Participant;
use App\Models\Question;
use App\Models\QuestionOption;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SessionStopTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_view_sessions_page(): void
    {
        $this->actingAs(User::factory()->create());

        $this->get('/admin/sessions')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('Admin/Sessions'));
    }

    public function test_guests_are_redirected_to_admin_login(): void
    {
        $this->get('/admin/sessions')->assertRedirect('/admin/login');
    }

    public function test_admin_can_force_submit_a_running_session(): void
    {
        $exam = $this->createOpenExam();
        $participant = $this->createParticipant('2026101', 'Budi Santoso');
        $session = $this->loginToExam($exam, $participant);

        $this->actingAs(User::factory()->create());

        $this->from('/admin/sessions')
            ->post("/admin/sessions/{$session->id}/stop", ['action' => 'submit'])
            ->assertRedirect('/admin/sessions')
            ->assertSessionHas('success');

        $this->assertSame('forced_submit', $session->fresh()->status);
        $this->assertDatabaseHas('exam_results', ['session_id' => $session->id]);
        $this->assertDatabaseHas('audit_logs', ['action' => 'exam.session_stopped']);
    }

    public function test_admin_can_delete_a_running_session_without_result(): void
    {
        $exam = $this->createOpenExam();
        $participant = $this->createParticipant('2026102', 'Ani Rahma');
        $session = $this->loginToExam($exam, $participant);

        $question = Question::where('exam_id', $exam->id)->firstOrFail();
        $option = QuestionOption::where('question_id', $question->id)->firstOrFail();

        $this->postJson('/exam/answer', [
            'question_id' => $question->id,
            'selected_option_id' => $option->id,
            'is_doubtful' => false,
        ])->assertOk();

        $this->actingAs(User::factory()->create());

        $this->from('/admin/sessions')
            ->post("/admin/sessions/{$session->id}/stop", ['action' => 'delete'])
            ->assertRedirect('/admin/sessions')
            ->assertSessionHas('success');

        $this->assertDatabaseMissing('exam_sessions', ['id' => $session->id]);
        $this->assertDatabaseMissing('student_answers', ['session_id' => $session->id]);
        $this->assertDatabaseCount('exam_results', 0);
        $this->assertDatabaseHas('audit_logs', ['action' => 'exam.session_stopped']);
    }

    public function test_stop_all_submits_only_running_sessions_of_selected_exam(): void
    {
        $examA = $this->createOpenExam('Ujian A');
        $examB = $this->createOpenExam('Ujian B');

        $participantA1 = $this->createParticipant('2026103', 'Peserta A1');
        $participantA2 = $this->createParticipant('2026104', 'Peserta A2');
        $participantB = $this->createParticipant('2026105', 'Peserta B');

        $sessionA1 = $this->loginToExam($examA, $participantA1);
        $sessionA2 = $this->loginToExam($examA, $participantA2);
        $sessionB = $this->loginToExam($examB, $participantB);

        $sessionA2->update(['status' => 'submitted', 'is_completed' => true]);

        $this->actingAs(User::factory()->create());

        $this->from('/admin/sessions')
            ->post('/admin/sessions/stop-all', ['exam_id' => $examA->id, 'action' => 'submit'])
            ->assertRedirect('/admin/sessions')
            ->assertSessionHas('success');

        $this->assertSame('forced_submit', $sessionA1->fresh()->status);
        $this->assertSame('submitted', $sessionA2->fresh()->status);
        $this->assertSame('active', $sessionB->fresh()->status);
        $this->assertDatabaseHas('audit_logs', ['action' => 'exam.session_stop_all']);
    }

    public function test_stop_all_can_delete_sessions_without_results(): void
    {
        $examA = $this->createOpenExam('Ujian Hapus');
        $examB = $this->createOpenExam('Ujian Biarkan');

        $participantA = $this->createParticipant('2026106', 'Peserta Hapus');
        $participantB = $this->createParticipant('2026107', 'Peserta Biarkan');

        $sessionA = $this->loginToExam($examA, $participantA);
        $sessionB = $this->loginToExam($examB, $participantB);

        $this->actingAs(User::factory()->create());

        $this->from('/admin/sessions')
            ->post('/admin/sessions/stop-all', ['exam_id' => $examA->id, 'action' => 'delete'])
            ->assertRedirect('/admin/sessions')
            ->assertSessionHas('success');

        $this->assertDatabaseMissing('exam_sessions', ['id' => $sessionA->id]);
        $this->assertDatabaseHas('exam_sessions', ['id' => $sessionB->id, 'status' => 'active']);
        $this->assertDatabaseCount('exam_results', 0);
    }

    public function test_stop_rejects_invalid_action(): void
    {
        $exam = $this->createOpenExam();
        $session = $this->loginToExam($exam, $this->createParticipant('2026108', 'Peserta Validasi'));

        $this->actingAs(User::factory()->create());

        $this->from('/admin/sessions')
            ->post("/admin/sessions/{$session->id}/stop", ['action' => 'nonsense'])
            ->assertSessionHasErrors('action');
    }

    public function test_stop_all_rejects_unknown_exam(): void
    {
        $this->actingAs(User::factory()->create());

        $this->from('/admin/sessions')
            ->post('/admin/sessions/stop-all', ['exam_id' => 999999, 'action' => 'submit'])
            ->assertSessionHasErrors('exam_id');
    }

    public function test_stopping_an_inactive_session_fails_gracefully(): void
    {
        $exam = $this->createOpenExam();
        $session = $this->loginToExam($exam, $this->createParticipant('2026109', 'Peserta Selesai'));
        $session->update(['status' => 'submitted', 'is_completed' => true]);

        $this->actingAs(User::factory()->create());

        $this->from('/admin/sessions')
            ->post("/admin/sessions/{$session->id}/stop", ['action' => 'submit'])
            ->assertRedirect('/admin/sessions')
            ->assertSessionHas('error');

        $this->assertSame('submitted', $session->fresh()->status);
    }

    private function createOpenExam(string $title = 'Ujian Terbuka'): Exam
    {
        $exam = Exam::create([
            'title' => $title,
            'subject_name' => 'Matematika',
            'duration_minutes' => 60,
            'exam_date' => now()->subHour(),
            'exam_end_date' => now()->addHours(2),
            'is_active' => true,
            'randomize_questions' => false,
            'passing_grade' => 70,
        ]);

        $question = Question::create([
            'exam_id' => $exam->id,
            'question_number' => 1,
            'question_text' => 'Berapakah $1 + 1$?',
            'score_weight' => 1,
        ]);

        QuestionOption::create([
            'question_id' => $question->id,
            'label' => 'A',
            'option_text' => '2',
            'is_correct' => true,
        ]);

        return $exam;
    }

    private function createParticipant(string $examNumber, string $fullName): Participant
    {
        return Participant::create([
            'exam_number' => $examNumber,
            'full_name' => $fullName,
            'class_name' => 'XII IPA 1',
            'is_active' => true,
        ]);
    }

    private function loginToExam(Exam $exam, Participant $participant): ExamSession
    {
        $this->post('/exam/login', [
            'exam_number' => $participant->exam_number,
            'full_name' => $participant->full_name,
        ])->assertRedirect('/exam/confirm');
        $this->post('/exam/start', ['exam_id' => $exam->id])->assertRedirect('/exam/workspace');

        return ExamSession::where('exam_id', $exam->id)
            ->where('participant_id', $participant->id)
            ->sole();
    }
}
