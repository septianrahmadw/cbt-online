import { Link, router } from '@inertiajs/react';
import { ArrowLeft, BookOpen, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { AdminLayout } from '../../../layouts/AdminLayout';
import { MathText } from '../../../components/MathText';
import { Badge, Card, EmptyState } from '../../../components/ui';
import { moduleColorLabel, moduleGradient, moduleTone } from '../../../lib/moduleColors';

interface ShowModule {
    id: number;
    name: string;
    code: string;
    color: string;
    sort_order: number;
    is_active: boolean;
    description: string | null;
    questions_count: number;
    exams_count: number;
    easy_count?: number;
    medium_count?: number;
    hard_count?: number;
    single_count?: number;
    multiple_count?: number;
}

interface ExamUsage {
    id: number;
    title: string;
    subject_name: string;
    module_questions_count: number;
}

interface ModuleQuestion {
    id: number;
    question_number: number;
    type?: string;
    difficulty?: string | null;
    passage?: string | null;
    question_text: string;
    options_count: number;
    exam: { id: number; title: string } | null;
}

export default function ModuleShow({
    module,
    exams,
    questions,
}: {
    module: ShowModule;
    exams: ExamUsage[];
    questions: ModuleQuestion[];
}) {
    const remove = () => {
        if (
            window.confirm(
                `Hapus modul ${module.name}? Soal terkait tidak ikut dihapus, hanya tautannya yang dilepas.`
            )
        ) {
            router.delete(`/admin/modules/${module.id}`);
        }
    };

    const excerpt = (text: string) =>
        text.length > 180 ? `${text.slice(0, 180).trimEnd()}…` : text;

    return (
        <AdminLayout
            title={module.name}
            subtitle={`${module.code} · ${module.questions_count} soal`}
            actions={
                <>
                    <Link href={`/admin/questions?module_id=${module.id}`} className="btn-secondary text-xs sm:text-sm">
                        Buka di Bank Soal
                    </Link>
                    <Link href={`/admin/modules/${module.id}/edit`} className="btn-primary text-xs sm:text-sm">
                        Edit Modul
                    </Link>
                </>
            }
        >
            <div className="mb-6">
                <Link
                    href="/admin/modules"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-300 dark:hover:text-brand-200"
                >
                    <ArrowLeft size={15} /> Kembali ke Modul Soal
                </Link>
            </div>

            <div className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
                {/* Ringkasan Soal */}
                <Card className="flex flex-col justify-between">
                    <div>
                        <p className="mb-2 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Ringkasan Soal
                        </p>
                        <div className="flex items-center gap-3">
                            <div
                                className="flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-md shadow-brand-900/20"
                                style={{ background: moduleGradient(module.color) }}
                            >
                                <BookOpen size={22} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                    {module.questions_count}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Total soal</p>
                            </div>
                        </div>

                        {/* 3 difficulty breakdown boxes */}
                        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                            <div className="rounded-lg bg-emerald-50 p-2 dark:bg-emerald-500/10">
                                <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                                    {module.easy_count ?? 0}
                                </p>
                                <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">Mudah</p>
                            </div>
                            <div className="rounded-lg bg-amber-50 p-2 dark:bg-amber-500/10">
                                <p className="text-sm font-bold text-amber-700 dark:text-amber-300">
                                    {module.medium_count ?? 0}
                                </p>
                                <p className="text-[11px] font-medium text-amber-600 dark:text-amber-400">Sedang</p>
                            </div>
                            <div className="rounded-lg bg-rose-50 p-2 dark:bg-rose-500/10">
                                <p className="text-sm font-bold text-rose-700 dark:text-rose-300">
                                    {module.hard_count ?? 0}
                                </p>
                                <p className="text-[11px] font-medium text-rose-600 dark:text-rose-400">Sulit</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-600 dark:border-slate-800 dark:text-slate-400">
                        <span>Pilihan Ganda ({module.single_count ?? 0})</span>
                        <span>PG Kompleks ({module.multiple_count ?? 0})</span>
                    </div>
                </Card>

                {/* Informasi Modul */}
                <Card className="lg:col-span-2">
                    <p className="mb-2 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Informasi Modul
                    </p>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Kode</p>
                            <p className="font-mono text-sm font-semibold text-slate-900 dark:text-white">
                                {module.code}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Warna</p>
                            <Badge tone={moduleTone(module.color)}>{moduleColorLabel(module.color)}</Badge>
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Status</p>
                            <Badge tone={module.is_active ? 'green' : 'slate'}>
                                {module.is_active ? 'Aktif' : 'Nonaktif'}
                            </Badge>
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Urutan</p>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                {module.sort_order}
                            </p>
                        </div>
                    </div>
                    <div className="mt-4">
                        <p className="mb-1 text-sm text-slate-500 dark:text-slate-400">Deskripsi</p>
                        <p className="text-sm text-slate-700 dark:text-slate-300">
                            {module.description || 'Belum ada deskripsi.'}
                        </p>
                    </div>
                </Card>
            </div>

            <div className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
                <Card className="overflow-hidden p-0">
                    <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                            Ujian Pengguna Modul
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Ujian yang memiliki soal dari modul ini
                        </p>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {exams.length === 0 ? (
                            <div className="px-5 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                                Belum ada ujian yang menggunakan modul ini.
                            </div>
                        ) : (
                            exams.map((exam) => (
                                <div key={exam.id} className="flex items-center justify-between gap-4 px-5 py-3">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                                            {exam.title}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            {exam.subject_name} · {exam.module_questions_count} soal dari modul ini
                                        </p>
                                    </div>
                                    <Link
                                        href={`/admin/questions?exam_id=${exam.id}&module_id=${module.id}`}
                                        className="shrink-0 text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-300"
                                    >
                                        Lihat Soal
                                    </Link>
                                </div>
                            ))
                        )}
                    </div>
                </Card>

                <Card>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Aksi Cepat</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Kelola modul dan soal-soal di dalamnya.
                    </p>
                    <div className="mt-4 space-y-2">
                        <Link
                            href={`/admin/questions/create?module_id=${module.id}`}
                            className="btn-secondary flex w-full items-center justify-start gap-2 text-xs sm:text-sm"
                        >
                            <Plus size={16} /> Tambah Soal ke Modul Ini
                        </Link>
                        <Link
                            href={`/admin/questions?module_id=${module.id}`}
                            className="btn-secondary flex w-full items-center justify-start gap-2 text-xs sm:text-sm"
                        >
                            <BookOpen size={16} /> Lihat Semua Soal di Bank Soal
                        </Link>
                        <button
                            type="button"
                            onClick={remove}
                            className="btn-ghost flex w-full items-center justify-start gap-2 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-500/10 dark:hover:text-rose-300 sm:text-sm"
                        >
                            <Trash2 size={16} /> Hapus Modul
                        </button>
                    </div>
                    <p className="mt-4 flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <ShieldCheck size={14} className="mt-0.5 shrink-0" />
                        Menghapus modul hanya melepas tautan pada soal; soal itu sendiri tetap tersimpan di Bank
                        Soal.
                    </p>
                </Card>
            </div>

            <Card className="overflow-hidden p-0">
                <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Daftar Soal</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Semua soal dalam modul {module.name}
                    </p>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {questions.length === 0 ? (
                        <div className="p-8">
                            <EmptyState>Belum ada soal di modul ini.</EmptyState>
                        </div>
                    ) : (
                        questions.map((question) => (
                            <div key={question.id} className="flex items-start justify-between gap-4 px-5 py-4">
                                <div className="min-w-0 flex-1">
                                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-brand-100 text-xs font-bold text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
                                            {question.question_number}
                                        </span>
                                        <Badge tone="blue">
                                            {question.type === 'multiple' ? 'PG Kompleks' : 'Pilihan Ganda'}
                                        </Badge>
                                        {question.difficulty && (
                                            <Badge
                                                tone={
                                                    question.difficulty === 'mudah'
                                                        ? 'green'
                                                        : question.difficulty === 'sedang'
                                                        ? 'yellow'
                                                        : 'red'
                                                }
                                            >
                                                {question.difficulty}
                                            </Badge>
                                        )}
                                        {question.exam && (
                                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                                {question.exam.title}
                                            </span>
                                        )}
                                    </div>
                                    {question.passage && (
                                        <div className="mb-2 line-clamp-2 rounded border border-slate-100 bg-slate-50/70 p-2 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
                                            <span className="font-semibold text-slate-500 uppercase tracking-wide text-[9px] block">Lembar Bacaan</span>
                                            {excerpt(question.passage)}
                                        </div>
                                    )}
                                    <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                        <MathText text={excerpt(question.question_text)} />
                                    </div>
                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                        {question.options_count} opsi
                                    </p>
                                </div>
                                <Link
                                    href={`/admin/questions/${question.id}/edit`}
                                    className="shrink-0 text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-300"
                                >
                                    Edit Soal
                                </Link>
                            </div>
                        ))
                    )}
                </div>
            </Card>
        </AdminLayout>
    );
}
