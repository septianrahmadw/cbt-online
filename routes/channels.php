<?php

use App\Models\ExamSession;
use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

// Channel untuk user notifications
Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// Channel untuk monitoring sesi ujian (admin/proktor)
Broadcast::channel('exam.{examId}.sessions', function (User $user, int $examId) {
    if (! $user->isAdmin() && ! $user->isPengawas()) {
        return false;
    }

    // Admin bisa akses semua, pengawas hanya ujian yang di-assign
    if ($user->isAdmin()) {
        return true;
    }

    return $user->assignedExams()->where('exams.id', $examId)->exists();
});

// Channel untuk sesi ujian individual (peserta + admin/proktor)
Broadcast::channel('exam-session.{sessionId}', function (User $user, int $sessionId) {
    $session = ExamSession::with('exam')->find($sessionId);

    if (! $session) {
        return false;
    }

    // Peserta yang punya session ini
    if ($user->participant && $user->participant->id === $session->participant_id) {
        return true;
    }

    // Admin/proktor yang monitor ujian ini
    if ($user->isAdmin()) {
        return true;
    }

    if ($user->isPengawas()) {
        return $user->assignedExams()->where('exams.id', $session->exam_id)->exists();
    }

    return false;
});

// Channel untuk violation alerts (admin/proktor)
Broadcast::channel('exam.{examId}.violations', function (User $user, int $examId) {
    if (! $user->isAdmin() && ! $user->isPengawas()) {
        return false;
    }

    if ($user->isAdmin()) {
        return true;
    }

    return $user->assignedExams()->where('exams.id', $examId)->exists();
});
