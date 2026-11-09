<?php

namespace App;

enum QuestionReviewStatus: string
{
    case Draft = 'draft';
    case Pending = 'pending';
    case Approved = 'approved';
    case Rejected = 'rejected';

    public function label(): string
    {
        return match ($this) {
            self::Draft => 'Draf',
            self::Pending => 'Menunggu Review',
            self::Approved => 'Disetujui',
            self::Rejected => 'Ditolak',
        };
    }

    public function isEditableByDosen(): bool
    {
        return in_array($this, [self::Draft, self::Rejected], true);
    }
}
