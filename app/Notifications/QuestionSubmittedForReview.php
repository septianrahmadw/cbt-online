<?php

namespace App\Notifications;

use App\Models\Question;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class QuestionSubmittedForReview extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Question $question,
        public User $submittedBy
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'title' => 'Soal Baru Butuh Review',
            'message' => "{$this->submittedBy->name} mengirim soal \"{$this->question->question_text}\" untuk direview.",
            'action_url' => route('admin.questions.index', ['exam_id' => $this->question->exam_id]),
            'action_text' => 'Review Soal',
            'question_id' => $this->question->id,
            'exam_id' => $this->question->exam_id,
        ];
    }

    public function toArray(object $notifiable): array
    {
        return $this->toDatabase($notifiable);
    }
}
