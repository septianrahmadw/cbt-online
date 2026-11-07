import { router, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    BadgeCheck,
    BookOpen,
    CalendarClock,
    CheckCircle2,
    Clock,
    GraduationCap,
    LayoutList,
    LogIn,
    User,
} from 'lucide-react';
import { Alert, Badge, Button, Card, EmptyState } from '../../components/ui';
import { ExamLayout } from '../../layouts/ExamLayout';
import type { SharedProps } from '../../types/shared';

type WindowState = 'unscheduled' | 'not_open' | 'open' | 'closed';

interface ExamOption {
    id: number;
    title: string;
    subject_name: string;
    duration_minutes: number;
    passing_grade: number;
    questions_count: number;
    exam_date: string | null;
    exam_end_date: string | null;
    window_state: WindowState;
}

interface ParticipantInfo {
    exam_number: string;
    full_name: string;
    class_name: string | null;
    category_name: string | null;
}

const statusConfig: Record<WindowState, { label: string; tone: 'green' | 'yellow' | 'red' | 'slate' }> = {
    open: { label: 'Berlangsung', tone: 'green' },
    not_open: { label: 'Belum dibuka', tone: 'yellow' },
    closed: { label: 'Sudah ditutup', tone: 'red' },
    unscheduled: { label: 'Belum dijadwalkan', tone: 'slate' },
};

export default function ExamConfirm({
    participant,
    exams,
}: {
    participant: ParticipantInfo;
    exams: ExamOption[];
    serverTime: string;
}) {
    const { props } = usePage<SharedProps & { errors?: { exam_id?: string } }>();
    const startExam = (examId: number) => {
        router.post('/exam/start', { exam_id: examId });
    };

    const resetLookup = () => {
        router.post('/exam/confirm/reset');
    };

    return (
        <ExamLayout wide>
            <div className="mx-auto w-full max-w-4xl">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-md shadow-brand-200 dark:shadow-none">
                            <BookOpen size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Konfirmasi Ujian</h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Berikut daftar ujian yang tersedia untuk Anda.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={resetLookup}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-300"
                    >
                        <ArrowLeft size={14} /> Bukan Anda? Ganti peserta
                    </button>
                </div>

                {props.errors?.exam_id && <Alert tone="error">{props.errors.exam_id}</Alert>}

                <Card className="mb-5 flex flex-wrap items-center gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
                        <User size={24} />
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-base font-semibold text-slate-900 dark:text-white">
                            {participant.full_name}
                        </p>
                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                            No. Peserta: {participant.exam_number}
                            {participant.class_name ? ` • Kelas ${participant.class_name}` : ''}
                        </p>
                    </div>
                    {participant.category_name && (
                        <Badge tone="blue">
                            <BadgeCheck size={12} /> {participant.category_name}
                        </Badge>
                    )}
                </Card>

                {exams.length === 0 ? (
                    <EmptyState>
                        <div className="mx-auto max-w-md space-y-2">
                            <p className="font-semibold text-slate-700 dark:text-slate-200">
                                Tidak ada ujian tersedia
                            </p>
                            <p>
                                Tidak ada ujian aktif yang dapat Anda ikuti pada kategori/kelas Anda. Hubungi
                                pengawas atau admin jika ini kesalahan.
                            </p>
                            <Button variant="secondary" size="sm" className="mt-2" onClick={resetLookup}>
                                <ArrowLeft size={14} /> Kembali
                            </Button>
                        </div>
                    </EmptyState>
                ) : (
                    <div className="grid gap-4">
                        {exams.map((exam) => {
                            const status = statusConfig[exam.window_state];
                            const canStart = exam.window_state === 'open';

                            return (
                                <Card key={exam.id} className="flex flex-col gap-4 sm:flex-row sm:items-center">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                                                {exam.title}
                                            </h2>
                                            <Badge tone={status.tone}>{status.label}</Badge>
                                        </div>
                                        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                                            {exam.subject_name}
                                        </p>
                                        <div className="mt-3 grid gap-1.5 text-xs text-slate-500 dark:text-slate-400 sm:grid-cols-2">
                                            <p className="flex items-center gap-1.5">
                                                <CalendarClock size={13} className="shrink-0" />
                                                {exam.exam_date && exam.exam_end_date
                                                    ? `${new Date(exam.exam_date).toLocaleString('id-ID', {
                                                          day: '2-digit',
                                                          month: 'short',
                                                          year: 'numeric',
                                                          hour: '2-digit',
                                                          minute: '2-digit',
                                                      })} s/d ${new Date(exam.exam_end_date).toLocaleString('id-ID', {
                                                          day: '2-digit',
                                                          month: 'short',
                                                          year: 'numeric',
                                                          hour: '2-digit',
                                                          minute: '2-digit',
                                                      })}`
                                                    : 'Jadwal belum ditentukan'}
                                            </p>
                                            <p className="flex items-center gap-1.5">
                                                <Clock size={13} className="shrink-0" /> {exam.duration_minutes} menit
                                                &middot; <LayoutList size={13} className="shrink-0" />{' '}
                                                {exam.questions_count} soal
                                                &middot; <GraduationCap size={13} className="shrink-0" /> KKM{' '}
                                                {exam.passing_grade}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="shrink-0 sm:text-right">
                                        <Button
                                            className="w-full sm:w-auto"
                                            disabled={!canStart}
                                            onClick={() => startExam(exam.id)}
                                        >
                                            <LogIn size={16} /> Masuk Ujian
                                        </Button>
                                        {!canStart && (
                                            <p className="mt-1.5 text-[11px] text-slate-400 dark:text-slate-500">
                                                {exam.window_state === 'not_open' && 'Tombol aktif saat ujian dibuka.'}
                                                {exam.window_state === 'closed' && 'Jendela ujian sudah berakhir.'}
                                                {exam.window_state === 'unscheduled' && 'Menunggu jadwal dari admin.'}
                                            </p>
                                        )}
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}

                <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-[11px] text-slate-400 dark:text-slate-500">
                    <CheckCircle2 size={12} /> Daftar ujian ditampilkan sesuai kategori peserta Anda.
                </p>
            </div>
        </ExamLayout>
    );
}
