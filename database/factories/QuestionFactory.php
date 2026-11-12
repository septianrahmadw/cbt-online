<?php

namespace Database\Factories;

use App\Models\Exam;
use App\Models\Module;
use App\Models\Question;
use App\Models\User;
use App\QuestionReviewStatus;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Question>
 */
class QuestionFactory extends Factory
{
    protected $model = Question::class;

    public function definition(): array
    {
        $type = fake()->randomElement(['single', 'multiple']);
        $difficulty = fake()->randomElement(['mudah', 'sedang', 'sulit']);

        return [
            'exam_id' => Exam::inRandomOrder()->first()?->id ?? Exam::factory(),
            'module_id' => Module::inRandomOrder()->first()?->id,
            'question_number' => fake()->numberBetween(1, 50),
            'passage' => fake()->optional(0.3)->paragraph(),
            'type' => $type,
            'difficulty' => $difficulty,
            'question_text' => fake()->sentence(10),
            'image_url' => null,
            'explanation' => fake()->optional(0.5)->paragraph(),
            'is_active' => true,
            'review_status' => QuestionReviewStatus::Approved,
            'review_note' => null,
            'reviewed_by' => User::where('role', 'admin')->inRandomOrder()->first()?->id,
            'reviewed_at' => now(),
            'created_by' => User::inRandomOrder()->first()?->id ?? User::factory(),
            'score_weight' => fake()->randomFloat(1, 0.5, 5),
        ];
    }

    public function draft(): static
    {
        return $this->state(fn (array $attributes) => [
            'review_status' => QuestionReviewStatus::Draft,
            'reviewed_by' => null,
            'reviewed_at' => null,
        ]);
    }

    public function pending(): static
    {
        return $this->state(fn (array $attributes) => [
            'review_status' => QuestionReviewStatus::Pending,
            'reviewed_by' => null,
            'reviewed_at' => null,
        ]);
    }

    public function approved(): static
    {
        return $this->state(fn (array $attributes) => [
            'review_status' => QuestionReviewStatus::Approved,
            'reviewed_by' => User::where('role', 'admin')->inRandomOrder()->first()?->id,
            'reviewed_at' => now(),
        ]);
    }

    public function rejected(): static
    {
        return $this->state(fn (array $attributes) => [
            'review_status' => QuestionReviewStatus::Rejected,
            'review_note' => fake()->sentence(),
            'reviewed_by' => User::where('role', 'admin')->inRandomOrder()->first()?->id,
            'reviewed_at' => now(),
        ]);
    }

    public function singleChoice(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'single',
        ]);
    }

    public function multipleChoice(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'multiple',
        ]);
    }

    public function easy(): static
    {
        return $this->state(fn (array $attributes) => [
            'difficulty' => 'mudah',
        ]);
    }

    public function medium(): static
    {
        return $this->state(fn (array $attributes) => [
            'difficulty' => 'sedang',
        ]);
    }

    public function hard(): static
    {
        return $this->state(fn (array $attributes) => [
            'difficulty' => 'sulit',
        ]);
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }

    public function withPassage(): static
    {
        return $this->state(fn (array $attributes) => [
            'passage' => fake()->paragraph(3),
        ]);
    }
}
