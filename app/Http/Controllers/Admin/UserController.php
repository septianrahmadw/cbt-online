<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use App\UserRole;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function index(): Response
    {
        $this->authorize('viewAny', User::class);

        $users = User::query()
            ->orderBy('name')
            ->get()
            ->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role?->value,
                'role_label' => $user->role?->label(),
                'is_active' => $user->is_active,
                'is_self' => $user->id === auth()->id(),
                'last_login_at' => $user->last_login_at?->toIso8601String(),
                'created_at' => $user->created_at?->toIso8601String(),
            ]);

        return Inertia::render('Admin/Users', [
            'users' => $users,
            'roles' => collect(UserRole::cases())
                ->map(fn (UserRole $role) => [
                    'value' => $role->value,
                    'label' => $role->label(),
                ])
                ->values(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', User::class);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'role' => ['required', Rule::enum(UserRole::class)],
            'password' => ['required', 'string', 'min:8'],
            'is_active' => ['boolean'],
        ]);

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'role' => $data['role'],
            'password' => $data['password'],
            'is_active' => (bool) ($data['is_active'] ?? true),
            'created_by' => $request->user()->id,
        ]);

        AuditLog::record('user.created', 'admin', $request->user()->id, 'user', $user->id, [
            'role' => $user->role?->value,
        ]);

        return redirect()
            ->route('admin.users.index')
            ->with('success', 'User berhasil ditambahkan.');
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $this->authorize('update', $user);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required', 'string', 'email', 'max:255',
                Rule::unique('users', 'email')->ignore($user->id),
            ],
            'role' => ['required', Rule::enum(UserRole::class)],
            'password' => ['nullable', 'string', 'min:8'],
            'is_active' => ['boolean'],
        ]);

        $willRemainActiveAdmin = $data['role'] === UserRole::Admin->value
            && (bool) ($data['is_active'] ?? true);

        if ($user->id === $request->user()->id && ! $willRemainActiveAdmin) {
            return back()->withErrors([
                'role' => 'Anda tidak dapat menonaktifkan atau mengubah role akun sendiri.',
            ]);
        }

        if ($this->isLastActiveAdmin($user) && ! $willRemainActiveAdmin) {
            return back()->withErrors([
                'role' => 'Minimal harus ada satu administrator aktif.',
            ]);
        }

        $attributes = [
            'name' => $data['name'],
            'email' => $data['email'],
            'role' => $data['role'],
            'is_active' => (bool) ($data['is_active'] ?? true),
        ];

        if (! empty($data['password'])) {
            $attributes['password'] = $data['password'];
        }

        $user->update($attributes);

        AuditLog::record('user.updated', 'admin', $request->user()->id, 'user', $user->id, [
            'role' => $user->role?->value,
            'is_active' => $user->is_active,
        ]);

        return redirect()
            ->route('admin.users.index')
            ->with('success', 'User berhasil diperbarui.');
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        $this->authorize('delete', $user);

        if ($user->id === $request->user()->id) {
            return back()->with('error', 'Anda tidak dapat menghapus akun sendiri.');
        }

        if ($this->isLastActiveAdmin($user)) {
            return back()->with('error', 'Minimal harus ada satu administrator aktif.');
        }

        $userId = $user->id;
        $user->delete();

        AuditLog::record('user.deleted', 'admin', $request->user()->id, 'user', $userId);

        return redirect()
            ->route('admin.users.index')
            ->with('success', 'User berhasil dihapus.');
    }

    private function isLastActiveAdmin(User $user): bool
    {
        if (! $user->isAdmin() || ! $user->is_active) {
            return false;
        }

        return User::where('role', UserRole::Admin->value)
            ->where('is_active', true)
            ->count() <= 1;
    }
}
