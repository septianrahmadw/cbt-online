<?php

namespace Tests\Feature;

use App\Models\Participant;
use App\Models\ParticipantCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ParticipantBulkDeleteTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_delete_selected_participants_by_ids(): void
    {
        $this->actingAs(User::factory()->create());

        $category = ParticipantCategory::factory()->create();
        $selected = Participant::factory()->forCategory($category)->create([
            'exam_number' => '2026001',
            'full_name' => 'Peserta Terpilih',
        ]);
        $kept = Participant::factory()->forCategory($category)->create([
            'exam_number' => '2026002',
            'full_name' => 'Peserta Tersisa',
        ]);

        $this->from('/admin/participants')
            ->delete('/admin/participants/bulk', ['ids' => [$selected->id]])
            ->assertRedirect('/admin/participants')
            ->assertSessionHas('success', '1 peserta berhasil dihapus.');

        $this->assertDatabaseMissing('participants', ['id' => $selected->id]);
        $this->assertDatabaseHas('participants', ['id' => $kept->id]);
    }

    public function test_admin_can_delete_all_participants_matching_filters_across_pages(): void
    {
        $this->actingAs(User::factory()->create());

        $target = ParticipantCategory::factory()->create();
        $other = ParticipantCategory::factory()->create();

        for ($index = 1; $index <= 16; $index++) {
            Participant::factory()->forCategory($target)->create([
                'exam_number' => sprintf('20261%03d', $index),
                'full_name' => "Budi Peserta {$index}",
            ]);
        }

        $keptBySearch = Participant::factory()->forCategory($target)->create([
            'exam_number' => '2026201',
            'full_name' => 'Siti Peserta',
        ]);
        $keptByCategory = Participant::factory()->forCategory($other)->create([
            'exam_number' => '2026202',
            'full_name' => 'Budi Kategori Lain',
        ]);

        $this->from('/admin/participants')
            ->delete('/admin/participants/bulk', [
                'select_all' => true,
                'search' => 'Budi',
                'category_id' => $target->id,
            ])
            ->assertRedirect('/admin/participants')
            ->assertSessionHas('success', '16 peserta berhasil dihapus.');

        $this->assertSame(0, Participant::query()
            ->where('category_id', $target->id)
            ->where('full_name', 'like', 'Budi%')
            ->count());
        $this->assertDatabaseHas('participants', ['id' => $keptBySearch->id]);
        $this->assertDatabaseHas('participants', ['id' => $keptByCategory->id]);
    }

    public function test_admin_can_delete_all_participants_in_a_category_without_deleting_the_category(): void
    {
        $this->actingAs(User::factory()->create());

        $target = ParticipantCategory::factory()->create();
        $other = ParticipantCategory::factory()->create();
        $first = Participant::factory()->forCategory($target)->create([
            'exam_number' => '2026301',
            'full_name' => 'Budi Kategori',
        ]);
        $second = Participant::factory()->forCategory($target)->create([
            'exam_number' => '2026302',
            'full_name' => 'Siti Kategori',
        ]);
        $kept = Participant::factory()->forCategory($other)->create([
            'exam_number' => '2026303',
            'full_name' => 'Peserta Kategori Lain',
        ]);

        $this->from('/admin/participants')
            ->delete('/admin/participants/bulk', [
                'category_id' => $target->id,
                'search' => 'Budi',
            ])
            ->assertRedirect('/admin/participants')
            ->assertSessionHas('success', '2 peserta berhasil dihapus.');

        $this->assertDatabaseMissing('participants', ['id' => $first->id]);
        $this->assertDatabaseMissing('participants', ['id' => $second->id]);
        $this->assertDatabaseHas('participants', ['id' => $kept->id]);
        $this->assertDatabaseHas('participant_categories', ['id' => $target->id]);
    }

    public function test_bulk_delete_rejects_a_request_without_a_selection(): void
    {
        $this->actingAs(User::factory()->create());

        $participant = Participant::factory()->create(['exam_number' => '2026401']);

        $this->from('/admin/participants')
            ->delete('/admin/participants/bulk', [])
            ->assertSessionHasErrors('selection');

        $this->assertDatabaseHas('participants', ['id' => $participant->id]);
    }

    public function test_bulk_delete_rejects_unknown_participant_ids(): void
    {
        $this->actingAs(User::factory()->create());

        $participant = Participant::factory()->create(['exam_number' => '2026402']);

        $this->from('/admin/participants')
            ->delete('/admin/participants/bulk', ['ids' => [999999]])
            ->assertSessionHasErrors('ids.0');

        $this->assertDatabaseHas('participants', ['id' => $participant->id]);
    }

    public function test_guests_cannot_bulk_delete_participants(): void
    {
        $participant = Participant::factory()->create(['exam_number' => '2026403']);

        $this->from('/admin/participants')
            ->delete('/admin/participants/bulk', ['ids' => [$participant->id]])
            ->assertRedirect('/admin/login');

        $this->assertDatabaseHas('participants', ['id' => $participant->id]);
    }
}
