<?php

namespace App\Policies;

use App\Models\Exam;
use App\Models\User;

class ExamPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isAdmin() || $user->isDosen() || $user->isPengawas();
    }

    public function view(User $user, Exam $exam): bool
    {
        return $exam->isVisibleTo($user);
    }

    public function create(User $user): bool
    {
        return $user->isAdmin();
    }

    public function update(User $user, Exam $exam): bool
    {
        return $user->isAdmin();
    }

    public function delete(User $user, Exam $exam): bool
    {
        return $user->isAdmin();
    }

    public function manageQuestions(User $user, Exam $exam): bool
    {
        return $user->isAdmin()
            || ($user->isDosen() && $exam->isVisibleTo($user));
    }

    public function supervise(User $user, Exam $exam): bool
    {
        return $user->isAdmin()
            || ($user->isPengawas() && $exam->isVisibleTo($user));
    }

    public function reset(User $user, Exam $exam): bool
    {
        return $user->isAdmin();
    }
}
