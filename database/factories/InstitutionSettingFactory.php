<?php

namespace Database\Factories;

use App\Models\InstitutionSetting;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<InstitutionSetting>
 */
class InstitutionSettingFactory extends Factory
{
    protected $model = InstitutionSetting::class;

    public function definition(): array
    {
        return [
            'school_name' => fake()->company().' '.fake()->randomElement(['Universitas', 'Sekolah', 'Institut', 'Akademi']),
            'academic_year' => fake()->year().'/'.(fake()->year() + 1),
            'exam_event_name' => 'Ujian '.fake()->randomElement(['UTBK', 'UTS', 'UAS', 'Akhir Semester', 'Masuk']).' '.fake()->year(),
            'passing_grade_default' => fake()->numberBetween(60, 80),
            'violations_enabled' => true,
            'violation_limit' => 3,
        ];
    }
}
