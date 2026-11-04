<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExamResult extends Model
{
    use HasFactory;

    protected $fillable = [
        'exam_id',
        'participant_id',
        'session_id',
        'total_correct',
        'total_wrong',
        'total_empty',
        'final_score',
        'passing_status',
        'completed_at',
    ];

    protected $casts = [
        'total_correct' => 'integer',
        'total_wrong' => 'integer',
        'total_empty' => 'integer',
        'final_score' => 'float',
        'completed_at' => 'datetime',
    ];

    public function exam(): BelongsTo
    {
        return $this->belongsTo(Exam::class);
    }

    public function participant(): BelongsTo
    {
        return $this->belongsTo(Participant::class);
    }

    public function session(): BelongsTo
    {
        return $this->belongsTo(ExamSession::class, 'session_id');
    }
}
