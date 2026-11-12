<?php

namespace App\Notifications;

use App\Models\Exam;
use App\Models\ExamSession;
use App\Models\Participant;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class ExamSessionStopped extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public ExamSession $session,
        public Exam $exam,
        public Participant $participant,
        public ?User $stoppedBy = null,
        public bool $forced = false
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        $byWhom = $this->stoppedBy
            ? "{$this->stoppedBy->name} ({$this->stoppedBy->role->label()})"
            : 'Sistem (batas pelanggaran tercapai)';

        return [
            'title' => $this->forced ? 'Ujian Dihentikan Paksa' : 'Ujian Dihentikan oleh Pengawas',
            'message' => "Sesi ujian \"{$this->exam->title}\" Anda dihentikan oleh {$byWhom}.",
            'action_url' => route('exam.result'),
            'action_text' => 'Lihat Hasil',
            'exam_id' => $this->exam->id,
            'participant_id' => $this->participant->id,
            'session_id' => $this->session->id,
            'forced' => $this->forced,
        ];
    }

    public function toArray(object $notifiable): array
    {
        return $this->toDatabase($notifiable);
    }
}
