<?php

namespace Database\Factories;

use App\Models\Participant;
use App\Models\ParticipantCategory;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Participant>
 */
class ParticipantFactory extends Factory
{
    protected $model = Participant::class;

    public function definition(): array
    {
        $name = fake()->name();
        $examNumber = '2026'.str_pad((string) fake()->unique()->numberBetween(1, 9999), 4, '0', STR_PAD_LEFT);

        return [
            'exam_number' => $examNumber,
            'full_name' => $name,
            'nisn' => '00'.str_pad((string) fake()->unique()->numberBetween(1, 99999999), 8, '0', STR_PAD_LEFT),
            'class_name' => 'XII '.fake()->randomElement(['IPA', 'IPS', 'Bahasa']).' '.fake()->numberBetween(1, 6),
            'category_id' => ParticipantCategory::inRandomOrder()->first()?->id ?? ParticipantCategory::factory(),
            'is_active' => true,
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }

    public function forCategory(ParticipantCategory $category): static
    {
        return $this->state(fn (array $attributes) => [
            'category_id' => $category->id,
        ]);
    }
}
