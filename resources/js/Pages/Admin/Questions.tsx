import { Link, router, useForm } from '@inertiajs/react';
import {
    ArrowUpDown,
    CheckCircle2,
    Download,
    FileSpreadsheet,
    Filter,
    Pencil,
    Plus,
    RotateCcw,
    Send,
    ShieldCheck,
    Trash2,
    Upload,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { AdminLayout } from '../../layouts/AdminLayout';
import { MathText } from '../../components/MathText';
import { Badge, Button, Card, EmptyState, Label, Modal, Select } from '../../components/ui';
import { moduleColorLabel, moduleTone } from '../../lib/moduleColors';
import { cn } from '../../lib/utils';

interface Option {
    id: number;
    label: string;
    option_text: string | null;
    image_url: string | null;
    is_correct: boolean;
}

interface Question {
    id: number;
    exam_id: number;
    module_id: number | null;
    question_number: number;
    passage: string | null;
    type: 'single' | 'multiple';
    difficulty: 'mudah' | 'sedang' | 'sulit' | null;
    question_text: string;
    image_url: string | null;
    explanation: string | null;
    is_active: boolean;
    score_weight: number;
    review_status: 'draft' | 'pending' | 'approved' | 'rejected';
    review_status_label: string;
    review_note: string | null;
    can_edit: boolean;
    can_submit_review: boolean;
    can_review: boolean;
    module: {
        id: number;
        name: string;
        code: string;
        color: string;
    } | null;
    options: Option[];
}

interface ExamOption {
    id: number;
    title: string;
    subject_name: string;
    total_questions?: number;
}

interface ModuleOption {
    id: number;
    name: string;
    code: string;
    color: string;
    is_active: boolean;
}

export default function Questions({
    exams,
    selectedExam,
    selectedExamId,
    questions,
    modules,
    selectedModuleId,
}: {
    exams: ExamOption[];
    selectedExam?: ExamOption | null;
    selectedExamId: number | null;
    questions: Question[];
    modules: ModuleOption[];
    selectedModuleId: string | number;
}) {
    const [importOpen, setImportOpen] = useState(false);
    const [reviewing, setReviewing] = useState<Question | null>(null);

    const reviewForm = useForm({
        decision: 'approve' as 'approve' | 'reject',
        review_note: '',
    });

    const importForm = useForm({
        exam_id: selectedExamId ?? '',
        module_id: selectedModuleId && selectedModuleId !== 'none' ? String(selectedModuleId) : '',
        file: null as File | null,
    });

    const changeExam = (examId: string) => {
        router.get(
            '/admin/questions',
            { exam_id: examId, module_id: selectedModuleId || undefined },
            { preserveState: true, replace: true }
        );
    };

    const changeModule = (moduleId: string) => {
        router.get(
            '/admin/questions',
            { exam_id: selectedExamId || undefined, module_id: moduleId || undefined },
            { preserveState: true, replace: true }
        );
    };

    const resetFilter = () => {
        router.get(
            '/admin/questions',
            { exam_id: selectedExamId || undefined },
            { preserveState: true, replace: true }
        );
    };

    const remove = (question: Question) => {
        if (window.confirm(`Hapus soal nomor ${question.question_number}?`)) {
            router.delete(`/admin/questions/${question.id}`, { preserveScroll: true });
        }
    };

    const submitForReview = (question: Question) => {
        router.post(`/admin/questions/${question.id}/submit-review`, {}, { preserveScroll: true });
    };

    const openReview = (question: Question) => {
        setReviewing(question);
        reviewForm.setData({ decision: 'approve', review_note: '' });
        reviewForm.clearErrors();
    };

    const submitReview = (event: React.FormEvent) => {
        event.preventDefault();

        if (!reviewing) {
            return;
        }

        reviewForm.post(`/admin/questions/${reviewing.id}/review`, {
            preserveScroll: true,
            onSuccess: () => setReviewing(null),
        });
    };

    const reviewTone = (status: Question['review_status']) => {
        if (status === 'approved') return 'green';
        if (status === 'pending') return 'yellow';
        if (status === 'rejected') return 'red';
        return 'slate';
    };

    const submitImport = (event: React.FormEvent) => {
        event.preventDefault();
        if (!importForm.data.file) {
            alert('Silakan pilih file Excel (.xlsx) atau CSV.');
            return;
        }

        importForm.setData('exam_id', selectedExamId ?? '');
        importForm.post('/admin/questions/import', {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setImportOpen(false);
                importForm.reset('file');
            },
        });
    };

    const currentExam = selectedExam || exams.find((e) => e.id === selectedExamId);

    const difficultyBadgeTone = (diff: string | null) => {
        if (diff === 'mudah') return 'green';
        if (diff === 'sedang') return 'yellow';
        if (diff === 'sulit') return 'red';
        return 'slate';
    };

    const difficultyLabel = (diff: string | null) => {
        if (diff === 'mudah') return 'Mudah';
        if (diff === 'sedang') return 'Sedang';
        if (diff === 'sulit') return 'Sulit';
        return diff;
    };

    return (
        <AdminLayout
            title="Bank Soal"
            subtitle={
                currentExam
                    ? `${currentExam.title} · ${currentExam.subject_name} · ${questions.length} soal`
                    : 'Kelola soal-soal ujian'
            }
            actions={
                selectedExamId ? (
                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            variant="secondary"
                            onClick={() => {
                                importForm.setData('exam_id', selectedExamId);
                                setImportOpen(true);
                            }}
                            className="h-10 text-xs sm:text-sm"
                        >
                            <Upload size={15} /> Import Soal
                        </Button>
                        <Link
                            href={`/admin/questions/create?exam_id=${selectedExamId}${
                                selectedModuleId && selectedModuleId !== 'none'
                                    ? `&module_id=${selectedModuleId}`
                                    : ''
                            }`}
                            className="btn-primary h-10 px-3 text-xs sm:text-sm"
                        >
                            <Plus size={16} /> Tambah Soal
                        </Link>
                    </div>
                ) : null
            }
        >
            {/* Filter bar */}
            <Card className="mb-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-end">
                        <div className="w-full sm:max-w-xs">
                            <Label htmlFor="filter-exam">Pilih Ujian</Label>
                            <Select
                                id="filter-exam"
                                value={selectedExamId ?? ''}
                                onChange={(event) => changeExam(event.target.value)}
                            >
                                {exams.map((exam) => (
                                    <option key={exam.id} value={exam.id}>
                                        {exam.title} — {exam.subject_name}
                                    </option>
                                ))}
                            </Select>
                        </div>

                        <div className="w-full sm:max-w-xs">
                            <Label htmlFor="filter-module">Filter Modul</Label>
                            <Select
                                id="filter-module"
                                value={String(selectedModuleId ?? '')}
                                onChange={(event) => changeModule(event.target.value)}
                            >
                                <option value="">Semua Modul</option>
                                <option value="none">Tanpa Modul</option>
                                {modules.map((m) => (
                                    <option key={m.id} value={m.id}>
                                        {m.name} ({m.code})
                                    </option>
                                ))}
                            </Select>
                        </div>

                        {selectedModuleId !== '' && (
                            <Button
                                variant="secondary"
                                onClick={resetFilter}
                                className="h-10 px-3 text-xs"
                                title="Reset Filter Modul"
                            >
                                <RotateCcw size={14} /> Reset
                            </Button>
                        )}
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Mendukung format LaTeX dengan <code className="text-slate-700 dark:text-slate-300">$...$</code> dan{' '}
                        <code className="text-slate-700 dark:text-slate-300">$$...$$</code>.
                    </p>
                </div>
            </Card>

            {/* Content states */}
            {exams.length === 0 ? (
                <Card>
                    <EmptyState>Belum ada ujian. Buat ujian terlebih dahulu di menu Daftar Ujian.</EmptyState>
                </Card>
            ) : questions.length === 0 ? (
                <Card>
                    <EmptyState>
                        <p className="mb-3">Belum ada soal untuk ujian / filter modul ini.</p>
                        {selectedExamId && (
                            <div className="flex justify-center gap-2">
                                <Button
                                    variant="secondary"
                                    onClick={() => setImportOpen(true)}
                                    size="sm"
                                >
                                    <Upload size={14} /> Import Soal
                                </Button>
                                <Link
                                    href={`/admin/questions/create?exam_id=${selectedExamId}`}
                                    className="btn-primary text-xs"
                                >
                                    <Plus size={14} /> Tambah Soal
                                </Link>
                            </div>
                        )}
                    </EmptyState>
                </Card>
            ) : (
                <div className="space-y-4">
                    {questions.map((question) => (
                        <Card key={question.id} className="transition-shadow hover:shadow-sm">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="flex flex-1 flex-wrap items-center gap-2">
                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-xs font-bold text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
                                        {question.question_number}
                                    </span>

                                    {question.module ? (
                                        <Badge tone={moduleTone(question.module.color)}>
                                            {question.module.name}
                                        </Badge>
                                    ) : (
                                        <Badge tone="slate">Tanpa Modul</Badge>
                                    )}

                                    <Badge tone="blue">
                                        {question.type === 'multiple' ? 'PG Kompleks' : 'Pilihan Ganda'}
                                    </Badge>

                                    {question.difficulty && (
                                        <Badge tone={difficultyBadgeTone(question.difficulty)}>
                                            {difficultyLabel(question.difficulty)}
                                        </Badge>
                                    )}

                                    <Badge tone={reviewTone(question.review_status)}>
                                        {question.review_status_label}
                                    </Badge>

                                    {!question.is_active && (
                                        <Badge tone="slate">Nonaktif</Badge>
                                    )}

                                    <span className="text-xs text-slate-500 dark:text-slate-400">
                                        Bobot {question.score_weight}
                                    </span>
                                </div>

                                <div className="flex flex-wrap items-center gap-1.5 self-end sm:self-start">
                                    {question.can_submit_review && (
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => submitForReview(question)}
                                        >
                                            <Send size={13} /> Kirim Review
                                        </Button>
                                    )}
                                    {question.can_review && question.review_status === 'pending' && (
                                        <Button variant="success" size="sm" onClick={() => openReview(question)}>
                                            <ShieldCheck size={13} /> Review
                                        </Button>
                                    )}
                                    {question.can_edit && (
                                        <Link
                                            href={`/admin/questions/${question.id}/edit`}
                                            className="btn-secondary h-8 px-2.5 text-xs"
                                        >
                                            <Pencil size={13} /> Edit
                                        </Link>
                                    )}
                                    {question.can_edit && (
                                        <button
                                            type="button"
                                            onClick={() => remove(question)}
                                            className="btn-ghost h-8 px-2 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-500/10 dark:hover:text-rose-300"
                                            aria-label="Hapus soal"
                                            title="Hapus soal"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Lembar Bacaan / Passage */}
                            {question.passage && (
                                <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300">
                                    <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                        Lembar Bacaan
                                    </p>
                                    <MathText text={question.passage} />
                                </div>
                            )}

                            {/* Question text */}
                            <div className="mt-3 text-sm font-medium text-slate-900 dark:text-white">
                                <MathText text={question.question_text} />
                            </div>

                            {/* Question image */}
                            {question.image_url && (
                                <div className="mt-3">
                                    <img
                                        src={question.image_url}
                                        alt={`Gambar soal ${question.question_number}`}
                                        className="max-h-64 rounded-lg border border-slate-200 object-contain dark:border-slate-800"
                                    />
                                </div>
                            )}

                            {/* Options list */}
                            <ul className="mt-4 space-y-1.5">
                                {question.options.map((option) => (
                                    <li
                                        key={option.id}
                                        className={cn(
                                            'flex items-start gap-2.5 rounded-lg border px-3 py-2 text-sm transition-colors',
                                            option.is_correct
                                                ? 'border-emerald-200 bg-emerald-50/70 font-semibold text-emerald-950 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200'
                                                : 'border-slate-200/80 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300'
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                'flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold',
                                                option.is_correct
                                                    ? 'bg-emerald-600 text-white dark:bg-emerald-500'
                                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                            )}
                                        >
                                            {option.label}
                                        </span>
                                        <div className="min-w-0 flex-1 pt-0.5">
                                            {option.option_text ? (
                                                <MathText text={option.option_text} />
                                            ) : null}
                                            {option.image_url && (
                                                <img
                                                    src={option.image_url}
                                                    alt={`Opsi ${option.label}`}
                                                    className="mt-2 max-h-32 rounded border border-slate-200 object-contain dark:border-slate-800"
                                                />
                                            )}
                                        </div>
                                        {option.is_correct && (
                                            <CheckCircle2
                                                size={17}
                                                className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                                            />
                                        )}
                                    </li>
                                ))}
                            </ul>

                            {question.review_status === 'rejected' && question.review_note && (
                                <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200">
                                    <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-wider">
                                        Catatan Review
                                    </span>
                                    {question.review_note}
                                </div>
                            )}

                            {/* Explanation / Pembahasan */}
                            {question.explanation && (
                                <div className="mt-3.5 rounded-lg border border-sky-100 bg-sky-50/70 p-3 text-xs text-sky-950 dark:border-sky-900/40 dark:bg-sky-950/30 dark:text-sky-200">
                                    <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-wider text-sky-700 dark:text-sky-300">
                                        Pembahasan
                                    </span>
                                    <MathText text={question.explanation} />
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            )}

            <Modal
                open={reviewing !== null}
                onClose={() => setReviewing(null)}
                title={`Review Soal #${reviewing?.question_number ?? ''}`}
                footer={
                    <>
                        <Button type="button" variant="secondary" onClick={() => setReviewing(null)}>
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            form="review-form"
                            variant={reviewForm.data.decision === 'approve' ? 'success' : 'danger'}
                            disabled={reviewForm.processing}
                        >
                            {reviewForm.processing
                                ? 'Menyimpan...'
                                : reviewForm.data.decision === 'approve'
                                  ? 'Setujui Soal'
                                  : 'Tolak Soal'}
                        </Button>
                    </>
                }
            >
                <form id="review-form" onSubmit={submitReview} className="space-y-4">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                        {reviewing?.question_text}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={() => reviewForm.setData('decision', 'approve')}
                            className={cn(
                                'flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition',
                                reviewForm.data.decision === 'approve'
                                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/50 dark:bg-emerald-500/10 dark:text-emerald-300'
                                    : 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300',
                            )}
                        >
                            <CheckCircle2 size={16} /> Setujui
                        </button>
                        <button
                            type="button"
                            onClick={() => reviewForm.setData('decision', 'reject')}
                            className={cn(
                                'flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition',
                                reviewForm.data.decision === 'reject'
                                    ? 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-500/50 dark:bg-rose-500/10 dark:text-rose-300'
                                    : 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300',
                            )}
                        >
                            <XCircle size={16} /> Tolak
                        </button>
                    </div>

                    <div>
                        <Label htmlFor="review-note">
                            Catatan Review
                            {reviewForm.data.decision === 'reject' && <span className="text-rose-500"> *</span>}
                        </Label>
                        <textarea
                            id="review-note"
                            value={reviewForm.data.review_note}
                            onChange={(event) => reviewForm.setData('review_note', event.target.value)}
                            rows={4}
                            className="input"
                            placeholder={
                                reviewForm.data.decision === 'reject'
                                    ? 'Jelaskan bagian soal yang perlu diperbaiki dosen.'
                                    : 'Catatan opsional untuk dosen.'
                            }
                        />
                        {reviewForm.errors.review_note && (
                            <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">
                                {reviewForm.errors.review_note}
                            </p>
                        )}
                    </div>
                </form>
            </Modal>

            {/* Import Soal Modal */}
            <Modal
                open={importOpen}
                onClose={() => setImportOpen(false)}
                title="Import Soal dari Excel/CSV"
            >
                <div className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                            Format kolom yang didukung:
                        </p>
                        <a
                            href="/admin/questions/template"
                            className="btn-secondary inline-flex h-8 items-center gap-1.5 px-3 text-xs"
                            download
                        >
                            <Download size={14} /> Unduh Template CSV
                        </a>
                    </div>

                    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                        <table className="w-full text-left text-[11px]">
                            <thead className="bg-slate-50 font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-300">
                                <tr>
                                    <th className="border-b px-2.5 py-1.5">question_text</th>
                                    <th className="border-b px-2.5 py-1.5">passage</th>
                                    <th className="border-b px-2.5 py-1.5">type</th>
                                    <th className="border-b px-2.5 py-1.5">option_a..e</th>
                                    <th className="border-b px-2.5 py-1.5">correct</th>
                                    <th className="border-b px-2.5 py-1.5">explanation</th>
                                    <th className="border-b px-2.5 py-1.5">difficulty</th>
                                    <th className="border-b px-2.5 py-1.5">module_code</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[10px]">
                                <tr>
                                    <td className="px-2.5 py-1.5">Berapa hasil dari 2 + 3?</td>
                                    <td className="px-2.5 py-1.5">(opsional)</td>
                                    <td className="px-2.5 py-1.5">single</td>
                                    <td className="px-2.5 py-1.5">4 / 5 / 6 / 7 / 8</td>
                                    <td className="px-2.5 py-1.5 text-emerald-600 font-bold">B</td>
                                    <td className="px-2.5 py-1.5">2+3=5</td>
                                    <td className="px-2.5 py-1.5">mudah</td>
                                    <td className="px-2.5 py-1.5">umum</td>
                                </tr>
                                <tr>
                                    <td className="px-2.5 py-1.5">Pilih bilangan prima</td>
                                    <td className="px-2.5 py-1.5"></td>
                                    <td className="px-2.5 py-1.5">multiple</td>
                                    <td className="px-2.5 py-1.5">2 / 3 / 4 / 6</td>
                                    <td className="px-2.5 py-1.5 text-emerald-600 font-bold">A,B</td>
                                    <td className="px-2.5 py-1.5">2 dan 3 prima</td>
                                    <td className="px-2.5 py-1.5">sedang</td>
                                    <td className="px-2.5 py-1.5">penalaran-matematika</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Kolom <code className="bg-slate-100 px-1 rounded dark:bg-slate-800">type</code> diisi{' '}
                        <code className="bg-slate-100 px-1 rounded dark:bg-slate-800">single</code> atau{' '}
                        <code className="bg-slate-100 px-1 rounded dark:bg-slate-800">multiple</code>. Kolom{' '}
                        <code className="bg-slate-100 px-1 rounded dark:bg-slate-800">correct</code> diisi huruf kunci, mis.{' '}
                        <code className="bg-slate-100 px-1 rounded dark:bg-slate-800">B</code> atau{' '}
                        <code className="bg-slate-100 px-1 rounded dark:bg-slate-800">A,C</code> untuk PG kompleks.
                    </p>

                    <form onSubmit={submitImport} className="space-y-3.5 pt-2">
                        <div>
                            <Label htmlFor="import-module">Modul Bawaan (jika kolom module_code kosong)</Label>
                            <Select
                                id="import-module"
                                value={importForm.data.module_id}
                                onChange={(e) => importForm.setData('module_id', e.target.value)}
                            >
                                <option value="">- Tanpa Modul / Ikuti Excel -</option>
                                {modules.map((m) => (
                                    <option key={m.id} value={m.id}>
                                        {m.name} ({m.code})
                                    </option>
                                ))}
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="import-file">Pilih File (.xlsx, .xls, .csv)</Label>
                            <input
                                id="import-file"
                                type="file"
                                accept=".xlsx,.xls,.csv"
                                required
                                onChange={(e) => importForm.setData('file', e.target.files?.[0] || null)}
                                className="input h-auto py-2 text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-brand-700 hover:file:bg-brand-100 dark:file:bg-brand-500/10 dark:file:text-brand-300"
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => setImportOpen(false)}
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={importForm.processing || !importForm.data.file}
                            >
                                {importForm.processing ? 'Mengimport...' : 'Import Sekarang'}
                            </Button>
                        </div>
                    </form>
                </div>
            </Modal>
        </AdminLayout>
    );
}
