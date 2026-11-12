<?php

namespace Database\Factories;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AuditLog>
 */
class AuditLogFactory extends Factory
{
    protected $model = AuditLog::class;

    public function definition(): array
    {
        return [
            'action' => fake()->randomElement([
                'exam.start',
                'exam.submit',
                'exam.forced_submit',
                'question.create',
                'question.update',
                'question.delete',
                'question.submit_review',
                'question.approve',
                'question.reject',
                'participant.create',
                'participant.update',
                'participant.import',
                'user.create',
                'user.update',
                'session.stop',
                'session.stop_all',
            ]),
            'subject_type' => fake()->randomElement(['participant', 'exam', 'question', 'user', 'exam_session']),
            'subject_id' => fake()->numberBetween(1, 100),
            'causer_type' => User::class,
            'causer_id' => User::inRandomOrder()->first()?->id,
            'properties' => [
                'ip' => fake()->ipv4(),
                'user_agent' => fake()->userAgent(),
            ],
            'created_at' => fake()->dateTimeBetween('-30 days', 'now'),
        ];
    }

    public function forSubject(string $type, int $id): static
    {
        return $this->state(fn (array $attributes) => [
            'subject_type' => $type,
            'subject_id' => $id,
        ]);
    }

    public function byCauser(User $user): static
    {
        return $this->state(fn (array $attributes) => [
            'causer_type' => User::class,
            'causer_id' => $user->id,
        ]);
    }
}
