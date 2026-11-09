<?php

namespace Tests\Feature;

use App\Models\User;
use App\UserRole;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class UserManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_staff_users(): void
    {
        $admin = User::factory()->create();

        $this->actingAs($admin)
            ->post('/admin/users', [
                'name' => 'Dosen Baru',
                'email' => 'dosen@example.test',
                'role' => UserRole::Dosen->value,
                'password' => 'password123',
                'is_active' => true,
            ])
            ->assertRedirect('/admin/users');

        $user = User::where('email', 'dosen@example.test')->firstOrFail();

        $this->assertSame(UserRole::Dosen, $user->role);
        $this->assertTrue($user->is_active);
        $this->assertSame($admin->id, $user->created_by);
        $this->assertTrue(Hash::check('password123', $user->password));
    }

    public function test_admin_cannot_deactivate_or_change_own_role(): void
    {
        $admin = User::factory()->create();

        $this->actingAs($admin)
            ->put("/admin/users/{$admin->id}", [
                'name' => $admin->name,
                'email' => $admin->email,
                'role' => UserRole::Dosen->value,
                'is_active' => true,
            ])
            ->assertSessionHasErrors('role');

        $this->assertSame(UserRole::Admin, $admin->fresh()->role);
    }

    public function test_admin_cannot_delete_own_account(): void
    {
        $admin = User::factory()->create();

        $this->actingAs($admin)
            ->delete("/admin/users/{$admin->id}")
            ->assertSessionHas('error');

        $this->assertDatabaseHas('users', ['id' => $admin->id]);
    }

    public function test_inactive_user_cannot_login_to_admin_panel(): void
    {
        User::factory()->inactive()->create([
            'email' => 'nonaktif@example.test',
            'password' => 'password',
        ]);

        $this->post('/admin/login', [
            'email' => 'nonaktif@example.test',
            'password' => 'password',
        ])->assertSessionHasErrors('email');

        $this->assertGuest();
    }

    public function test_non_admin_cannot_manage_users(): void
    {
        $dosen = User::factory()->dosen()->create();

        $this->actingAs($dosen)
            ->get('/admin/users')
            ->assertForbidden();
    }
}
