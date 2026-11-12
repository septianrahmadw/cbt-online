<?php

namespace App\Console\Commands;

use App\Models\Exam;
use App\Models\Participant;
use App\Services\NotificationService;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

#[Signature('exam:notify-starting-soon {--minutes=15 : Menit sebelum ujian dimulai untuk mengirim notifikasi}')]
#[Description('Kirim notifikasi ujian akan segera dimulai ke peserta')]
class SendExamStartingSoonNotifications extends Command
{
    public function __construct(
        protected NotificationService $notificationService
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $minutesBefore = (int) $this->option('minutes', 15);
        $now = now();

        // Cari ujian yang akan dimulai dalam $minutesBefore menit
        $exams = Exam::query()
            ->where('is_active', true)
            ->whereNotNull('exam_date')
            ->where('exam_date', '>', $now)
            ->where('exam_date', '<=', $now->copy()->addMinutes($minutesBefore))
            ->get();

        if ($exams->isEmpty()) {
            $this->info("Tidak ada ujian yang akan dimulai dalam {$minutesBefore} menit.");

            return self::SUCCESS;
        }

        $notified = 0;

        foreach ($exams as $exam) {
            $minutesUntilStart = max(1, $now->diffInMinutes($exam->exam_date));

            // Ambil peserta yang eligible untuk ujian ini
            // Exam::scopeEligibleFor sudah handle kategori + global (tanpa kategori)
            $participants = Participant::query()
                ->where('is_active', true)
                ->where(function ($query) use ($exam) {
                    $query->whereNull('category_id')
                        ->orWhereIn('category_id', $exam->participantCategories->pluck('id'));
                })
                ->get();

            // Filter: hanya peserta yang BELUM punya hasil ujian untuk exam ini
            $participants = $participants->filter(function ($participant) use ($exam) {
                return ! $exam->results()->where('participant_id', $participant->id)->exists();
            });

            foreach ($participants as $participant) {
                // Cek apakah notifikasi sudah pernah dikirim (hindari duplikat)
                $alreadyNotified = DB::table('notifications')
                    ->where('notifiable_type', Participant::class)
                    ->where('notifiable_id', $participant->id)
                    ->whereJsonContains('data->exam_id', $exam->id)
                    ->whereJsonContains('data->title', 'Ujian Akan Dimulai')
                    ->exists();

                if ($alreadyNotified) {
                    continue;
                }

                $this->notificationService->notifyExamStartingSoon($exam, $participant, $minutesUntilStart);
                $notified++;
            }
        }

        $this->info("Berhasil mengirim {$notified} notifikasi untuk {$exams->count()} ujian.");

        return self::SUCCESS;
    }
}
