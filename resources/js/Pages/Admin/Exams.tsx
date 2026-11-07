import { Link, router } from '@inertiajs/react';
import { BookOpen, Pencil, Plus, Trash2, Users } from 'lucide-react';
import { Badge, Card, EmptyState } from '../../components/ui';
import { AdminLayout } from '../../layouts/AdminLayout';

interface ExamCategory {
    id: number;
    name: string;
    code: string;
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
}

interface Paginator {
    data: Exam[];
    current_page: number;
    last_page: number;
    prev_page_url: string | null;
    next_page_url: string | null;
    total: number;
}

export default function Exams({ exams }: { exams: Paginator }) {
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
                <Link href="/admin/exams/create" className="btn-primary h-10 px-3">
                    <Plus size={16} /> Buat Ujian
                </Link>
            }
        >
            <Card>
                {exams.data.length === 0 ? (
                    <EmptyState>Belum ada ujian. Klik &quot;Buat Ujian&quot; untuk memulai.</EmptyState>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                    <th className="pb-2">Ujian</th>
                                    <th className="pb-2">Durasi</th>
                                    <th className="pb-2">Soal</th>
                                    <th className="pb-2">Kategori Peserta</th>
                                    <th className="pb-2">Peserta Selesai</th>
                                    <th className="pb-2">Status</th>
                                    <th className="pb-2 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {exams.data.map((exam) => (
                                    <tr key={exam.id}>
                                        <td className="py-2">
                                            <p className="font-medium text-slate-900 dark:text-white">{exam.title}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{exam.subject_name}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-500">
                                                {exam.exam_date && exam.exam_end_date
                                                    ? `${new Date(exam.exam_date).toLocaleString('id-ID')} s/d ${new Date(exam.exam_end_date).toLocaleString('id-ID')}`
                                                    : 'Jadwal belum ditentukan'}
                                            </p>
                                        </td>
                                        <td className="py-2 text-slate-700 dark:text-slate-300">{exam.duration_minutes} menit</td>
                                        <td className="py-2 text-slate-700 dark:text-slate-300">{exam.questions_count}</td>
                                        <td className="py-2 text-slate-700 dark:text-slate-300">
                                            {exam.participant_categories_count > 0 ? (
                                                <div className="flex flex-wrap items-center gap-1">
                                                    <Users size={14} className="shrink-0" />
                                                    {exam.participant_categories.map((category) => (
                                                        <Badge key={category.id} tone="blue">
                                                            {category.name}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-slate-500 dark:text-slate-400">Semua peserta</span>
                                            )}
                                        </td>
                                        <td className="py-2 text-slate-700 dark:text-slate-300">{exam.results_count}</td>
                                        <td className="py-2">
                                            <Badge tone={exam.is_active ? 'green' : 'slate'}>
                                                {exam.is_active ? 'Aktif' : 'Nonaktif'}
                                            </Badge>
                                        </td>
                                        <td className="py-2">
                                            <div className="flex justify-end gap-1">
                                                <Link
                                                    href={`/admin/questions?exam_id=${exam.id}`}
                                                    className="rounded-md p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                                                    aria-label="Bank soal"
                                                >
                                                    <BookOpen size={15} />
                                                </Link>
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
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="mt-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
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
            </Card>
        </AdminLayout>
    );
}
