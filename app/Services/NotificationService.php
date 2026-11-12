<?php

namespace App\Services;

use App\Models\Exam;
use App\Models\ExamResult;
use App\Models\ExamSession;
use App\Models\Participant;
use App\Models\Question;
use App\Models\User;
use App\Notifications\ExamResultPublished;
use App\Notifications\ExamSessionStopped;
use App\Notifications\ExamStartingSoon;
use App\Notifications\QuestionReviewed;
use App\Notifications\QuestionSubmittedForReview;
use App\QuestionReviewStatus;

class NotificationService
{
    public function notifyQuestionSubmittedForReview(Question $question, User $submittedBy): void
    {
        $admins = User::where('role', 'admin')
            ->where('is_active', true)
            ->get();

        foreach ($admins as $admin) {
            $admin->notify(new QuestionSubmittedForReview($question, $submittedBy));
        }
    }

    public function notifyQuestionReviewed(Question $question, User $reviewedBy, string $status, ?string $note = null): void
    {
        if ($question->created_by) {
            $creator = User::find($question->created_by);
            if ($creator && $creator->is_active) {
                $creator->notify(new QuestionReviewed($question, $reviewedBy, QuestionReviewStatus::tryFrom($status), $note));
            }
        }
    }

    public function notifyExamStartingSoon(Exam $exam, Participant $participant, int $minutesUntilStart): void
    {
        $participant->notify(new ExamStartingSoon($exam, $participant, $minutesUntilStart));
    }

    public function notifyExamResultPublished(ExamResult $result, Exam $exam, Participant $participant): void
    {
        $participant->notify(new ExamResultPublished($result, $exam, $participant));
    }

    public function notifyExamSessionStopped(ExamSession $session, Exam $exam, Participant $participant, ?User $stoppedBy = null, bool $forced = false): void
    {
        $participant->notify(new ExamSessionStopped($session, $exam, $participant, $stoppedBy, $forced));
    }

    public function notifyAdminsNewQuestion(Question $question, User $createdBy): void
    {
        $admins = User::where('role', 'admin')
            ->where('is_active', true)
            ->get();

        foreach ($admins as $admin) {
            $admin->notify(new QuestionSubmittedForReview($question, $createdBy));
        }
    }
}
