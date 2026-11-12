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
    ) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("exam.{$this->session->exam_id}.sessions"),
            new PrivateChannel("exam-session.{$this->session->id}"),
        ];
    }

    public function broadcastWith(): array
    {
        return [
            'session_id' => $this->session->id,
            'exam_id' => $this->session->exam_id,
            'remaining_seconds' => $this->session->remaining_seconds,
            'violations_count' => $this->session->violations_count,
            'status' => $this->session->status,
            'timestamp' => now()->toISOString(),
        ];
    }

    public function broadcastAs(): string
    {
        return 'exam.session.heartbeat';
    }
}
