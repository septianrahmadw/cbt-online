<?php

namespace Tests\Feature;

use App\Models\Exam;
use App\Models\InstitutionSetting;
use App\Models\Module;
use App\Models\Question;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_pages_render_for_authenticated_user(): void
    {
        $this->actingAs(User::factory()->create());

        $this->get('/admin')->assertOk()->assertInertia(fn (Assert $page) => $page->component('Admin/Dashboard'));
        $this->get('/admin/participants')->assertOk()->assertInertia(fn (Assert $page) => $page->component('Admin/Participants'));
        $this->get('/admin/participant-categories')->assertOk()->assertInertia(fn (Assert $page) => $page->component('Admin/ParticipantCategories/Index'));
        $this->get('/admin/participant-categories/create')->assertOk()->assertInertia(fn (Assert $page) => $page->component('Admin/ParticipantCategories/Form'));
        $this->get('/admin/exams')->assertOk()->assertInertia(fn (Assert $page) => $page->component('Admin/Exams'));
        $this->get('/admin/exams/create')->assertOk()->assertInertia(fn (Assert $page) => $page->component('Admin/Exams/Form'));
        $this->get('/admin/modules')->assertOk()->assertInertia(fn (Assert $page) => $page->component('Admin/Modules/Index'));
        $this->get('/admin/questions')->assertOk()->assertInertia(fn (Assert $page) => $page->component('Admin/Questions'));
        $this->get('/admin/results')->assertOk()->assertInertia(fn (Assert $page) => $page->component('Admin/Results'));
        $this->get('/admin/settings')->assertOk()->assertInertia(fn (Assert $page) => $page->component('Admin/Settings'));
    }

    public function test_guests_are_redirected_to_admin_login(): void
    {
        $this->get('/admin')->assertRedirect('/admin/login');
    }

    public function test_admin_can_create_an_exam_and_a_question(): void
    {
        $this->actingAs(User::factory()->create());

        $this->from('/admin/exams')->post('/admin/exams', [
            'title' => 'Ujian Contoh',
            'subject_name' => 'Matematika',
            'duration_minutes' => 45,
            'exam_date' => now()->subHour()->format('Y-m-d\TH:i'),
            'exam_end_date' => now()->addDay()->format('Y-m-d\TH:i'),
            'is_active' => true,
            'randomize_questions' => false,
            'passing_grade' => 70,
        ])->assertRedirect('/admin/exams');

        $exam = Exam::where('title', 'Ujian Contoh')->firstOrFail();

        $this->post('/admin/questions', [
            'exam_id' => $exam->id,
            'question_number' => 1,
            'question_text' => 'Berapakah $2 + 2$?',
            'score_weight' => 1,
            'correct' => 'A',
            'options' => [
                'A' => ['text' => '4'],
                'B' => ['text' => '5'],
            ],
        ])->assertRedirect('/admin/questions?exam_id='.$exam->id);

        $this->assertDatabaseHas('questions', [
            'exam_id' => $exam->id,
            'question_number' => 1,
        ]);
        $this->assertDatabaseHas('question_options', [
            'label' => 'A',
            'is_correct' => true,
        ]);
    }

    public function test_admin_can_download_question_template(): void
    {
        $this->actingAs(User::factory()->create());

        $response = $this->get('/admin/questions/template');
        $response->assertOk();
        $this->assertStringContainsString('text/csv', (string) $response->headers->get('Content-Type'));
        $this->assertStringContainsString('template-soal.csv', (string) $response->headers->get('Content-Disposition'));
    }

    public function test_admin_can_filter_questions_by_module(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $exam = Exam::create([
            'title' => 'UTBK Sesi 1',
            'subject_name' => 'TPS',
            'duration_minutes' => 60,
            'exam_date' => now()->subHour(),
            'exam_end_date' => now()->addDay(),
            'is_active' => true,
            'randomize_questions' => false,
            'passing_grade' => 60,
        ]);

        $module1 = Module::create([
            'name' => 'Penalaran Matematika',
            'code' => 'penalaran-matematika',
            'color' => 'blue',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        $module2 = Module::create([
            'name' => 'Bahasa Indonesia',
            'code' => 'bahasa-indonesia',
            'color' => 'green',
            'sort_order' => 2,
            'is_active' => true,
        ]);

        Question::create([
            'exam_id' => $exam->id,
            'module_id' => $module1->id,
            'question_number' => 1,
            'question_text' => 'Soal 1 Matematika',
            'score_weight' => 1,
        ]);

        Question::create([
            'exam_id' => $exam->id,
            'module_id' => $module2->id,
            'question_number' => 2,
            'question_text' => 'Soal 2 Bahasa',
            'score_weight' => 1,
        ]);

        $this->get('/admin/questions?exam_id='.$exam->id.'&module_id='.$module1->id)
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Questions')
                ->has('questions', 1)
                ->where('questions.0.module.code', 'penalaran-matematika')
            );
    }

    public function test_admin_module_show_renders_statistics(): void
    {
        $this->actingAs(User::factory()->create());

        $module = Module::create([
            'name' => 'Umum',
            'code' => 'umum-test',
            'color' => 'brand',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        $exam = Exam::create([
            'title' => 'Ujian Stats',
            'subject_name' => 'Umum',
            'duration_minutes' => 30,
            'exam_date' => now()->subHour(),
            'exam_end_date' => now()->addDay(),
            'is_active' => true,
            'randomize_questions' => false,
            'passing_grade' => 60,
        ]);

        Question::create([
            'exam_id' => $exam->id,
            'module_id' => $module->id,
            'question_number' => 1,
            'type' => 'single',
            'difficulty' => 'mudah',
            'question_text' => 'Soal Mudah',
            'score_weight' => 1,
        ]);

        Question::create([
            'exam_id' => $exam->id,
            'module_id' => $module->id,
            'question_number' => 2,
            'type' => 'multiple',
            'difficulty' => 'sulit',
            'question_text' => 'Soal Sulit',
            'score_weight' => 1,
        ]);

        $this->get('/admin/modules/'.$module->id)
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Modules/Show')
                ->where('module.questions_count', 2)
                ->where('module.easy_count', 1)
                ->where('module.hard_count', 1)
                ->where('module.single_count', 1)
                ->where('module.multiple_count', 1)
            );
    }

    public function test_admin_can_import_questions_via_endpoint(): void
    {
        $this->actingAs(User::factory()->create());

        $exam = Exam::create([
            'title' => 'Ujian Endpoint Import',
            'subject_name' => 'Campuran',
            'duration_minutes' => 45,
            'exam_date' => now()->subHour(),
            'exam_end_date' => now()->addDay(),
            'is_active' => true,
            'randomize_questions' => false,
            'passing_grade' => 60,
        ]);

        $csv = implode("\n", [
            'question_text,passage,type,option_a,option_b,correct,explanation,difficulty',
            '"Ibu kota Indonesia saat ini?","","single","Jakarta","Bandung","A","Ibu kota adalah Jakarta","mudah"',
        ]);

        $file = UploadedFile::fake()->createWithContent('test_soal.csv', $csv);

        $response = $this->post('/admin/questions/import', [
            'exam_id' => $exam->id,
            'file' => $file,
        ]);

        $response->assertRedirect('/admin/questions?exam_id='.$exam->id);
        $this->assertDatabaseHas('questions', [
            'exam_id' => $exam->id,
            'question_text' => 'Ibu kota Indonesia saat ini?',
            'difficulty' => 'mudah',
        ]);
    }

    public function test_admin_can_update_violation_settings(): void
    {
        $this->actingAs(User::factory()->create());

        $this->post('/admin/settings', [
            'school_name' => 'SMK Contoh',
            'academic_year' => '2026/2027',
            'exam_event_name' => 'Ujian 2026',
            'passing_grade_default' => 75,
            'violations_enabled' => false,
            'violation_limit' => 5,
        ])->assertRedirect();

        $settings = InstitutionSetting::current();

        $this->assertFalse($settings->violations_enabled);
        $this->assertSame(5, $settings->violation_limit);
    }

    public function test_admin_exam_requires_schedule_window(): void
    {
        $this->actingAs(User::factory()->create());

        $this->from('/admin/exams/create')->post('/admin/exams', [
            'title' => 'Ujian Tanpa Jadwal',
            'subject_name' => 'Matematika',
            'duration_minutes' => 45,
            'is_active' => true,
            'passing_grade' => 70,
        ])->assertSessionHasErrors(['exam_date', 'exam_end_date']);
    }

    public function test_admin_exam_end_date_must_not_precede_start(): void
    {
        $this->actingAs(User::factory()->create());

        $this->from('/admin/exams/create')->post('/admin/exams', [
            'title' => 'Ujian Jadwal Terbalik',
            'subject_name' => 'Matematika',
            'duration_minutes' => 45,
            'exam_date' => now()->addDay()->format('Y-m-d\TH:i'),
            'exam_end_date' => now()->subDay()->format('Y-m-d\TH:i'),
            'is_active' => true,
            'passing_grade' => 70,
        ])->assertSessionHasErrors('exam_end_date');
    }
}
