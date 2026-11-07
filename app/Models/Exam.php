<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
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
        'exam_end_date',
        'is_active',
        'violations_enabled',
        'violation_limit',
        'randomize_questions',
        'passing_grade',
        'total_questions',
    ];

    protected $casts = [
        'exam_date' => 'datetime',
        'exam_end_date' => 'datetime',
        'is_active' => 'boolean',
        'violations_enabled' => 'boolean',
        'violation_limit' => 'integer',
        'randomize_questions' => 'boolean',
        'duration_minutes' => 'integer',
        'passing_grade' => 'integer',
        'total_questions' => 'integer',
    ];

    /**
     * @return 'unscheduled'|'not_open'|'open'|'closed'
     */
    public function windowState(?\DateTimeInterface $now = null): string
    {
        $now = $now ?? now();

        if (! $this->exam_date || ! $this->exam_end_date) {
            return 'unscheduled';
        }

        if ($now < $this->exam_date) {
            return 'not_open';
        }

        if ($now > $this->exam_end_date) {
            return 'closed';
        }

        return 'open';
    }

    public function isOpenForAttempt(?\DateTimeInterface $now = null): bool
    {
        return $this->windowState($now) === 'open';
    }

    /**
     * @return array{enabled: bool, limit: int}
     */
    public function effectiveViolationSettings(): array
    {
        $global = InstitutionSetting::current();

        return [
            'enabled' => $this->violations_enabled ?? $global->violations_enabled,
            'limit' => $this->violation_limit ?? $global->violation_limit,
        ];
    }

    /**
     * @return Builder<Exam>
     */
    public function scopeEligibleFor(Builder $query, Participant $participant): Builder
    {
        return $query->where('is_active', true)
            ->where(fn (Builder $query) => $query
                ->whereDoesntHave('participantCategories')
                ->orWhereHas('participantCategories', fn (Builder $query) => $query
                    ->where('participant_categories.id', $participant->category_id)));
    }

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
