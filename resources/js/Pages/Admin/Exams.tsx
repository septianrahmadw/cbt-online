import { Link, router, usePage } from '@inertiajs/react';
import { BookOpen, CalendarClock, CheckCircle2, Clock, Pencil, Plus, Trash2, Users } from 'lucide-react';
import { type ReactNode } from 'react';
import { Badge, Card, EmptyState } from '../../components/ui';
import { AdminLayout } from '../../layouts/AdminLayout';
import type { SharedProps } from '../../types/shared';

interface ExamCategory {
    id: number;
    name: string;
    code: string;
}

interface AssignedUser {
    id: number;
    name: string;
    role: 'dosen' | 'pengawas';
}

interface Exam {
    id: number;
    title: string;
    subject_name: string;
    duration_minutes: number;
    exam_date: string | null;
    exam_end_date: string | null;
    is_active: boolean;
    randomize_questions: boolean;
    passing_grade: number;
    total_questions: number;
    questions_count: number;
    sessions_count: number;
    results_count: number;
    participant_categories_count: number;
    participant_categories: ExamCategory[];
    assigned_users: AssignedUser[];
}

interface Paginator {
    data: Exam[];
    current_page: number;
    last_page: number;
    prev_page_url: string | null;
    next_page_url: string | null;
    total: number;
}

function formatSchedule(start: string | null, end: string | null): string {
    if (!start || !end) {
        return 'Jadwal belum ditentukan';
    }

    return `${new Date(start).toLocaleString('id-ID')} s/d ${new Date(end).toLocaleString('id-ID')}`;
}

function InfoBlock({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) {
    return (
        <div className="flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-900/60">
            <span className="mt-0.5 shrink-0 text-slate-400 dark:text-slate-500">{icon}</span>
            <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                    {label}
                </p>
                <div className="mt-0.5 text-xs font-medium text-slate-700 dark:text-slate-200">{value}</div>
            </div>
        </div>
    );
}

export default function Exams({ exams }: { exams: Paginator }) {
    const { auth } = usePage<SharedProps>().props;
    const role = auth?.user?.role;
    const isAdmin = role === 'admin';
    const canManageQuestions = isAdmin || role === 'dosen';

    const remove = (exam: Exam) => {
        if (window.confirm(`Hapus ujian ${exam.title}? Semua soal dan hasil terkait akan terhapus.`)) {
            router.delete(`/admin/exams/${exam.id}`, { preserveScroll: true });
        }
    };

    return (
        <AdminLayout
            title="Daftar Ujian"
            subtitle={`${exams.total} ujian terdaftar.`}
            actions={
                isAdmin ? (
                    <Link href="/admin/exams/create" className="btn-primary h-10 px-3">
                        <Plus size={16} /> Buat Ujian
                    </Link>
                ) : undefined
            }
        >
            {exams.data.length === 0 ? (
                <Card>
                    <EmptyState>Belum ada ujian. Klik &quot;Buat Ujian&quot; untuk memulai.</EmptyState>
                </Card>
            ) : (
                <>
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {exams.data.map((exam) => (
                            <Card key={exam.id} className="flex h-full flex-col transition-shadow hover:shadow-md">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <h2 className="truncate text-base font-semibold text-slate-900 dark:text-white">
                                            {exam.title}
                                        </h2>
                                        <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                                            {exam.subject_name}
                                        </p>
                                    </div>
                                    <Badge tone={exam.is_active ? 'green' : 'slate'} className="shrink-0">
                                        {exam.is_active ? 'Aktif' : 'Nonaktif'}
                                    </Badge>
                                </div>

                                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                                    <InfoBlock
                                        icon={<CalendarClock size={14} />}
                                        label="Waktu"
                                        value={formatSchedule(exam.exam_date, exam.exam_end_date)}
                                    />
                                    <InfoBlock
                                        icon={<Clock size={14} />}
                                        label="Durasi"
                                        value={`${exam.duration_minutes} menit`}
                                    />
                                    <InfoBlock
                                        icon={<BookOpen size={14} />}
                                        label="Soal"
                                        value={`${exam.questions_count} soal`}
                                    />
                                    <InfoBlock
                                        icon={<CheckCircle2 size={14} />}
                                        label="Peserta selesai"
                                        value={`${exam.results_count} peserta`}
                                    />
                                </div>

                                <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                                            <Users size={12} /> Kategori
                                        </span>
                                        {exam.participant_categories_count > 0 ? (
                                            exam.participant_categories.map((category) => (
                                                <Badge key={category.id} tone="blue">
                                                    {category.name}
                                                </Badge>
                                            ))
                                        ) : (
                                            <span className="text-xs text-slate-500 dark:text-slate-400">Semua peserta</span>
                                        )}
                                    </div>
                                    {isAdmin && exam.assigned_users.length > 0 && (
                                        <div className="flex flex-wrap items-center gap-1.5">
                                            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                                                Ditugaskan
                                            </span>
                                            {exam.assigned_users.map((staff) => (
                                                <Badge key={staff.id} tone={staff.role === 'dosen' ? 'blue' : 'slate'}>
                                                    {staff.name}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="mt-auto flex justify-end gap-1 border-t border-slate-100 pt-3 dark:border-slate-800">
                                    {canManageQuestions && (
                                        <Link
                                            href={`/admin/questions?exam_id=${exam.id}`}
                                            className="rounded-md p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                                            aria-label="Bank soal"
                                        >
                                            <BookOpen size={15} />
                                        </Link>
                                    )}
                                    {isAdmin && (
                                        <>
                                            <Link
                                                href={`/admin/exams/${exam.id}/edit`}
                                                className="rounded-md p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                                                aria-label="Edit"
                                            >
                                                <Pencil size={15} />
                                            </Link>
                                            <button
                                                type="button"
                                                onClick={() => remove(exam)}
                                                className="rounded-md p-2 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-rose-500/10 dark:hover:text-rose-300"
                                                aria-label="Hapus"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </Card>
                        ))}
                    </div>

                    <div className="mt-5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span>
                            Halaman {exams.current_page} dari {exams.last_page}
                        </span>
                        <div className="flex gap-2">
                            {exams.prev_page_url && (
                                <Link href={exams.prev_page_url} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
                                    Sebelumnya
                                </Link>
                            )}
                            {exams.next_page_url && (
                                <Link href={exams.next_page_url} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
                                    Berikutnya
                                </Link>
                            )}
                        </div>
                    </div>
                </>
            )}
        </AdminLayout>
    );
}
