<?php

namespace Tests\Feature;

use App\Models\Exam;
use App\Models\Module;
use App\Models\Question;
use App\Services\QuestionImportService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class QuestionImportTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_import_questions_from_csv(): void
    {
        $exam = Exam::create([
            'title' => 'Ujian Tryout',
            'subject_name' => 'Matematika',
            'duration_minutes' => 60,
            'exam_date' => now()->addDay(),
            'is_active' => true,
            'randomize_questions' => false,
            'passing_grade' => 70,
        ]);

        $module = Module::create([
            'name' => 'Penalaran Matematika',
            'code' => 'penalaran-matematika',
            'color' => 'blue',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        $csvContent = implode("\n", [
            'question_text,passage,type,image,option_a,option_b,option_c,option_d,option_e,correct,explanation,difficulty,module_code',
            '"Berapa 2+3?","(opsional bacaan)","single","","4","5","6","7","8","B","2+3=5","mudah","penalaran-matematika"',
            '"Pilih bilangan prima","","multiple","","2","3","4","6","","A,B","2 dan 3 prima","sedang","penalaran-matematika"',
        ]);

        $file = UploadedFile::fake()->createWithContent('soal.csv', $csvContent);

        $service = new QuestionImportService;
        $result = $service->import($file, $exam->id);

        $this->assertEquals(2, $result['imported']);
        $this->assertEquals(0, $result['failed']);

        $this->assertDatabaseHas('questions', [
            'exam_id' => $exam->id,
            'question_text' => 'Berapa 2+3?',
            'type' => 'single',
            'difficulty' => 'mudah',
            'module_id' => $module->id,
            'passage' => '(opsional bacaan)',
            'explanation' => '2+3=5',
        ]);

        $this->assertDatabaseHas('questions', [
            'exam_id' => $exam->id,
            'question_text' => 'Pilih bilangan prima',
            'type' => 'multiple',
            'difficulty' => 'sedang',
        ]);

        $q1 = Question::where('question_text', 'Berapa 2+3?')->first();
        $this->assertCount(5, $q1->options);
        $this->assertTrue($q1->options->firstWhere('label', 'B')->is_correct);
        $this->assertFalse($q1->options->firstWhere('label', 'A')->is_correct);

        $q2 = Question::where('question_text', 'Pilih bilangan prima')->first();
        $this->assertCount(4, $q2->options);
        $this->assertTrue($q2->options->firstWhere('label', 'A')->is_correct);
        $this->assertTrue($q2->options->firstWhere('label', 'B')->is_correct);
        $this->assertFalse($q2->options->firstWhere('label', 'C')->is_correct);
    }

    public function test_can_import_questions_from_xlsx(): void
    {
        if (! file_exists('/tmp/template.xlsx')) {
            $this->markTestSkipped('Sample template.xlsx not available');
        }

        $exam = Exam::create([
            'title' => 'Ujian Template',
            'subject_name' => 'Umum',
            'duration_minutes' => 60,
            'exam_date' => now()->addDay(),
            'is_active' => true,
            'randomize_questions' => false,
            'passing_grade' => 70,
        ]);

        $file = new UploadedFile(
            '/tmp/template.xlsx',
            'template.xlsx',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            null,
            true
        );

        $service = new QuestionImportService;
        $result = $service->import($file, $exam->id);

        $this->assertGreaterThan(0, $result['imported']);
        $this->assertDatabaseHas('questions', [
            'exam_id' => $exam->id,
            'question_text' => 'Berapa hasil dari 2 + 3?',
        ]);
    }
}
