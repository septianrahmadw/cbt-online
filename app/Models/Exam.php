<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Exam extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'subject_name',
        'duration_minutes',
        'exam_date',
        'is_active',
        'randomize_questions',
        'passing_grade',
        'total_questions',
    ];

    protected $casts = [
        'exam_date' => 'datetime',
        'is_active' => 'boolean',
        'randomize_questions' => 'boolean',
        'duration_minutes' => 'integer',
        'passing_grade' => 'integer',
        'total_questions' => 'integer',
    ];

    public function questions(): HasMany
    {
        return $this->hasMany(Question::class)->orderBy('question_number');
    }

    public function sessions(): HasMany
    {
        return $this->hasMany(ExamSession::class);
    }

    public function results(): HasMany
    {
        return $this->hasMany(ExamResult::class);
    }

    public function participantCategories(): BelongsToMany
    {
        return $this->belongsToMany(ParticipantCategory::class)->withTimestamps();
    }
}
