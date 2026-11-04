import { Link, router, useForm } from '@inertiajs/react';
import { BookOpen, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Badge, Button, Card, EmptyState, Input, Label, Modal, Select } from '../../components/ui';
import { AdminLayout } from '../../layouts/AdminLayout';

interface Exam {
    id: number;
    title: string;
    subject_name: string;
    duration_minutes: number;
    exam_date: string | null;
    is_active: boolean;
    randomize_questions: boolean;
    passing_grade: number;
    total_questions: number;
    questions_count: number;
    sessions_count: number;
    results_count: number;
}

interface Paginator {
    data: Exam[];
    current_page: number;
    last_page: number;
    prev_page_url: string | null;
    next_page_url: string | null;
    total: number;
}

function toLocalInput(value: string | null): string {
    if (!value) {
        return '';
    }

    const date = new Date(value);
    const offset = date.getTimezoneOffset();
    return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

export default function Exams({ exams }: { exams: Paginator }) {
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Exam | null>(null);

    const form = useForm({
        title: '',
        subject_name: '',
        duration_minutes: 60,
        exam_date: '',
        is_active: true,
        randomize_questions: true,
        passing_grade: 70,
    });

    const openCreate = () => {
        setEditing(null);
        form.reset();
        form.clearErrors();
        setModalOpen(true);
    };

    const openEdit = (exam: Exam) => {
        setEditing(exam);
        form.setData({
            title: exam.title,
            subject_name: exam.subject_name,
            duration_minutes: exam.duration_minutes,
            exam_date: toLocalInput(exam.exam_date),
            is_active: exam.is_active,
            randomize_questions: exam.randomize_questions,
            passing_grade: exam.passing_grade,
        });
        form.clearErrors();
        setModalOpen(true);
    };

    const submit = (event: React.FormEvent) => {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                setModalOpen(false);
                form.reset();
            },
        };

        if (editing) {
            form.put(`/admin/exams/${editing.id}`, options);
        } else {
            form.post('/admin/exams', options);
        }
    };

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
                <Button onClick={openCreate}>
                    <Plus size={16} /> Buat Ujian
                </Button>
            }
        >
            <Card>
                {exams.data.length === 0 ? (
                    <EmptyState>Belum ada ujian. Klik "Buat Ujian" untuk memulai.</EmptyState>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                    <th className="pb-2">Ujian</th>
                                    <th className="pb-2">Durasi</th>
                                    <th className="pb-2">Soal</th>
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
                                                {exam.exam_date
                                                    ? new Date(exam.exam_date).toLocaleString('id-ID')
                                                    : 'Jadwal belum ditentukan'}
                                            </p>
                                        </td>
                                        <td className="py-2 text-slate-700 dark:text-slate-300">{exam.duration_minutes} menit</td>
                                        <td className="py-2 text-slate-700 dark:text-slate-300">{exam.questions_count}</td>
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
                                                <button
                                                    type="button"
                                                    onClick={() => openEdit(exam)}
                                                    className="rounded-md p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                                                    aria-label="Edit"
                                                >
                                                    <Pencil size={15} />
                                                </button>
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

            <Modal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editing ? 'Edit Ujian' : 'Buat Ujian'}
                footer={
                    <>
                        <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>
                            Batal
                        </Button>
                        <Button type="submit" form="exam-form" disabled={form.processing}>
                            Simpan
                        </Button>
                    </>
                }
            >
                <form id="exam-form" onSubmit={submit} className="space-y-3">
                    <div>
                        <Label htmlFor="title">Nama Ujian</Label>
                        <Input
                            id="title"
                            value={form.data.title}
                            onChange={(event) => form.setData('title', event.target.value)}
                            placeholder="Matematika Terintegrasi"
                            required
                        />
                        {form.errors.title && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{form.errors.title}</p>}
                    </div>

                    <div>
                        <Label htmlFor="subject_name">Mata Pelajaran</Label>
                        <Input
                            id="subject_name"
                            value={form.data.subject_name}
                            onChange={(event) => form.setData('subject_name', event.target.value)}
                            placeholder="Matematika, Fisika, Kimia"
                            required
                        />
                        {form.errors.subject_name && (
                            <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{form.errors.subject_name}</p>
                        )}
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                            <Label htmlFor="duration_minutes">Durasi (menit)</Label>
                            <Input
                                id="duration_minutes"
                                type="number"
                                min={1}
                                max={600}
                                value={form.data.duration_minutes}
                                onChange={(event) => form.setData('duration_minutes', Number(event.target.value))}
                            />
                        </div>
                        <div>
                            <Label htmlFor="passing_grade">KKM</Label>
                            <Input
                                id="passing_grade"
                                type="number"
                                min={0}
                                max={100}
                                value={form.data.passing_grade}
                                onChange={(event) => form.setData('passing_grade', Number(event.target.value))}
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="exam_date">Tanggal & Waktu</Label>
                        <Input
                            id="exam_date"
                            type="datetime-local"
                            value={form.data.exam_date}
                            onChange={(event) => form.setData('exam_date', event.target.value)}
                        />
                        {form.errors.exam_date && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{form.errors.exam_date}</p>}
                    </div>

                    <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={form.data.is_active}
                                onChange={(event) => form.setData('is_active', event.target.checked)}
                                className="h-4 w-4 rounded border-slate-300 bg-white text-brand-600 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-950"
                            />
                            Aktifkan ujian untuk peserta
                        </label>
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={form.data.randomize_questions}
                                onChange={(event) => form.setData('randomize_questions', event.target.checked)}
                                className="h-4 w-4 rounded border-slate-300 bg-white text-brand-600 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-950"
                            />
                            Acak urutan soal per peserta
                        </label>
                    </div>
                </form>
            </Modal>
        </AdminLayout>
    );
}
