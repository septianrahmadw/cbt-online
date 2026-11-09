<?php

namespace App\Policies;

use App\Models\ExamSession;
use App\Models\User;

class ExamSessionPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isAdmin() || $user->isPengawas();
    }

    public function view(User $user, ExamSession $session): bool
    {
        return $this->canSupervise($user, $session);
    }

    public function stop(User $user, ExamSession $session): bool
    {
        return $this->canSupervise($user, $session);
    }

    public function delete(User $user, ExamSession $session): bool
    {
        return $user->isAdmin();
    }

    private function canSupervise(User $user, ExamSession $session): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        return $user->isPengawas()
            && $session->exam()
                ->whereHas('assignedUsers', fn ($query) => $query->where('users.id', $user->id))
                ->exists();
    }
}
