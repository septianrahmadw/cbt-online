<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InstitutionSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'school_name',
        'logo_url',
        'academic_year',
        'exam_event_name',
        'passing_grade_default',
        'timezone',
    ];

    protected $casts = [
        'passing_grade_default' => 'integer',
    ];

    public static function current(): self
    {
        return static::query()->firstOrCreate([], [
            'school_name' => 'Sekolah Anda',
            'academic_year' => (string) now()->year,
            'exam_event_name' => 'Ujian Berbasis Komputer',
            'passing_grade_default' => 70,
            'timezone' => 'Asia/Jakarta',
        ]);
    }
}
