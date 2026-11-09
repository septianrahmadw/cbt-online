import { Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import { useState } from 'react';
import { AdminLayout } from '../../../layouts/AdminLayout';
import { Button, Card, Input, Label, Select } from '../../../components/ui';
import { DateTimeField } from '../../../components/DateTimeField';
import { addMinutes, nowLocalInput, todayAt } from '../../../lib/datetime';

interface ExamCategoryOption {
    id: number;
    name: string;
    code: string;
    participants_count: number;
}

interface StaffOption {
    id: number;
    name: string;
}

interface ExamData {
    id: number;
    title: string;
    subject_name: string;
    duration_minutes: number;
    exam_date: string | null;
    exam_end_date: string | null;
    is_active: boolean;
    violations_enabled: boolean | null;
    violation_limit: number | null;
    randomize_questions: boolean;
    passing_grade: number;
    category_ids: number[];
    dosen_ids: number[];
    pengawas_ids: number[];
}

export default function ExamForm({
    exam,
    categories,
    dosens,
    pengawas,
}: {
    exam: ExamData | null;
    categories: ExamCategoryOption[];
    dosens: StaffOption[];
    pengawas: StaffOption[];
}) {
    const form = useForm({
        title: exam?.title ?? '',
        subject_name: exam?.subject_name ?? '',
        duration_minutes: exam?.duration_minutes ?? 60,
        exam_date: exam?.exam_date ?? '',
        exam_end_date: exam?.exam_end_date ?? '',
        is_active: exam?.is_active ?? true,
        violation_setting:
            exam?.violations_enabled === null || exam?.violations_enabled === undefined
                ? 'global'
                : exam.violations_enabled
                  ? 'enabled'
                  : 'disabled',
        violation_limit: exam?.violation_limit ?? null,
        randomize_questions: exam?.randomize_questions ?? true,
        passing_grade: exam?.passing_grade ?? 70,
        category_ids: (exam?.category_ids ?? []) as number[],
        dosen_ids: (exam?.dosen_ids ?? []) as number[],
        pengawas_ids: (exam?.pengawas_ids ?? []) as number[],
    });

    const toggle = (field: 'category_ids' | 'dosen_ids' | 'pengawas_ids', id: number) => {
        form.setData(
            field,
            form.data[field].includes(id)
                ? form.data[field].filter((itemId) => itemId !== id)
                : [...form.data[field], id],
        );
    };

    const [autoSyncEnd, setAutoSyncEnd] = useState(!exam || !exam.exam_end_date);

    const updateStart = (value: string) => {
        form.setData('exam_date', value);

        if (autoSyncEnd && value) {
            form.setData('exam_end_date', addMinutes(value, form.data.duration_minutes));
        }
    };

    const updateDuration = (value: number) => {
        form.setData('duration_minutes', value);

        if (autoSyncEnd && form.data.exam_date && value > 0) {
            form.setData('exam_end_date', addMinutes(form.data.exam_date, value));
        }
    };

    const updateEnd = (value: string) => {
        form.setData('exam_end_date', value);

        if (autoSyncEnd) {
            setAutoSyncEnd(false);
        }
    };

    const toggleAutoSync = (checked: boolean) => {
        setAutoSyncEnd(checked);

        if (checked && form.data.exam_date) {
            form.setData('exam_end_date', addMinutes(form.data.exam_date, form.data.duration_minutes));
        }
    };

    const endBeforeStart =
        form.data.exam_date !== '' &&
        form.data.exam_end_date !== '' &&
        form.data.exam_end_date < form.data.exam_date;

    const quickButton = (label: string, onClick: () => void) => (
        <button
            key={label}
            type="button"
            onClick={onClick}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
        >
            {label}
        </button>
    );

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
                                onChange={(event) => updateDuration(Number(event.target.value))}
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

                    <div className="space-y-4 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                        <div>
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Jadwal Ujian</h3>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                Ujian hanya bisa diakses dalam rentang waktu ini. Saat waktu selesai tercapai, sesi
                                yang sedang berjalan dipaksa submit otomatis.
                            </p>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <DateTimeField
                                id="exam_date"
                                label="Tanggal & Waktu Mulai"
                                value={form.data.exam_date}
                                onChange={updateStart}
                                error={form.errors.exam_date}
                                required
                                footer={
                                    <>
                                        {quickButton('Sekarang', () => updateStart(nowLocalInput()))}
                                        {quickButton('Hari ini 08:00', () => updateStart(todayAt(8)))}
                                        {quickButton('Besok 08:00', () => updateStart(todayAt(8, 0, 1)))}
                                    </>
                                }
                            />
                            <DateTimeField
                                id="exam_end_date"
                                label="Tanggal & Waktu Selesai"
                                value={form.data.exam_end_date}
                                onChange={updateEnd}
                                error={form.errors.exam_end_date}
                                required
                                footer={
                                    <>
                                        {quickButton('Samakan dengan mulai', () => updateEnd(form.data.exam_date))}
                                        {quickButton('Mulai + durasi', () =>
                                            updateEnd(addMinutes(form.data.exam_date, form.data.duration_minutes)),
                                        )}
                                        {quickButton('+1 hari', () =>
                                            updateEnd(
                                                addMinutes(
                                                    form.data.exam_end_date || form.data.exam_date,
                                                    24 * 60,
                                                ),
                                            ),
                                        )}
                                    </>
                                }
                            />
                        </div>

                        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                            <input
                                type="checkbox"
                                checked={autoSyncEnd}
                                onChange={(event) => toggleAutoSync(event.target.checked)}
                                className="h-4 w-4 rounded border-slate-300 bg-white text-brand-600 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-950"
                            />
                            Hitung waktu selesai otomatis dari durasi ({form.data.duration_minutes} menit)
                        </label>

                        {endBeforeStart && (
                            <p className="text-xs text-rose-600 dark:text-rose-400">
                                Waktu selesai harus setelah waktu mulai.
                            </p>
                        )}
                    </div>

                    <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Pelanggaran</h3>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Kosongkan untuk mengikuti Pengaturan Lembaga. Jika dinonaktifkan, pelanggaran tetap
                            dicatat tetapi tidak ada paksa submit otomatis.
                        </p>
                        <div className="mt-3 grid gap-4 sm:grid-cols-2">
                            <div>
                                <Label htmlFor="violation_setting">Batas Pelanggaran</Label>
                                <Select
                                    id="violation_setting"
                                    value={form.data.violation_setting}
                                    onChange={(event) => form.setData('violation_setting', event.target.value as 'global' | 'enabled' | 'disabled')}
                                >
                                    <option value="global">Ikut pengaturan global</option>
                                    <option value="enabled">Aktif (paksa submit)</option>
                                    <option value="disabled">Nonaktif (hanya dicatat)</option>
                                </Select>
                                {form.errors.violation_setting && (
                                    <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{form.errors.violation_setting}</p>
                                )}
                            </div>
                            <div>
                                <Label htmlFor="violation_limit">Maks. Pelanggaran (opsional)</Label>
                                <Input
                                    id="violation_limit"
                                    type="number"
                                    min={1}
                                    max={10}
                                    placeholder="Ikut global"
                                    value={form.data.violation_limit ?? ''}
                                    onChange={(event) =>
                                        form.setData('violation_limit', event.target.value === '' ? null : Number(event.target.value))
                                    }
                                />
                                {form.errors.violation_limit && (
                                    <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{form.errors.violation_limit}</p>
                                )}
                            </div>
                        </div>
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
                                                onChange={() => toggle('category_ids', category.id)}
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

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <Label>Dosen Pengampu</Label>
                            <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
                                Dosen hanya dapat mengelola soal dan melihat nilai pada ujian yang ditugaskan.
                            </p>
                            <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100 dark:border-slate-700 dark:divide-slate-800">
                                {dosens.length === 0 ? (
                                    <p className="p-3 text-sm text-slate-500 dark:text-slate-400">Belum ada dosen aktif.</p>
                                ) : (
                                    dosens.map((dosen) => (
                                        <label
                                            key={dosen.id}
                                            className="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={form.data.dosen_ids.includes(dosen.id)}
                                                onChange={() => toggle('dosen_ids', dosen.id)}
                                                className="h-4 w-4 rounded border-slate-300 bg-white text-brand-600 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-950"
                                            />
                                            <span className="text-sm text-slate-900 dark:text-white">{dosen.name}</span>
                                        </label>
                                    ))
                                )}
                            </div>
                        </div>
                        <div>
                            <Label>Pengawas</Label>
                            <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
                                Pengawas dapat memantau dan menghentikan sesi pada ujian yang ditugaskan.
                            </p>
                            <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100 dark:border-slate-700 dark:divide-slate-800">
                                {pengawas.length === 0 ? (
                                    <p className="p-3 text-sm text-slate-500 dark:text-slate-400">Belum ada pengawas aktif.</p>
                                ) : (
                                    pengawas.map((staff) => (
                                        <label
                                            key={staff.id}
                                            className="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={form.data.pengawas_ids.includes(staff.id)}
                                                onChange={() => toggle('pengawas_ids', staff.id)}
                                                className="h-4 w-4 rounded border-slate-300 bg-white text-brand-600 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-950"
                                            />
                                            <span className="text-sm text-slate-900 dark:text-white">{staff.name}</span>
                                        </label>
                                    ))
                                )}
                            </div>
                        </div>
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
