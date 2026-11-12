<?php

namespace Database\Factories;

use App\Models\ParticipantCategory;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ParticipantCategory>
 */
class ParticipantCategoryFactory extends Factory
{
    protected $model = ParticipantCategory::class;

    public function definition(): array
    {
        $name = fake()->unique()->word().' '.fake()->word();

        return [
            'name' => $name,
            'code' => strtolower(str_replace(' ', '-', $name)).'-'.fake()->unique()->numberBetween(100, 999),
            'description' => fake()->optional()->sentence(),
            'is_active' => true,
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }
}
