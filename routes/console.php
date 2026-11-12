<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('exam:sweep-expired')->everyMinute()->withoutOverlapping();

// Kirim notifikasi ujian akan dimulai setiap menit (cek ujian yang mulai dalam 15 menit)
Schedule::command('exam:notify-starting-soon', ['--minutes' => 15])
    ->everyMinute()
    ->withoutOverlapping();
