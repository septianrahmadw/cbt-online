<?php

namespace App\Policies;

use App\Models\Question;
use App\Models\User;

class QuestionPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isAdmin() || $user->isDosen();
    }

    public function view(User $user, Question $question): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        return $user->isDosen() && $this->isAssignedToExam($user, $question);
    }

    public function create(User $user): bool
    {
        return $user->isAdmin() || $user->isDosen();
    }

    public function update(User $user, Question $question): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        return $user->isDosen()
            && (int) $question->created_by === $user->id
            && $question->review_status?->isEditableByDosen()
            && $this->isAssignedToExam($user, $question);
    }

    public function delete(User $user, Question $question): bool
    {
        return $this->update($user, $question);
    }

    public function submitForReview(User $user, Question $question): bool
    {
        return $this->update($user, $question);
    }

    public function review(User $user, Question $question): bool
    {
        return $user->isAdmin();
    }

    private function isAssignedToExam(User $user, Question $question): bool
    {
        return $question->exam()
            ->whereHas('assignedUsers', fn ($query) => $query->where('users.id', $user->id))
            ->exists();
    }
}
