<?php

namespace Database\Seeders;

use App\Models\Exam;
use App\Models\InstitutionSetting;
use App\Models\Participant;
use App\Models\ParticipantCategory;
use App\Models\Question;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@cbt.test'],
            [
                'name' => 'Administrator',
                'password' => Hash::make('password'),
            ]
        );

        InstitutionSetting::current()->update([
            'school_name' => 'Universitas Contoh Nusantara',
            'academic_year' => '2026/2027',
            'exam_event_name' => 'Ujian Tertulis Berbasis Komputer 2026',
            'passing_grade_default' => 70,
        ]);

        $categories = [
            ['name' => 'Umum', 'code' => 'umum', 'description' => 'Peserta umum'],
            ['name' => 'Gelombang 1', 'code' => 'gelombang-1', 'description' => 'Peserta UTBK Gelombang 1'],
            ['name' => 'Prodi TI', 'code' => 'prodi-ti', 'description' => 'Peserta Program Studi Teknik Informatika'],
            ['name' => 'Prodi TL', 'code' => 'prodi-tl', 'description' => 'Peserta Program Studi Teknik Listrik'],
        ];

        foreach ($categories as $category) {
            ParticipantCategory::updateOrCreate(
                ['code' => $category['code']],
                ['name' => $category['name'], 'description' => $category['description'], 'is_active' => true]
            );
        }

        $prodiTi = ParticipantCategory::where('code', 'prodi-ti')->firstOrFail();
        $prodiTl = ParticipantCategory::where('code', 'prodi-tl')->firstOrFail();
        $gelombang1 = ParticipantCategory::where('code', 'gelombang-1')->firstOrFail();
        $umum = ParticipantCategory::where('code', 'umum')->firstOrFail();

        $participants = [
            'Ahmad Fauzi', 'Budi Santoso', 'Citra Lestari', 'Dewi Anggraini', 'Eko Prasetyo',
            'Fitri Handayani', 'Gilang Ramadhan', 'Hesti Purwanti', 'Indra Wijaya', 'Joko Susilo',
            'Kartika Sari', 'Lukman Hakim', 'Maya Puspita', 'Nanda Pratama', 'Oka Mahendra',
            'Putri Wulandari', 'Rizky Kurniawan', 'Sinta Marlina', 'Taufik Hidayat', 'Umi Kalsum',
        ];

        foreach ($participants as $index => $name) {
            $category = match (true) {
                $index < 5 => $prodiTi,
                $index < 10 => $prodiTl,
                $index < 15 => $gelombang1,
                default => $umum,
            };

            Participant::updateOrCreate(
                ['exam_number' => '2026'.str_pad((string) ($index + 1), 3, '0', STR_PAD_LEFT)],
                [
                    'full_name' => $name,
                    'nisn' => '00'.str_pad((string) ($index + 1), 8, '0', STR_PAD_LEFT),
                    'class_name' => 'XII IPA '.((int) floor($index / 5) + 1),
                    'category_id' => $category->id,
                    'is_active' => true,
                ]
            );
        }

        if (Exam::where('title', 'Matematika Terintegrasi')->exists()) {
            return;
        }

        $exam = Exam::create([
            'title' => 'Matematika Terintegrasi',
            'subject_name' => 'Matematika, Fisika, Kimia',
            'duration_minutes' => 60,
            'exam_date' => now()->subHour(),
            'exam_end_date' => now()->addDays(30),
            'is_active' => true,
            'randomize_questions' => true,
            'passing_grade' => 70,
            'total_questions' => 10,
        ]);

        $questions = [
            [
                'text' => 'Tentukan akar-akar persamaan kuadrat $x^2 - 5x + 6 = 0$.',
                'options' => ['2 dan 3', '-2 dan -3', '1 dan 6', '-1 dan -6', '2 dan -3'],
                'correct' => 'A',
            ],
            [
                'text' => 'Sebuah benda bermassa $2\\,\\text{kg}$ bergerak dengan kecepatan $3\\,\\text{m/s}$. Energi kinetiknya adalah...',
                'options' => ['9 J', '6 J', '18 J', '3 J', '12 J'],
                'correct' => 'A',
            ],
            [
                'text' => 'Rumus kimia untuk air adalah...',
                'options' => ['H$_2$O', 'CO$_2$', 'NaCl', 'O$_2$', 'H$_2$O$_2$'],
                'correct' => 'A',
            ],
            [
                'text' => 'Hasil dari $\\int 2x\\,dx$ adalah...',
                'options' => ['$x^2 + C$', '$2x + C$', '$x + C$', '$\\frac{x^2}{2} + C$', '$2x^2 + C$'],
                'correct' => 'A',
            ],
            [
                'text' => 'Satuan gaya dalam Sistem Internasional (SI) adalah...',
                'options' => ['Newton', 'Joule', 'Watt', 'Pascal', 'Kilogram'],
                'correct' => 'A',
            ],
            [
                'text' => 'pH larutan netral pada suhu $25^\\circ\\text{C}$ adalah...',
                'options' => ['7', '0', '14', '1', '10'],
                'correct' => 'A',
            ],
            [
                'text' => 'Nilai dari $\\lim_{x\\to 0} \\frac{\\sin x}{x}$ adalah...',
                'options' => ['1', '0', 'Tidak terdefinisi', '$\\infty$', '$-1$'],
                'correct' => 'A',
            ],
            [
                'text' => 'Hukum Newton II dirumuskan sebagai...',
                'options' => ['$F = ma$', '$E = mc^2$', '$F = mgh$', '$P = IV$', '$v = \\lambda f$'],
                'correct' => 'A',
            ],
            [
                'text' => 'Nilai dari $\\frac{1}{2} + \\frac{1}{3}$ adalah...',
                'options' => ['$\\frac{5}{6}$', '$\\frac{2}{5}$', '$\\frac{1}{6}$', '$\\frac{3}{5}$', '$\\frac{1}{5}$'],
                'correct' => 'A',
            ],
            [
                'text' => 'Jumlah proton pada atom karbon ($^{12}_{6}\\text{C}$) adalah...',
                'options' => ['6', '12', '18', '4', '8'],
                'correct' => 'A',
            ],
        ];

        foreach ($questions as $index => $row) {
            $question = Question::create([
                'exam_id' => $exam->id,
                'question_number' => $index + 1,
                'question_text' => $row['text'],
                'score_weight' => 1,
            ]);

            foreach (['A', 'B', 'C', 'D', 'E'] as $optionIndex => $label) {
                $question->options()->create([
                    'label' => $label,
                    'option_text' => $row['options'][$optionIndex],
                    'is_correct' => $label === $row['correct'],
                ]);
            }
        }
    }
}
