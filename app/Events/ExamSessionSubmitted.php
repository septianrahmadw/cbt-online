<?php

namespace App\Events;

use App\Models\ExamResult;
use App\Models\ExamSession;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ExamSessionSubmitted implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public ExamSession $session,
        public ExamResult $result,
        public bool $forced = false
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
            'participant' => [
                'id' => $this->session->participant->id,
                'exam_number' => $this->session->participant->exam_number,
                'full_name' => $this->session->participant->full_name,
                'class_name' => $this->session->participant->class_name,
            ],
            'result' => [
                'total_correct' => $this->result->total_correct,
                'total_wrong' => $this->result->total_wrong,
                'total_empty' => $this->result->total_empty,
                'final_score' => $this->result->final_score,
                'passing_status' => $this->result->passing_status,
                'completed_at' => $this->result->completed_at?->toISOString(),
            ],
            'forced' => $this->forced,
            'status' => $this->session->status,
        ];
    }

    public function broadcastAs(): string
    {
        return 'exam.session.submitted';
    }
}
