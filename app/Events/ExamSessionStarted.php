<?php

namespace App\Events;

use App\Models\ExamSession;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ExamSessionStarted implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public ExamSession $session
    ) {
        $this->session->load(['exam', 'participant']);
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
        return [
            'session_id' => $this->session->id,
            'exam_id' => $this->session->exam_id,
            'exam_title' => $this->session->exam?->title,
            'participant' => [
                'id' => $this->session->participant->id,
                'exam_number' => $this->session->participant->exam_number,
                'full_name' => $this->session->participant->full_name,
                'class_name' => $this->session->participant->class_name,
            ],
            'start_time' => $this->session->start_time?->toISOString(),
            'duration_minutes' => $this->session->exam?->duration_minutes,
            'remaining_seconds' => $this->session->remaining_seconds,
            'status' => $this->session->status,
        ];
    }

    public function broadcastAs(): string
    {
        return 'exam.session.started';
    }
}
