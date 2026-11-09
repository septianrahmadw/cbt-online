<?php

namespace Tests\Feature;

use App\Models\Exam;
use App\Models\ExamSession;
use App\Models\Participant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class RoleAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_dosen_only_sees_and_manages_assigned_exams(): void
    {
        $dosen = User::factory()->dosen()->create();
        $assignedExam = $this->createExam('Ujian Dosen');
        $otherExam = $this->createExam('Ujian Lain');

        $assignedExam->assignedUsers()->attach($dosen->id, ['assigned_by' => null]);

        $this->actingAs($dosen)
            ->get('/admin/exams')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Exams')
                ->has('exams.data', 1)
                ->where('exams.data.0.id', $assignedExam->id)
            );

        $this->actingAs($dosen)
            ->get('/admin/questions?exam_id='.$assignedExam->id)
            ->assertOk();

        $this->actingAs($dosen)
            ->get('/admin/questions?exam_id='.$otherExam->id)
            ->assertForbidden();

        $this->actingAs($dosen)->get('/admin/exams/create')->assertForbidden();
        $this->actingAs($dosen)->get('/admin/users')->assertForbidden();
        $this->actingAs($dosen)->get('/admin/sessions')->assertForbidden();
    }

    public function test_pengawas_can_monitor_assigned_exam_but_cannot_delete_sessions(): void
    {
        $pengawas = User::factory()->pengawas()->create();
        $exam = $this->createExam('Ujian Pengawas');
        $exam->assignedUsers()->attach($pengawas->id, ['assigned_by' => null]);

        $session = $this->createActiveSession($exam, '2026999', 'Peserta Pengawas');

        $this->actingAs($pengawas)
            ->get('/admin/sessions')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Sessions')
                ->has('sessions', 1)
                ->where('sessions.0.id', $session->id)
            );

        $this->actingAs($pengawas)
            ->post("/admin/sessions/{$session->id}/stop", ['action' => 'delete'])
            ->assertForbidden();

        $this->actingAs($pengawas)->get('/admin/questions')->assertForbidden();
        $this->actingAs($pengawas)->get('/admin/exams/create')->assertForbidden();
    }

    public function test_pengawas_stop_records_actual_actor_role(): void
    {
        $pengawas = User::factory()->pengawas()->create();
        $exam = $this->createExam('Ujian Pengawas Audit');
        $exam->assignedUsers()->attach($pengawas->id, ['assigned_by' => null]);

        $session = $this->createActiveSession($exam, '2026998', 'Peserta Audit');

        $this->actingAs($pengawas)
            ->from('/admin/sessions')
            ->post("/admin/sessions/{$session->id}/stop", ['action' => 'submit'])
            ->assertRedirect('/admin/sessions');

        $this->assertDatabaseHas('audit_logs', [
            'action' => 'exam.session_stopped',
            'actor_type' => 'pengawas',
            'actor_id' => $pengawas->id,
        ]);
    }

    private function createExam(string $title): Exam
    {
        return Exam::create([
            'title' => $title,
            'subject_name' => 'Matematika',
            'duration_minutes' => 60,
            'exam_date' => now()->subHour(),
            'exam_end_date' => now()->addDay(),
            'is_active' => true,
            'randomize_questions' => false,
            'passing_grade' => 70,
        ]);
    }

    private function createActiveSession(Exam $exam, string $examNumber, string $fullName): ExamSession
    {
        $participant = Participant::create([
            'exam_number' => $examNumber,
            'full_name' => $fullName,
            'is_active' => true,
        ]);

        return ExamSession::create([
            'exam_id' => $exam->id,
            'participant_id' => $participant->id,
            'start_time' => now(),
            'remaining_seconds' => 3600,
            'is_completed' => false,
            'violations_count' => 0,
            'status' => 'active',
        ]);
    }
}
