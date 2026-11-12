<?php

namespace Database\Factories;

use App\Models\Exam;
use App\Models\ExamSession;
use App\Models\Participant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ExamSession>
 */
class ExamSessionFactory extends Factory
{
    protected $model = ExamSession::class;

    public function definition(): array
    {
        $exam = Exam::inRandomOrder()->first() ?? Exam::factory()->create();
        $duration = $exam->duration_minutes * 60;
        $startTime = fake()->dateTimeBetween('-2 hours', 'now');
        $elapsed = fake()->numberBetween(0, $duration);
        $remaining = max(0, $duration - $elapsed);
        $isCompleted = $remaining === 0 || fake()->boolean(10);

        return [
            'exam_id' => $exam->id,
            'participant_id' => Participant::inRandomOrder()->first()?->id ?? Participant::factory(),
            'start_time' => $startTime,
            'end_time' => $isCompleted ? fake()->dateTimeBetween($startTime, 'now') : null,
            'remaining_seconds' => $isCompleted ? 0 : $remaining,
            'is_completed' => $isCompleted,
            'violations_count' => fake()->numberBetween(0, 5),
            'status' => $isCompleted ? 'submitted' : 'active',
            'ip_address' => fake()->ipv4(),
            'user_agent' => fake()->userAgent(),
        ];
    }

    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_completed' => false,
            'status' => 'active',
            'end_time' => null,
            'remaining_seconds' => fn (array $attributes) => $attributes['exam_id']
                ? Exam::find($attributes['exam_id'])->duration_minutes * 60
                : 3600,
        ]);
    }

    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_completed' => true,
            'status' => 'submitted',
            'end_time' => fake()->dateTimeBetween('-1 hour', 'now'),
            'remaining_seconds' => 0,
        ]);
    }

    public function forcedSubmit(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_completed' => true,
            'status' => 'forced_submit',
            'end_time' => fake()->dateTimeBetween('-1 hour', 'now'),
            'remaining_seconds' => 0,
        ]);
    }

    public function withViolations(int $count = 3): static
    {
        return $this->state(fn (array $attributes) => [
            'violations_count' => $count,
        ]);
    }
}
