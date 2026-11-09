<?php

namespace Tests\Feature;

use App\Models\Exam;
use App\Models\ExamSession;
use App\Models\InstitutionSetting;
use App\Models\Participant;
use App\Models\ParticipantCategory;
use App\Models\Question;
use App\Models\QuestionOption;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ExamFlowTest extends TestCase
{
    use RefreshDatabase;

    private Exam $exam;

    private Participant $participant;

    private Question $question;

    private QuestionOption $correctOption;

    protected function setUp(): void
    {
        parent::setUp();

        $this->exam = Exam::create([
            'title' => 'Ujian Matematika',
            'subject_name' => 'Matematika',
            'duration_minutes' => 60,
            'exam_date' => now()->subHour(),
            'exam_end_date' => now()->addHours(2),
            'is_active' => true,
            'randomize_questions' => false,
            'passing_grade' => 70,
        ]);

        $this->participant = Participant::create([
            'exam_number' => '2026001',
            'full_name' => 'Budi Santoso',
            'class_name' => 'XII IPA 1',
            'is_active' => true,
        ]);

        $this->question = Question::create([
            'exam_id' => $this->exam->id,
            'question_number' => 1,
            'question_text' => 'Berapakah $1 + 1$?',
            'score_weight' => 1,
        ]);

        $this->correctOption = QuestionOption::create([
            'question_id' => $this->question->id,
            'label' => 'A',
            'option_text' => '2',
            'is_correct' => true,
        ]);

        QuestionOption::create([
            'question_id' => $this->question->id,
            'label' => 'B',
            'option_text' => '3',
            'is_correct' => false,
        ]);
    }

    public function test_participant_can_login_answer_and_submit(): void
    {
        $this->post('/exam/login', [
            'exam_number' => '2026001',
            'full_name' => 'Budi Santoso',
        ])->assertRedirect('/exam/confirm');
        $this->post('/exam/start', ['exam_id' => $this->exam->id])->assertRedirect('/exam/workspace');

        $session = ExamSession::firstOrFail();

        $this->get('/exam/workspace')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('Exam/Workspace'));

        $this->postJson('/exam/answer', [
            'question_id' => $this->question->id,
            'selected_option_id' => $this->correctOption->id,
            'is_doubtful' => false,
        ])->assertOk()->assertJson(['saved' => true]);

        $this->postJson('/exam/submit')
            ->assertOk()
            ->assertJson(['submitted' => true]);

        $this->assertDatabaseHas('exam_results', [
            'session_id' => $session->id,
            'total_correct' => 1,
            'total_wrong' => 0,
            'total_empty' => 0,
            'final_score' => 100,
            'passing_status' => 'lulus',
        ]);

        $this->get('/exam/result')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('Exam/Result'));
    }

    public function test_three_violations_force_submit(): void
    {
        $this->post('/exam/login', [
            'exam_number' => '2026001',
            'full_name' => 'Budi Santoso',
        ])->assertRedirect('/exam/confirm');
        $this->post('/exam/start', ['exam_id' => $this->exam->id])->assertRedirect('/exam/workspace');

        $this->postJson('/exam/violation', ['type' => 'blur'])->assertOk()->assertJson(['forced' => false]);
        $this->postJson('/exam/violation', ['type' => 'tab_switch'])->assertOk()->assertJson(['forced' => false]);
        $this->postJson('/exam/violation', ['type' => 'fullscreen_exit'])->assertOk()->assertJson(['forced' => true]);

        $session = ExamSession::firstOrFail();

        $this->assertSame('forced_submit', $session->status);
        $this->assertDatabaseHas('exam_results', ['session_id' => $session->id]);
        $this->assertDatabaseCount('violation_logs', 3);
    }

    public function test_wrong_participant_name_is_rejected(): void
    {
        $this->post('/exam/login', [
            'exam_number' => '2026001',
            'full_name' => 'Nama Salah',
        ])->assertSessionHasErrors('full_name');

        $this->assertDatabaseCount('exam_sessions', 0);
    }

    public function test_participant_login_tolerates_messy_input(): void
    {
        $this->post('/exam/login', [
            'exam_number' => ' 2026001 ',
            'full_name' => '  budi   santoso  ',
        ])->assertRedirect('/exam/confirm');
        $this->post('/exam/start', ['exam_id' => $this->exam->id])->assertRedirect('/exam/workspace');

        $this->assertDatabaseCount('exam_sessions', 1);
    }

    public function test_participant_from_unallowed_category_is_rejected(): void
    {
        $category = ParticipantCategory::create([
            'name' => 'Prodi TI',
            'code' => 'prodi-ti',
            'is_active' => true,
        ]);

        $other = Participant::create([
            'exam_number' => '2026002',
            'full_name' => 'Ani Rahma',
            'class_name' => 'XII IPA 2',
            'category_id' => null,
            'is_active' => true,
        ]);

        $this->exam->participantCategories()->attach($category->id);

        $this->post('/exam/login', [
            'exam_number' => $other->exam_number,
            'full_name' => $other->full_name,
        ])->assertRedirect('/exam/confirm');
        $this->post('/exam/start', ['exam_id' => $this->exam->id])->assertSessionHasErrors('exam_id');

        $this->assertDatabaseCount('exam_sessions', 0);
    }

    public function test_participant_from_allowed_category_can_login(): void
    {
        $category = ParticipantCategory::create([
            'name' => 'Prodi TI',
            'code' => 'prodi-ti',
            'is_active' => true,
        ]);

        $this->participant->update(['category_id' => $category->id]);

        $this->exam->participantCategories()->attach($category->id);

        $this->post('/exam/login', [
            'exam_number' => '2026001',
            'full_name' => 'Budi Santoso',
        ])->assertRedirect('/exam/confirm');
        $this->post('/exam/start', ['exam_id' => $this->exam->id])->assertRedirect('/exam/workspace');

        $this->assertDatabaseCount('exam_sessions', 1);
    }

    public function test_exam_without_registered_categories_is_open_to_all_active_participants(): void
    {
        $this->assertSame(0, $this->exam->participantCategories()->count());

        $this->post('/exam/login', [
            'exam_number' => '2026001',
            'full_name' => 'Budi Santoso',
        ])->assertRedirect('/exam/confirm');
        $this->post('/exam/start', ['exam_id' => $this->exam->id])->assertRedirect('/exam/workspace');

        $this->assertDatabaseCount('exam_sessions', 1);
    }

    public function test_participant_cannot_login_before_exam_opens(): void
    {
        $this->exam->update([
            'exam_date' => now()->addDay(),
            'exam_end_date' => now()->addDay()->addHours(2),
        ]);

        $this->post('/exam/login', [
            'exam_number' => '2026001',
            'full_name' => 'Budi Santoso',
        ])->assertRedirect('/exam/confirm');
        $this->post('/exam/start', ['exam_id' => $this->exam->id])->assertSessionHasErrors('exam_id');

        $this->assertDatabaseCount('exam_sessions', 0);
    }

    public function test_participant_cannot_login_after_exam_closes(): void
    {
        $this->exam->update([
            'exam_date' => now()->subHours(3),
            'exam_end_date' => now()->subHour(),
        ]);

        $this->post('/exam/login', [
            'exam_number' => '2026001',
            'full_name' => 'Budi Santoso',
        ])->assertRedirect('/exam/confirm');
        $this->post('/exam/start', ['exam_id' => $this->exam->id])->assertSessionHasErrors('exam_id');

        $this->assertDatabaseCount('exam_sessions', 0);
    }

    public function test_participant_cannot_login_when_exam_is_not_scheduled(): void
    {
        $this->exam->update([
            'exam_date' => null,
            'exam_end_date' => null,
        ]);

        $this->post('/exam/login', [
            'exam_number' => '2026001',
            'full_name' => 'Budi Santoso',
        ])->assertRedirect('/exam/confirm');
        $this->post('/exam/start', ['exam_id' => $this->exam->id])->assertSessionHasErrors('exam_id');

        $this->assertDatabaseCount('exam_sessions', 0);
    }

    public function test_active_session_is_force_submitted_when_exam_window_closes(): void
    {
        $this->post('/exam/login', [
            'exam_number' => '2026001',
            'full_name' => 'Budi Santoso',
        ])->assertRedirect('/exam/confirm');
        $this->post('/exam/start', ['exam_id' => $this->exam->id])->assertRedirect('/exam/workspace');

        $this->exam->update(['exam_end_date' => now()->subMinute()]);

        $this->get('/exam/workspace')->assertRedirect('/exam/result');

        $this->assertSame('forced_submit', ExamSession::firstOrFail()->status);

        $this->get('/exam/result')->assertOk();
    }

    public function test_global_violation_limit_is_enforced(): void
    {
        InstitutionSetting::current()->update(['violation_limit' => 2]);

        $this->post('/exam/login', [
            'exam_number' => '2026001',
            'full_name' => 'Budi Santoso',
        ])->assertRedirect('/exam/confirm');
        $this->post('/exam/start', ['exam_id' => $this->exam->id])->assertRedirect('/exam/workspace');

        $this->postJson('/exam/violation', ['type' => 'blur'])->assertOk()->assertJson(['forced' => false]);
        $this->postJson('/exam/violation', ['type' => 'blur'])->assertOk()->assertJson(['forced' => true]);

        $this->assertSame('forced_submit', ExamSession::firstOrFail()->status);
    }

    public function test_per_exam_violation_limit_overrides_global(): void
    {
        InstitutionSetting::current()->update(['violation_limit' => 2]);
        $this->exam->update(['violation_limit' => 4, 'violations_enabled' => true]);

        $this->post('/exam/login', [
            'exam_number' => '2026001',
            'full_name' => 'Budi Santoso',
        ])->assertRedirect('/exam/confirm');
        $this->post('/exam/start', ['exam_id' => $this->exam->id])->assertRedirect('/exam/workspace');

        $this->postJson('/exam/violation', ['type' => 'blur'])->assertOk()->assertJson(['forced' => false]);
        $this->postJson('/exam/violation', ['type' => 'blur'])->assertOk()->assertJson(['forced' => false]);
        $this->postJson('/exam/violation', ['type' => 'blur'])->assertOk()->assertJson(['forced' => false]);
        $this->postJson('/exam/violation', ['type' => 'blur'])->assertOk()->assertJson(['forced' => true]);

        $this->assertSame('forced_submit', ExamSession::firstOrFail()->status);
    }

    public function test_disabling_violations_still_logs_but_never_forces_submit(): void
    {
        InstitutionSetting::current()->update([
            'violations_enabled' => false,
            'violation_limit' => 2,
        ]);

        $this->post('/exam/login', [
            'exam_number' => '2026001',
            'full_name' => 'Budi Santoso',
        ])->assertRedirect('/exam/confirm');
        $this->post('/exam/start', ['exam_id' => $this->exam->id])->assertRedirect('/exam/workspace');

        foreach (range(1, 4) as $attempt) {
            $this->postJson('/exam/violation', ['type' => 'blur'])->assertOk()->assertJson(['forced' => false]);
        }

        $this->assertSame('active', ExamSession::firstOrFail()->status);
        $this->assertDatabaseCount('violation_logs', 4);
    }

    public function test_per_exam_can_disable_violation_enforcement(): void
    {
        $this->exam->update(['violations_enabled' => false]);

        $this->post('/exam/login', [
            'exam_number' => '2026001',
            'full_name' => 'Budi Santoso',
        ])->assertRedirect('/exam/confirm');
        $this->post('/exam/start', ['exam_id' => $this->exam->id])->assertRedirect('/exam/workspace');

        foreach (range(1, 4) as $attempt) {
            $this->postJson('/exam/violation', ['type' => 'blur'])->assertOk()->assertJson(['forced' => false]);
        }

        $this->assertSame('active', ExamSession::firstOrFail()->status);
        $this->assertDatabaseCount('violation_logs', 4);
    }

    public function test_confirm_page_requires_verified_participant(): void
    {
        $this->get('/exam/confirm')->assertRedirect('/exam/login');
    }

    public function test_confirm_lists_only_exams_open_to_participant_category(): void
    {
        $category = ParticipantCategory::create([
            'name' => 'Prodi TI',
            'code' => 'prodi-ti',
            'is_active' => true,
        ]);

        $restricted = Exam::create([
            'title' => 'Ujian Terbatas Prodi TI',
            'subject_name' => 'Pemrograman',
            'duration_minutes' => 90,
            'exam_date' => now()->subHour(),
            'exam_end_date' => now()->addHours(2),
            'is_active' => true,
            'randomize_questions' => false,
            'passing_grade' => 70,
        ]);
        $restricted->participantCategories()->attach($category->id);

        $this->post('/exam/login', [
            'exam_number' => '2026001',
            'full_name' => 'Budi Santoso',
        ])->assertRedirect('/exam/confirm');

        $this->get('/exam/confirm')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Exam/Confirm')
                ->has('exams', 1)
                ->where('exams.0.id', $this->exam->id)
                ->where('participant.full_name', 'Budi Santoso')
                ->where('participant.exam_number', '2026001')
            );
    }

    public function test_confirm_lists_restricted_exam_for_matching_category(): void
    {
        $category = ParticipantCategory::create([
            'name' => 'Prodi TI',
            'code' => 'prodi-ti',
            'is_active' => true,
        ]);

        $this->participant->update(['category_id' => $category->id]);

        $restricted = Exam::create([
            'title' => 'Ujian Terbatas Prodi TI',
            'subject_name' => 'Pemrograman',
            'duration_minutes' => 90,
            'exam_date' => now()->subHour(),
            'exam_end_date' => now()->addHours(2),
            'is_active' => true,
            'randomize_questions' => false,
            'passing_grade' => 70,
        ]);
        $restricted->participantCategories()->attach($category->id);

        $this->post('/exam/login', [
            'exam_number' => '2026001',
            'full_name' => 'Budi Santoso',
        ]);

        $this->get('/exam/confirm')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Exam/Confirm')
                ->has('exams', 2)
                ->where('participant.category_name', 'Prodi TI')
            );
    }

    public function test_participant_cannot_start_ineligible_exam(): void
    {
        $category = ParticipantCategory::create([
            'name' => 'Prodi TI',
            'code' => 'prodi-ti',
            'is_active' => true,
        ]);

        $restricted = Exam::create([
            'title' => 'Ujian Terbatas Prodi TI',
            'subject_name' => 'Pemrograman',
            'duration_minutes' => 90,
            'exam_date' => now()->subHour(),
            'exam_end_date' => now()->addHours(2),
            'is_active' => true,
            'randomize_questions' => false,
            'passing_grade' => 70,
        ]);
        $restricted->participantCategories()->attach($category->id);

        $this->post('/exam/login', [
            'exam_number' => '2026001',
            'full_name' => 'Budi Santoso',
        ])->assertRedirect('/exam/confirm');

        $this->post('/exam/start', ['exam_id' => $restricted->id])
            ->assertSessionHasErrors('exam_id');

        $this->assertDatabaseCount('exam_sessions', 0);
    }

    public function test_reset_lookup_clears_confirmation_state(): void
    {
        $this->post('/exam/login', [
            'exam_number' => '2026001',
            'full_name' => 'Budi Santoso',
        ])->assertRedirect('/exam/confirm');

        $this->post('/exam/confirm/reset')->assertRedirect('/exam/login');

        $this->get('/exam/confirm')->assertRedirect('/exam/login');
    }

    public function test_check_number_reports_registered_participant(): void
    {
        $this->postJson('/exam/check-number', ['exam_number' => '2026001'])
            ->assertOk()
            ->assertJson(['registered' => true]);
    }

    public function test_check_number_reports_unknown_number(): void
    {
        $this->postJson('/exam/check-number', ['exam_number' => '9999999'])
            ->assertOk()
            ->assertJson(['registered' => false]);
    }

    public function test_check_number_ignores_inactive_participant(): void
    {
        $this->participant->update(['is_active' => false]);

        $this->postJson('/exam/check-number', ['exam_number' => '2026001'])
            ->assertOk()
            ->assertJson(['registered' => false]);
    }

    public function test_check_number_requires_exam_number(): void
    {
        $this->postJson('/exam/check-number', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('exam_number');
    }

    public function test_check_number_is_rate_limited(): void
    {
        for ($attempt = 0; $attempt < 30; $attempt++) {
            $this->postJson('/exam/check-number', ['exam_number' => '2026001'])->assertOk();
        }

        $this->postJson('/exam/check-number', ['exam_number' => '2026001'])->assertStatus(429);
    }

    public function test_answer_after_session_duration_expires_is_force_submitted(): void
    {
        $this->post('/exam/login', [
            'exam_number' => '2026001',
            'full_name' => 'Budi Santoso',
        ])->assertRedirect('/exam/confirm');
        $this->post('/exam/start', ['exam_id' => $this->exam->id])->assertRedirect('/exam/workspace');

        $this->travel(61)->minutes();

        $this->postJson('/exam/answer', [
            'question_id' => $this->question->id,
            'selected_option_id' => $this->correctOption->id,
        ])->assertStatus(409)->assertJsonPath('redirect', route('exam.result'));

        $session = ExamSession::firstOrFail();

        $this->assertSame('forced_submit', $session->status);
        $this->assertDatabaseHas('exam_results', ['session_id' => $session->id]);

        $this->get('/exam/result')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Exam/Result')
                ->where('sessionStatus', 'forced_submit')
            );
    }

    public function test_workspace_redirects_after_session_duration_expires(): void
    {
        $this->post('/exam/login', [
            'exam_number' => '2026001',
            'full_name' => 'Budi Santoso',
        ])->assertRedirect('/exam/confirm');
        $this->post('/exam/start', ['exam_id' => $this->exam->id])->assertRedirect('/exam/workspace');

        $this->travel(61)->minutes();

        $this->get('/exam/workspace')->assertRedirect('/exam/result');

        $this->assertSame('forced_submit', ExamSession::firstOrFail()->status);
    }

    public function test_heartbeat_reports_active_then_forces_submit_after_expiry(): void
    {
        $this->post('/exam/login', [
            'exam_number' => '2026001',
            'full_name' => 'Budi Santoso',
        ])->assertRedirect('/exam/confirm');
        $this->post('/exam/start', ['exam_id' => $this->exam->id])->assertRedirect('/exam/workspace');

        $this->getJson('/exam/heartbeat')->assertOk()->assertJson(['ok' => true]);

        $this->travel(61)->minutes();

        $this->getJson('/exam/heartbeat')
            ->assertStatus(409)
            ->assertJsonPath('redirect', route('exam.result'));

        $this->assertSame('forced_submit', ExamSession::firstOrFail()->status);
        $this->assertDatabaseCount('exam_results', 1);
    }

    public function test_sweep_command_force_submits_expired_sessions(): void
    {
        $this->post('/exam/login', [
            'exam_number' => '2026001',
            'full_name' => 'Budi Santoso',
        ])->assertRedirect('/exam/confirm');
        $this->post('/exam/start', ['exam_id' => $this->exam->id])->assertRedirect('/exam/workspace');

        $session = ExamSession::firstOrFail();

        $this->travel(61)->minutes();

        $this->artisan('exam:sweep-expired')->assertSuccessful();

        $this->assertSame('forced_submit', $session->fresh()->status);
        $this->assertDatabaseHas('exam_results', ['session_id' => $session->id]);
    }

    public function test_sweep_command_ignores_active_sessions(): void
    {
        $this->post('/exam/login', [
            'exam_number' => '2026001',
            'full_name' => 'Budi Santoso',
        ])->assertRedirect('/exam/confirm');
        $this->post('/exam/start', ['exam_id' => $this->exam->id])->assertRedirect('/exam/workspace');

        $this->artisan('exam:sweep-expired')->assertSuccessful();

        $this->assertSame('active', ExamSession::firstOrFail()->status);
        $this->assertDatabaseCount('exam_results', 0);
    }
}
