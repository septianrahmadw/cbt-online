<?php

namespace Database\Factories;

use App\Models\Exam;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Exam>
 */
class ExamFactory extends Factory
{
    protected $model = Exam::class;

    public function definition(): array
    {
        return [
            'title' => fake()->sentence(3),
            'subject_name' => fake()->sentence(2),
            'duration_minutes' => fake()->numberBetween(30, 180),
            'exam_date' => fake()->dateTimeBetween('now', '+30 days'),
            'exam_end_date' => fake()->dateTimeBetween('+31 days', '+60 days'),
            'is_active' => true,
            'violations_enabled' => null,
            'violation_limit' => null,
            'randomize_questions' => fake()->boolean(),
            'passing_grade' => fake()->numberBetween(60, 80),
            'total_questions' => 0,
            'created_by' => User::inRandomOrder()->first()?->id ?? User::factory(),
        ];
    }

    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => true,
            'exam_date' => fake()->dateTimeBetween('-1 day', 'now'),
            'exam_end_date' => fake()->dateTimeBetween('now', '+30 days'),
        ]);
    }

    public function upcoming(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => true,
            'exam_date' => fake()->dateTimeBetween('+1 day', '+7 days'),
            'exam_end_date' => fake()->dateTimeBetween('+8 days', '+30 days'),
        ]);
    }

    public function past(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => true,
            'exam_date' => fake()->dateTimeBetween('-60 days', '-30 days'),
            'exam_end_date' => fake()->dateTimeBetween('-29 days', '-1 day'),
        ]);
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }

    public function withViolations(int $limit = 3): static
    {
        return $this->state(fn (array $attributes) => [
            'violations_enabled' => true,
            'violation_limit' => $limit,
        ]);
    }

    public function withoutViolations(): static
    {
        return $this->state(fn (array $attributes) => [
            'violations_enabled' => false,
            'violation_limit' => null,
        ]);
    }
}
