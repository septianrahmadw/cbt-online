<?php

namespace Tests\Feature;

use App\Events\ExamSessionHeartbeat;
use App\Models\Exam;
use App\Models\ExamSession;
use App\Models\Participant;
use App\Models\Question;
use App\Models\QuestionOption;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SessionRealtimeTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_sessions_page_shares_every_visible_exam_for_realtime_subscription(): void
    {
        $admin = User::factory()->create();
        $activeExam = Exam::factory()->create(['is_active' => true, 'title' => 'Ujian Aktif']);
        $inactiveExam = Exam::factory()->inactive()->create(['title' => 'Ujian Nonaktif']);

        $this->actingAs($admin)
            ->get('/admin/sessions')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Sessions')
                ->has('exams', 2)
                ->where('exams.0.id', $activeExam->id)
                ->where('exams.1.id', $inactiveExam->id)
            );
    }

    public function test_supervisor_only_receives_assigned_exams_for_realtime_subscription(): void
    {
        $supervisor = User::factory()->pengawas()->create();
        $assignedExam = Exam::factory()->create(['title' => 'Ujian Diawasi']);
        $otherExam = Exam::factory()->create(['title' => 'Ujian Lain']);

        $assignedExam->assignedUsers()->attach($supervisor->id);

        $this->actingAs($supervisor)
            ->get('/admin/sessions')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Sessions')
                ->has('exams', 1)
                ->where('exams.0.id', $assignedExam->id)
            );

        $this->assertNotSame($assignedExam->id, $otherExam->id);
    }

    public function test_admin_can_authorize_private_session_monitoring_channel(): void
    {
        config([
            'broadcasting.default' => 'reverb',
            'broadcasting.connections.reverb.key' => 'test-key',
            'broadcasting.connections.reverb.secret' => 'test-secret',
            'broadcasting.connections.reverb.app_id' => 'test-app',
        ]);

        $admin = User::factory()->create();
        $exam = Exam::factory()->create();

        $this->actingAs($admin)
            ->postJson('/broadcasting/auth', [
                'socket_id' => '1234.5678',
                'channel_name' => "private-exam.{$exam->id}.sessions",
            ])
            ->assertOk()
            ->assertJsonStructure(['auth']);
    }

    public function test_participant_cannot_authorize_private_session_monitoring_channel(): void
    {
        config([
            'broadcasting.default' => 'reverb',
            'broadcasting.connections.reverb.key' => 'test-key',
            'broadcasting.connections.reverb.secret' => 'test-secret',
            'broadcasting.connections.reverb.app_id' => 'test-app',
        ]);

        $exam = Exam::factory()->create();

        $this->actingAs(User::factory()->dosen()->create())
            ->postJson('/broadcasting/auth', [
                'socket_id' => '1234.5678',
                'channel_name' => "private-exam.{$exam->id}.sessions",
            ])
            ->assertForbidden();
    }

    public function test_saving_an_answer_broadcasts_progress_to_monitoring_channels(): void
    {
        Event::fake([ExamSessionHeartbeat::class]);

        $exam = $this->createOpenExam(2);
        $session = $this->loginToExam($exam);

        $question = Question::where('exam_id', $exam->id)->orderBy('question_number')->firstOrFail();
        $option = QuestionOption::where('question_id', $question->id)->firstOrFail();

        $this->postJson('/exam/answer', [
            'question_id' => $question->id,
            'selected_option_id' => $option->id,
            'is_doubtful' => false,
        ])->assertOk();

        Event::assertDispatched(
            ExamSessionHeartbeat::class,
            fn (ExamSessionHeartbeat $event) => $event->session->id === $session->id,
        );
    }

    public function test_heartbeat_payload_contains_live_progress_and_total_questions(): void
    {
        $exam = $this->createOpenExam(2);
        $session = $this->loginToExam($exam);

        $question = Question::where('exam_id', $exam->id)->orderBy('question_number')->firstOrFail();
        $option = QuestionOption::where('question_id', $question->id)->firstOrFail();

        $this->postJson('/exam/answer', [
            'question_id' => $question->id,
            'selected_option_id' => $option->id,
            'is_doubtful' => false,
        ])->assertOk();

        $payload = (new ExamSessionHeartbeat($session))->broadcastWith();

        $this->assertSame($session->id, $payload['session_id']);
        $this->assertSame($exam->id, $payload['exam_id']);
        $this->assertSame(1, $payload['answered_count']);
        $this->assertSame(2, $payload['total_questions']);
        $this->assertSame('active', $payload['status']);
    }

    public function test_queued_heartbeat_keeps_answer_counts_after_queue_serialization(): void
    {
        $exam = $this->createOpenExam(2);
        $session = $this->loginToExam($exam);

        $question = Question::where('exam_id', $exam->id)->orderBy('question_number')->firstOrFail();
        $option = QuestionOption::where('question_id', $question->id)->firstOrFail();

        $this->postJson('/exam/answer', [
            'question_id' => $question->id,
            'selected_option_id' => $option->id,
            'is_doubtful' => false,
        ])->assertOk();

        // Event broadcast melewati queue: SerializesModels memuat ulang model dari database,
        // jadi payload harus tetap menghitung progres tanpa bergantung pada hasil loadCount().
        $restored = unserialize(serialize(new ExamSessionHeartbeat($session)));
        $payload = $restored->broadcastWith();

        $this->assertSame(1, $payload['answered_count']);
        $this->assertSame(2, $payload['total_questions']);
    }

    private function createOpenExam(int $questionCount = 1): Exam
    {
        $exam = Exam::factory()->create([
            'title' => 'Ujian Realtime',
            'duration_minutes' => 60,
            'exam_date' => now()->subHour(),
            'exam_end_date' => now()->addHours(2),
            'is_active' => true,
            'randomize_questions' => false,
        ]);

        for ($number = 1; $number <= $questionCount; $number++) {
            $question = Question::factory()->approved()->create([
                'exam_id' => $exam->id,
                'question_number' => $number,
            ]);

            QuestionOption::factory()->correct()->create([
                'question_id' => $question->id,
                'label' => 'A',
            ]);
        }

        return $exam;
    }

    private function loginToExam(Exam $exam): ExamSession
    {
        $participant = Participant::create([
            'exam_number' => '2026901',
            'full_name' => 'Peserta Realtime',
            'class_name' => 'XII IPA 1',
            'is_active' => true,
        ]);

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
