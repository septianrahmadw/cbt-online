<?php

namespace App\Models;

use App\QuestionReviewStatus;
use Illuminate\Database\Eloquent\Builder;
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
        'review_status',
        'review_note',
        'reviewed_by',
        'reviewed_at',
        'created_by',
        'score_weight',
        'current_version',
    ];

    protected $casts = [
        'question_number' => 'integer',
        'score_weight' => 'float',
        'is_active' => 'boolean',
        'review_status' => QuestionReviewStatus::class,
        'reviewed_at' => 'datetime',
        'current_version' => 'integer',
    ];

    /**
     * @return Builder<Question>
     */
    public function scopeApproved(Builder $query): Builder
    {
        return $query
            ->where('review_status', QuestionReviewStatus::Approved->value)
            ->where('is_active', true);
    }

    public function exam(): BelongsTo
    {
        return $this->belongsTo(Exam::class);
    }

    public function module(): BelongsTo
    {
        return $this->belongsTo(Module::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
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

    public function versions(): HasMany
    {
        return $this->hasMany(QuestionVersion::class)->orderBy('version_number');
    }

    public function currentVersion(): HasOne
    {
        return $this->hasOne(QuestionVersion::class)->where('version_number', $this->current_version ?? 1);
    }

    public function latestVersion(): HasOne
    {
        return $this->hasOne(QuestionVersion::class)->latest('version_number');
    }

    public function approvedVersion(): HasOne
    {
        return $this->hasOne(QuestionVersion::class)
            ->where('review_status', QuestionReviewStatus::Approved->value)
            ->latest('version_number');
    }
}
