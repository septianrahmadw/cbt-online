<?php

namespace App\Events;

use App\Models\ExamSession;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ExamSessionHeartbeat implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public ExamSession $session
    ) {
        // Load relationships needed for broadcast data
        $this->session->loadMissing(['exam', 'violations' => fn ($q) => $q->latest('occurred_at')->limit(1)]);
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("exam.{$this->session->exam_id}.sessions"),
            new PrivateChannel("exam-session.{$this->session->id}"),
        ];
    }

    public function broadcastWith(): array
    {
        // Hitung ulang di sini: event ini melewati queue, sehingga SerializesModels
        // memuat ulang model dari database tanpa hasil loadCount() dari constructor.
        $this->session->loadMissing(['violations' => fn ($q) => $q->latest('occurred_at')->limit(1)]);

        return [
            'session_id' => $this->session->id,
            'exam_id' => $this->session->exam_id,
            'remaining_seconds' => $this->session->secondsRemaining(),
            'violations_count' => $this->session->violations_count,
            'last_violation_type' => $this->session->violations->first()?->type,
            'answered_count' => $this->session->answers()->whereNotNull('selected_option_id')->count(),
            'total_questions' => $this->session->sessionQuestions()->count(),
            'status' => $this->session->status ?? ($this->session->is_completed ? 'submitted' : 'active'),
            'is_completed' => $this->session->is_completed,
            'timestamp' => now()->toISOString(),
        ];
    }

    public function broadcastAs(): string
    {
        return 'exam.session.heartbeat';
    }
}
