<?php

namespace Database\Factories;

use App\Models\ExamSession;
use App\Models\Question;
use App\Models\StudentAnswer;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<StudentAnswer>
 */
class StudentAnswerFactory extends Factory
{
    protected $model = StudentAnswer::class;

    public function definition(): array
    {
        $session = ExamSession::inRandomOrder()->first() ?? ExamSession::factory()->create();
        $question = Question::where('exam_id', $session->exam_id)->inRandomOrder()->first() ?? Question::factory()->create(['exam_id' => $session->exam_id]);
        $options = $question->options;
        $selectedOption = $options->isNotEmpty() ? $options->random() : null;

        return [
            'session_id' => $session->id,
            'question_id' => $question->id,
            'selected_option_id' => $selectedOption?->id,
            'is_doubtful' => fake()->boolean(10),
            'answered_at' => fake()->dateTimeBetween($session->start_time, now()),
        ];
    }

    public function correct(): static
    {
        return $this->state(function (array $attributes) {
            $question = Question::find($attributes['question_id']);
            $correctOption = $question?->options()->where('is_correct', true)->first();

            return [
                'selected_option_id' => $correctOption?->id,
            ];
        });
    }

    public function wrong(): static
    {
        return $this->state(function (array $attributes) {
            $question = Question::find($attributes['question_id']);
            $wrongOptions = $question?->options()->where('is_correct', false)->get();
            $selectedOption = $wrongOptions?->random();

            return [
                'selected_option_id' => $selectedOption?->id,
            ];
        });
    }

    public function empty(): static
    {
        return $this->state(fn (array $attributes) => [
            'selected_option_id' => null,
        ]);
    }

    public function doubtful(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_doubtful' => true,
        ]);
    }
}
