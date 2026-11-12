<?php

namespace App\Notifications;

use App\Models\Question;
use App\Models\User;
use App\QuestionReviewStatus;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class QuestionReviewed extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Question $question,
        public User $reviewedBy,
        public QuestionReviewStatus $status,
        public ?string $note = null
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        $isApproved = $this->status === QuestionReviewStatus::Approved;
        $note = $this->note ?? 'Tidak ada catatan.';

        return [
            'title' => $isApproved ? 'Soal Disetujui' : 'Soal Ditolak',
            'message' => $isApproved
                ? "Soal \"{$this->question->question_text}\" telah disetujui oleh {$this->reviewedBy->name}."
                : "Soal \"{$this->question->question_text}\" ditolak oleh {$this->reviewedBy->name}. {$note}",
            'action_url' => route('admin.questions.index', ['exam_id' => $this->question->exam_id]),
            'action_text' => 'Lihat Soal',
            'question_id' => $this->question->id,
            'exam_id' => $this->question->exam_id,
            'status' => $this->status->value,
        ];
    }

    public function toArray(object $notifiable): array
    {
        return $this->toDatabase($notifiable);
    }
}
