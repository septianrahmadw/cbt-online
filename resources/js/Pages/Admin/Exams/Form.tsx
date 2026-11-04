import { Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import { AdminLayout } from '../../../layouts/AdminLayout';
import { Button, Card, Input, Label } from '../../../components/ui';

interface ExamCategoryOption {
    id: number;
    name: string;
    code: string;
    participants_count: number;
}

interface ExamData {
    id: number;
    title: string;
    subject_name: string;
    duration_minutes: number;
    exam_date: string | null;
    is_active: boolean;
    randomize_questions: boolean;
    passing_grade: number;
    category_ids: number[];
}

export default function ExamForm({
    exam,
    categories,
}: {
    exam: ExamData | null;
    categories: ExamCategoryOption[];
}) {
    const form = useForm({
        title: exam?.title ?? '',
        subject_name: exam?.subject_name ?? '',
        duration_minutes: exam?.duration_minutes ?? 60,
        exam_date: exam?.exam_date ?? '',
        is_active: exam?.is_active ?? true,
        randomize_questions: exam?.randomize_questions ?? true,
        passing_grade: exam?.passing_grade ?? 70,
        category_ids: (exam?.category_ids ?? []) as number[],
    });

    const toggleCategory = (id: number) => {
        form.setData(
            'category_ids',
            form.data.category_ids.includes(id)
                ? form.data.category_ids.filter((categoryId) => categoryId !== id)
                : [...form.data.category_ids, id],
        );
    };

    const submit = (event: React.FormEvent) => {
        event.preventDefault();

        if (exam) {
            form.put(`/admin/exams/${exam.id}`);
        } else {
            form.post('/admin/exams');
        }
    };

    return (
        <AdminLayout
            title={exam ? 'Edit Ujian' : 'Buat Ujian'}
            subtitle="Atur pengaturan ujian dan kategori peserta yang boleh mengikuti"
            actions={
                <Link
                    href="/admin/exams"
                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                    <ArrowLeft size={16} /> Kembali ke Daftar Ujian
                </Link>
            }
        >
            <form onSubmit={submit}>
                <Card className="max-w-3xl space-y-4">
                    {Object.keys(form.errors).length > 0 && (
                        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200">
                            Periksa kembali isian ujian di bawah ini.
                        </p>
                    )}

                    <div>
                        <Label htmlFor="title">
                            Nama Ujian <span className="text-rose-500">*</span>
                        </Label>
                        <Input
                            id="title"
                            value={form.data.title}
                            onChange={(event) => form.setData('title', event.target.value)}
                            placeholder="Matematika Terintegrasi"
                            required
                        />
                        {form.errors.title && (
                            <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{form.errors.title}</p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="subject_name">
                            Mata Pelajaran <span className="text-rose-500">*</span>
                        </Label>
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

                    <div className="grid gap-4 sm:grid-cols-2">
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
                            {form.errors.duration_minutes && (
                                <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{form.errors.duration_minutes}</p>
                            )}
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
                            {form.errors.passing_grade && (
                                <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{form.errors.passing_grade}</p>
                            )}
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
                        {form.errors.exam_date && (
                            <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{form.errors.exam_date}</p>
                        )}
                    </div>

                    <div>
                        <Label>Kategori Peserta yang Diperbolehkan</Label>
                        <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
                            Kosongkan untuk membuka ujian bagi semua peserta aktif. Centang kategori peserta yang boleh
                            mengikuti ujian ini.
                        </p>
                        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-800">
                            {categories.length === 0 ? (
                                <p className="p-3 text-sm text-slate-500 dark:text-slate-400">
                                    Belum ada kategori aktif.{' '}
                                    <Link
                                        href="/admin/participant-categories/create"
                                        className="font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-300"
                                    >
                                        Buat kategori
                                    </Link>
                                </p>
                            ) : (
                                categories.map((category) => {
                                    const checked = form.data.category_ids.includes(category.id);
                                    return (
                                        <label
                                            key={category.id}
                                            className="flex cursor-pointer items-center gap-3 px-3 py-3 hover:bg-slate-50 dark:hover:bg-slate-800"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() => toggleCategory(category.id)}
                                                className="h-4 w-4 rounded border-slate-300 bg-white text-brand-600 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-950"
                                            />
                                            <span className="min-w-0 flex-1">
                                                <span className="block text-sm font-medium text-slate-900 dark:text-white">
                                                    {category.name}
                                                </span>
                                                <span className="block font-mono text-xs text-slate-500 dark:text-slate-400">
                                                    {category.code} · {category.participants_count} peserta
                                                </span>
                                            </span>
                                        </label>
                                    );
                                })
                            )}
                        </div>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {form.data.category_ids.length === 0
                                ? 'Semua peserta aktif bisa mengikuti ujian ini.'
                                : `${form.data.category_ids.length} kategori dipilih. Peserta di luar kategori ini tidak bisa masuk.`}
                        </p>
                        {(form.errors.category_ids || form.errors['category_ids.0']) && (
                            <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">
                                {form.errors.category_ids ?? form.errors['category_ids.0']}
                            </p>
                        )}
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

                    <div className="flex justify-end gap-2 pt-2">
                        <Link href="/admin/exams" className="btn-secondary">
                            Batal
                        </Link>
                        <Button type="submit" disabled={form.processing}>
                            <Save size={16} /> {form.processing ? 'Menyimpan...' : 'Simpan'}
                        </Button>
                    </div>
                </Card>
            </form>
        </AdminLayout>
    );
}
