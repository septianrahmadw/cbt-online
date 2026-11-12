<?php

namespace Database\Factories;

use App\Models\Exam;
use App\Models\ExamResult;
use App\Models\ExamSession;
use App\Models\Participant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ExamResult>
 */
class ExamResultFactory extends Factory
{
    protected $model = ExamResult::class;

    public function definition(): array
    {
        $totalCorrect = fake()->numberBetween(0, 20);
        $totalWrong = fake()->numberBetween(0, 10);
        $totalEmpty = fake()->numberBetween(0, 5);
        $totalWeight = $totalCorrect + $totalWrong + $totalEmpty;
        $score = $totalWeight > 0 ? round(($totalCorrect / $totalWeight) * 100, 2) : 0;
        $passingGrade = Exam::inRandomOrder()->first()?->passing_grade ?? 70;

        return [
            'session_id' => ExamSession::inRandomOrder()->first()?->id ?? ExamSession::factory(),
            'exam_id' => Exam::inRandomOrder()->first()?->id ?? Exam::factory(),
            'participant_id' => Participant::inRandomOrder()->first()?->id ?? Participant::factory(),
            'total_correct' => $totalCorrect,
            'total_wrong' => $totalWrong,
            'total_empty' => $totalEmpty,
            'final_score' => $score,
            'passing_status' => $score >= $passingGrade ? 'lulus' : 'belum_lulus',
            'completed_at' => fake()->dateTimeBetween('-1 hour', 'now'),
        ];
    }

    public function passed(): static
    {
        return $this->state(fn (array $attributes) => [
            'total_correct' => fake()->numberBetween(15, 25),
            'total_wrong' => fake()->numberBetween(0, 5),
            'total_empty' => fake()->numberBetween(0, 3),
            'final_score' => fake()->randomFloat(2, 70, 100),
            'passing_status' => 'lulus',
        ]);
    }

    public function failed(): static
    {
        return $this->state(fn (array $attributes) => [
            'total_correct' => fake()->numberBetween(0, 10),
            'total_wrong' => fake()->numberBetween(5, 15),
            'total_empty' => fake()->numberBetween(0, 10),
            'final_score' => fake()->randomFloat(2, 0, 69.99),
            'passing_status' => 'belum_lulus',
        ]);
    }

    public function perfect(): static
    {
        return $this->state(fn (array $attributes) => [
            'total_correct' => 25,
            'total_wrong' => 0,
            'total_empty' => 0,
            'final_score' => 100,
            'passing_status' => 'lulus',
        ]);
    }
}
