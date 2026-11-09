<?php

namespace App\Console\Commands;

use App\Models\ExamSession;
use App\Services\ExamService;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('exam:sweep-expired')]
#[Description('Paksa submit sesi ujian yang melewati durasi atau jendela ujian')]
class SweepExpiredExamSessions extends Command
{
    public function handle(ExamService $examService): int
    {
        $forced = 0;

        ExamSession::query()
            ->where('status', 'active')
            ->where('is_completed', false)
            ->with('exam')
            ->chunkById(100, function ($sessions) use ($examService, &$forced): void {
                foreach ($sessions as $session) {
                    if (! $session->exam || ! $session->hasExpired()) {
                        continue;
                    }

                    $examService->submit($session, true);
                    $forced++;
                }
            });

        $this->comment("{$forced} sesi ujian dihentikan otomatis.");

        return self::SUCCESS;
    }
}
