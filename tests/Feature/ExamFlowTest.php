<?php

namespace Tests\Feature;

use App\Models\Exam;
use App\Models\ExamSession;
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
            'exam_id' => $this->exam->id,
            'exam_number' => '2026001',
            'full_name' => 'Budi Santoso',
        ])->assertRedirect('/exam/workspace');

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
            'exam_id' => $this->exam->id,
            'exam_number' => '2026001',
            'full_name' => 'Budi Santoso',
        ]);

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
            'exam_id' => $this->exam->id,
            'exam_number' => '2026001',
            'full_name' => 'Nama Salah',
        ])->assertSessionHasErrors('full_name');

        $this->assertDatabaseCount('exam_sessions', 0);
    }

    public function test_participant_login_tolerates_messy_input(): void
    {
        $this->post('/exam/login', [
            'exam_id' => $this->exam->id,
            'exam_number' => ' 2026001 ',
            'full_name' => '  budi   santoso  ',
        ])->assertRedirect('/exam/workspace');

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
            'exam_id' => $this->exam->id,
            'exam_number' => $other->exam_number,
            'full_name' => $other->full_name,
        ])->assertSessionHasErrors('exam_id');

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
            'exam_id' => $this->exam->id,
            'exam_number' => '2026001',
            'full_name' => 'Budi Santoso',
        ])->assertRedirect('/exam/workspace');

        $this->assertDatabaseCount('exam_sessions', 1);
    }

    public function test_exam_without_registered_categories_is_open_to_all_active_participants(): void
    {
        $this->assertSame(0, $this->exam->participantCategories()->count());

        $this->post('/exam/login', [
            'exam_id' => $this->exam->id,
            'exam_number' => '2026001',
            'full_name' => 'Budi Santoso',
        ])->assertRedirect('/exam/workspace');

        $this->assertDatabaseCount('exam_sessions', 1);
    }
}
