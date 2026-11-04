<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class ExamSession extends Model
{
    use HasFactory;

    protected $fillable = [
        'exam_id',
        'participant_id',
        'start_time',
        'end_time',
        'remaining_seconds',
        'is_completed',
        'violations_count',
        'status',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'start_time' => 'datetime',
        'end_time' => 'datetime',
        'remaining_seconds' => 'integer',
        'is_completed' => 'boolean',
        'violations_count' => 'integer',
    ];

    public function exam(): BelongsTo
    {
        return $this->belongsTo(Exam::class);
    }

    public function participant(): BelongsTo
    {
        return $this->belongsTo(Participant::class);
    }

    public function sessionQuestions(): HasMany
    {
        return $this->hasMany(ExamSessionQuestion::class, 'session_id')->orderBy('display_order');
    }

    public function answers(): HasMany
    {
        return $this->hasMany(StudentAnswer::class, 'session_id');
    }

    public function result(): HasOne
    {
        return $this->hasOne(ExamResult::class, 'session_id');
    }

    public function violations(): HasMany
    {
        return $this->hasMany(ViolationLog::class, 'session_id');
    }

    public function isActive(): bool
    {
        return $this->status === 'active' && ! $this->is_completed;
    }

    public function secondsRemaining(): int
    {
        if ($this->is_completed) {
            return 0;
        }

        $elapsed = now()->getTimestamp() - $this->start_time->getTimestamp();
        $remaining = ($this->exam->duration_minutes * 60) - max(0, $elapsed);

        return max(0, (int) floor($remaining));
    }
}
