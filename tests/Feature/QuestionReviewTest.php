<?php

namespace Tests\Feature;

use App\Models\Exam;
use App\Models\Participant;
use App\Models\Question;
use App\Models\User;
use App\QuestionReviewStatus;
use App\Services\ExamService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Tests\TestCase;

class QuestionReviewTest extends TestCase
{
    use RefreshDatabase;

    public function test_dosen_question_requires_admin_review_before_use(): void
    {
        $admin = User::factory()->create();
        $dosen = User::factory()->dosen()->create();
        $exam = $this->createExam();
        $exam->assignedUsers()->attach($dosen->id, ['assigned_by' => $admin->id]);

        $this->actingAs($dosen)
            ->post('/admin/questions', [
                'exam_id' => $exam->id,
                'question_number' => 1,
                'question_text' => 'Berapakah 2 + 2?',
                'score_weight' => 1,
                'correct' => 'A',
                'options' => [
                    ['label' => 'A', 'text' => '4'],
                    ['label' => 'B', 'text' => '5'],
                ],
            ])
            ->assertRedirect('/admin/questions?exam_id='.$exam->id);

        $question = Question::firstOrFail();

        $this->assertSame(QuestionReviewStatus::Draft, $question->review_status);
        $this->assertSame($dosen->id, $question->created_by);

        $this->actingAs($dosen)
            ->post("/admin/questions/{$question->id}/submit-review")
            ->assertRedirect();

        $this->assertSame(QuestionReviewStatus::Pending, $question->fresh()->review_status);

        $this->actingAs($dosen)
            ->post("/admin/questions/{$question->id}/review", ['decision' => 'approve'])
            ->assertForbidden();

        $this->actingAs($admin)
            ->post("/admin/questions/{$question->id}/review", ['decision' => 'approve'])
            ->assertRedirect();

        $this->assertSame(QuestionReviewStatus::Approved, $question->fresh()->review_status);
        $this->assertSame($admin->id, $question->fresh()->reviewed_by);
    }

    public function test_admin_must_add_note_when_rejecting_question(): void
    {
        $admin = User::factory()->create();
        $question = Question::create([
            'exam_id' => $this->createExam()->id,
            'question_number' => 1,
            'question_text' => 'Soal perlu diperbaiki',
            'score_weight' => 1,
            'review_status' => QuestionReviewStatus::Pending,
        ]);

        $this->actingAs($admin)
            ->post("/admin/questions/{$question->id}/review", ['decision' => 'reject'])
            ->assertSessionHasErrors('review_note');

        $this->actingAs($admin)
            ->post("/admin/questions/{$question->id}/review", [
                'decision' => 'reject',
                'review_note' => 'Pilihan jawaban kurang tepat.',
            ])
            ->assertRedirect();

        $this->assertSame(QuestionReviewStatus::Rejected, $question->fresh()->review_status);
    }

    public function test_exam_start_only_uses_approved_active_questions(): void
    {
        $exam = $this->createExam();
        $participant = Participant::create([
            'exam_number' => '2026888',
            'full_name' => 'Peserta Review',
            'is_active' => true,
        ]);

        $approved = Question::create([
            'exam_id' => $exam->id,
            'question_number' => 1,
            'question_text' => 'Soal disetujui',
            'score_weight' => 1,
            'review_status' => QuestionReviewStatus::Approved,
            'is_active' => true,
        ]);

        Question::create([
            'exam_id' => $exam->id,
            'question_number' => 2,
            'question_text' => 'Soal menunggu review',
            'score_weight' => 1,
            'review_status' => QuestionReviewStatus::Pending,
            'is_active' => true,
        ]);

        $session = app(ExamService::class)->start($exam, $participant, Request::create('/exam/start', 'POST'));

        $this->assertCount(1, $session->sessionQuestions);
        $this->assertSame($approved->id, $session->sessionQuestions->first()->question_id);
    }

    private function createExam(): Exam
    {
        return Exam::create([
            'title' => 'Ujian Review',
            'subject_name' => 'Matematika',
            'duration_minutes' => 60,
            'exam_date' => now()->subHour(),
            'exam_end_date' => now()->addDay(),
            'is_active' => true,
            'randomize_questions' => false,
            'passing_grade' => 70,
        ]);
    }
}
