<?php

namespace App\Models;

use App\QuestionReviewStatus;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuestionVersion extends Model
{
    use HasFactory;

    protected $fillable = [
        'question_id',
        'created_by',
        'version_number',
        'review_status',
        'review_note',
        'data',
        'options_data',
        'reviewed_at',
        'reviewed_by',
    ];

    protected $casts = [
        'version_number' => 'integer',
        'review_status' => QuestionReviewStatus::class,
        'data' => 'array',
        'options_data' => 'array',
        'reviewed_at' => 'datetime',
    ];

    public function question(): BelongsTo
    {
        return $this->belongsTo(Question::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    protected function isCurrent(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->question?->current_version === $this->version_number,
        );
    }
}
