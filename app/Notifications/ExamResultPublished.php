<?php

namespace App\Notifications;

use App\Models\Exam;
use App\Models\ExamResult;
use App\Models\Participant;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class ExamResultPublished extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public ExamResult $result,
        public Exam $exam,
        public Participant $participant
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        $statusLabel = $this->result->passing_status === 'lulus' ? 'LULUS' : 'BELUM LULUS';

        return [
            'title' => 'Hasil Ujian Keluar',
            'message' => "Hasil ujian \"{$this->exam->title}\" Anda: {$statusLabel} (Nilai: {$this->result->final_score})",
            'action_url' => route('exam.result'),
            'action_text' => 'Lihat Hasil',
            'exam_id' => $this->exam->id,
            'participant_id' => $this->participant->id,
            'result_id' => $this->result->id,
            'score' => $this->result->final_score,
            'status' => $this->result->passing_status,
        ];
    }

    public function toArray(object $notifiable): array
    {
        return $this->toDatabase($notifiable);
    }
}
