<?php

namespace Database\Factories;

use App\Models\ExamSession;
use App\Models\ViolationLog;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ViolationLog>
 */
class ViolationLogFactory extends Factory
{
    protected $model = ViolationLog::class;

    public function definition(): array
    {
        return [
            'session_id' => ExamSession::inRandomOrder()->first()?->id ?? ExamSession::factory(),
            'type' => fake()->randomElement(['blur', 'fullscreen_exit', 'tab_switch', 'shortcut']),
            'duration_seconds' => fake()->numberBetween(0, 30),
            'metadata' => [
                'user_agent' => fake()->userAgent(),
                'url' => fake()->url(),
            ],
            'occurred_at' => fake()->dateTimeBetween('-1 hour', 'now'),
        ];
    }

    public function blur(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'blur',
        ]);
    }

    public function fullscreenExit(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'fullscreen_exit',
        ]);
    }

    public function tabSwitch(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'tab_switch',
        ]);
    }

    public function shortcut(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'shortcut',
        ]);
    }

    public function withDuration(int $seconds): static
    {
        return $this->state(fn (array $attributes) => [
            'duration_seconds' => $seconds,
        ]);
    }
}
