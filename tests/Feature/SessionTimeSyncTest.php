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

class SessionTimeSyncTest extends TestCase
{
    use RefreshDatabase;

    public function test_workspace_heartbeat_and_admin_sessions_share_window_clamped_remaining_time(): void
    {
        $this->freezeTime();

        $exam = $this->createExam();
        $this->createParticipant();

        $this->post('/exam/login', [
            'exam_number' => '2026001',
            'full_name' => 'Budi Santoso',
        ])->assertRedirect('/exam/confirm');
        $this->post('/exam/start', ['exam_id' => $exam->id])->assertRedirect('/exam/workspace');

        $this->get('/exam/workspace')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Exam/Workspace')
                ->where('session.remaining_seconds', 600)
            );

        $this->getJson('/exam/heartbeat')
            ->assertOk()
            ->assertJsonPath('remaining_seconds', 600);

        $this->travel(5)->minutes();

        $this->getJson('/exam/heartbeat')
            ->assertOk()
            ->assertJsonPath('remaining_seconds', 300);

        $this->actingAs(User::factory()->create())
            ->get('/admin/sessions')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Sessions')
                ->where('sessions.0.remaining_seconds', 300)
            );
    }

    public function test_session_is_force_submitted_when_exam_window_closes_before_duration_ends(): void
    {
        $this->freezeTime();

        $exam = $this->createExam();
        $this->createParticipant();

        $this->post('/exam/login', [
            'exam_number' => '2026001',
            'full_name' => 'Budi Santoso',
        ])->assertRedirect('/exam/confirm');
        $this->post('/exam/start', ['exam_id' => $exam->id])->assertRedirect('/exam/workspace');

        $this->travel(11)->minutes();

        $this->get('/exam/workspace')->assertRedirect('/exam/result');

        $session = ExamSession::sole();

        $this->assertSame('forced_submit', $session->status);
        $this->assertTrue($session->is_completed);
        $this->assertSame(0, $session->secondsRemaining());
    }

    private function createExam(): Exam
    {
        $exam = Exam::create([
            'title' => 'Ujian Jendela Pendek',
            'subject_name' => 'Matematika',
            'duration_minutes' => 60,
            'exam_date' => now()->subHour(),
            'exam_end_date' => now()->addMinutes(10),
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

    private function createParticipant(): Participant
    {
        return Participant::create([
            'exam_number' => '2026001',
            'full_name' => 'Budi Santoso',
            'class_name' => 'XII IPA 1',
            'is_active' => true,
        ]);
    }
}
