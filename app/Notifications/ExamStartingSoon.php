<?php

namespace App\Notifications;

use App\Models\Exam;
use App\Models\Participant;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class ExamStartingSoon extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Exam $exam,
        public Participant $participant,
        public int $minutesUntilStart
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'title' => 'Ujian Akan Dimulai',
            'message' => "Ujian \"{$this->exam->title}\" akan dimulai dalam {$this->minutesUntilStart} menit. Silakan siapkan diri Anda.",
            'action_url' => route('exam.login'),
            'action_text' => 'Masuk Ujian',
            'exam_id' => $this->exam->id,
            'participant_id' => $this->participant->id,
        ];
    }

    public function toArray(object $notifiable): array
    {
        return $this->toDatabase($notifiable);
    }
}
