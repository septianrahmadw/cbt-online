<?php

namespace App;

enum UserRole: string
{
    case Admin = 'admin';
    case Dosen = 'dosen';
    case Pengawas = 'pengawas';

    public function label(): string
    {
        return match ($this) {
            self::Admin => 'Administrator',
            self::Dosen => 'Dosen',
            self::Pengawas => 'Pengawas',
        };
    }

    /**
     * @return array<int, string>
     */
    public static function values(): array
    {
        return array_map(fn (self $role) => $role->value, self::cases());
    }
}
