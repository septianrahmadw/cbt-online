<?php

namespace App\Events;

use App\Models\ExamSession;
use App\Models\ViolationLog;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ExamSessionViolation implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public ExamSession $session,
        public ViolationLog $violation,
        public bool $forcedSubmit = false
    ) {
        $this->session->load(['exam', 'participant']);
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("exam.{$this->session->exam_id}.violations"),
            new PrivateChannel("exam-session.{$this->session->id}"),
        ];
    }

    public function broadcastWith(): array
    {
        return [
            'session_id' => $this->session->id,
            'exam_id' => $this->session->exam_id,
            'participant' => [
                'id' => $this->session->participant->id,
                'exam_number' => $this->session->participant->exam_number,
                'full_name' => $this->session->participant->full_name,
                'class_name' => $this->session->participant->class_name,
            ],
            'violation' => [
                'type' => $this->violation->type,
                'duration_seconds' => $this->violation->duration_seconds,
                'metadata' => $this->violation->metadata,
                'occurred_at' => $this->violation->occurred_at?->toISOString(),
            ],
            'violations_count' => $this->session->violations_count,
            'forced_submit' => $this->forcedSubmit,
            'status' => $this->session->status,
        ];
    }

    public function broadcastAs(): string
    {
        return 'exam.session.violation';
    }
}
