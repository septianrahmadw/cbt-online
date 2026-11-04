<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Question extends Model
{
    use HasFactory;

    public const TYPES = ['single', 'multiple'];

    public const DIFFICULTIES = ['mudah', 'sedang', 'sulit'];

    protected $fillable = [
        'exam_id',
        'module_id',
        'question_number',
        'passage',
        'type',
        'difficulty',
        'question_text',
        'image_url',
        'explanation',
        'is_active',
        'score_weight',
    ];

    protected $casts = [
        'question_number' => 'integer',
        'score_weight' => 'float',
        'is_active' => 'boolean',
    ];

    public function exam(): BelongsTo
    {
        return $this->belongsTo(Exam::class);
    }

    public function module(): BelongsTo
    {
        return $this->belongsTo(Module::class);
    }

    public function options(): HasMany
    {
        return $this->hasMany(QuestionOption::class)->orderBy('label');
    }

    public function correctOption(): HasOne
    {
        return $this->hasOne(QuestionOption::class)->where('is_correct', true);
    }

    public function correctOptions(): HasMany
    {
        return $this->hasMany(QuestionOption::class)->where('is_correct', true)->orderBy('label');
    }
}
