<?php

namespace Database\Factories;

use App\Models\Module;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Module>
 */
class ModuleFactory extends Factory
{
    protected $model = Module::class;

    public function definition(): array
    {
        $colors = ['blue', 'green', 'yellow', 'red', 'purple', 'pink', 'indigo', 'teal', 'orange', 'gray'];

        return [
            'name' => fake()->unique()->words(2, true),
            'code' => strtolower(str_replace(' ', '-', fake()->unique()->words(2, true))),
            'color' => fake()->randomElement($colors),
            'sort_order' => fake()->numberBetween(1, 100),
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
