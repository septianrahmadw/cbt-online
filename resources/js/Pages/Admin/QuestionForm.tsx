import { Link, router, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    Check,
    Eye,
    Image as ImageIcon,
    Plus,
    Save,
    Trash2,
    X,
} from 'lucide-react';
import { useState } from 'react';
import { MathText } from '../../components/MathText';
import { Alert, Button, Card, Input, Label, Select, Textarea } from '../../components/ui';
import { AdminLayout } from '../../layouts/AdminLayout';
import { cn } from '../../lib/utils';

interface OptionItem {
    id?: number | null;
    label: string;
    text: string;
    image?: string | null;
    file?: File | null;
    removeImage?: boolean;
    preview?: string | null;
    correct: boolean;
}

interface QuestionData {
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
    options: {
        id?: number;
        label: string;
        text: string;
        image: string | null;
        correct: boolean;
    }[];
}

interface ExamOption {
    id: number;
    title: string;
    subject_name: string;
}

interface ModuleOption {
    id: number;
    name: string;
    code: string;
    color: string;
    is_active: boolean;
}

const DEFAULT_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'] as const;

export default function QuestionForm({
    exams,
    question,
    selectedExamId,
    modules,
    selectedModuleId,
    nextQuestionNumber,
}: {
    exams: ExamOption[];
    question: QuestionData | null;
    selectedExamId: number | null;
    modules: ModuleOption[];
    selectedModuleId: number | null;
    nextQuestionNumber: number;
}) {
    const initialOptions: OptionItem[] = question?.options?.length
        ? question.options.map((opt, idx) => ({
              id: opt.id,
              label: DEFAULT_LABELS[idx] || opt.label,
              text: opt.text || '',
              image: opt.image,
              file: null,
              removeImage: false,
              preview: null,
              correct: !!opt.correct,
          }))
        : [
              { label: 'A', text: '', correct: true },
              { label: 'B', text: '', correct: false },
              { label: 'C', text: '', correct: false },
              { label: 'D', text: '', correct: false },
          ];

    const [options, setOptions] = useState<OptionItem[]>(initialOptions);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [removeQuestionImage, setRemoveQuestionImage] = useState(false);
    const [previewLatex, setPreviewLatex] = useState(false);

    const form = useForm({
        exam_id: question?.exam_id ?? selectedExamId ?? exams[0]?.id ?? '',
        module_id: question?.module_id ?? selectedModuleId ?? '',
        question_number: question?.question_number ?? nextQuestionNumber ?? 1,
        type: question?.type ?? 'single',
        difficulty: question?.difficulty ?? '',
        passage: question?.passage ?? '',
        question_text: question?.question_text ?? '',
        score_weight: question?.score_weight ?? 1,
        image: null as File | null,
        image_remove: false,
        explanation: question?.explanation ?? '',
        is_active: question?.is_active ?? true,
    });

    const setCorrect = (index: number) => {
        if (form.data.type === 'single') {
            setOptions((prev) =>
                prev.map((opt, i) => ({ ...opt, correct: i === index }))
            );
        } else {
            setOptions((prev) =>
                prev.map((opt, i) =>
                    i === index ? { ...opt, correct: !opt.correct } : opt
                )
            );
        }
    };

    const handleTypeChange = (newType: 'single' | 'multiple') => {
        form.setData('type', newType);
        if (newType === 'single') {
            // Ensure only 1 option is marked correct
            const firstCorrectIdx = options.findIndex((o) => o.correct);
            const activeIdx = firstCorrectIdx >= 0 ? firstCorrectIdx : 0;
            setOptions((prev) =>
                prev.map((opt, i) => ({ ...opt, correct: i === activeIdx }))
            );
        }
    };

    const addOption = () => {
        if (options.length >= 6) return;
        const nextLabel = DEFAULT_LABELS[options.length] || `Opsi ${options.length + 1}`;
        setOptions((prev) => [
            ...prev,
            { label: nextLabel, text: '', correct: false, file: null, preview: null },
        ]);
    };

    const removeOption = (index: number) => {
        if (options.length <= 2) return;
        const next = options.filter((_, i) => i !== index).map((opt, i) => ({
            ...opt,
            label: DEFAULT_LABELS[i] || opt.label,
        }));

        if (form.data.type === 'single' && !next.some((o) => o.correct)) {
            next[0].correct = true;
        }
        setOptions(next);
    };

    const updateOptionText = (index: number, text: string) => {
        setOptions((prev) =>
            prev.map((opt, i) => (i === index ? { ...opt, text } : opt))
        );
    };

    const updateOptionImage = (index: number, file: File | null) => {
        setOptions((prev) =>
            prev.map((opt, i) =>
                i === index
                    ? {
                          ...opt,
                          file,
                          preview: file ? URL.createObjectURL(file) : null,
                          removeImage: false,
                      }
                    : opt
            )
        );
    };

    const toggleRemoveOptionImage = (index: number) => {
        setOptions((prev) =>
            prev.map((opt, i) =>
                i === index
                    ? {
                          ...opt,
                          removeImage: !opt.removeImage,
                          file: null,
                          preview: null,
                      }
                    : opt
            )
        );
    };

    const submit = (event: React.FormEvent) => {
        event.preventDefault();

        // Check correct answer requirement
        if (!options.some((o) => o.correct)) {
            alert('Pilih setidaknya 1 jawaban yang benar sebagai kunci.');
            return;
        }

        const formData = new FormData();
        formData.append('exam_id', String(form.data.exam_id));
        formData.append('module_id', form.data.module_id ? String(form.data.module_id) : '');
        formData.append('question_number', String(form.data.question_number));
        formData.append('type', form.data.type);
        formData.append('difficulty', form.data.difficulty || '');
        formData.append('passage', form.data.passage || '');
        formData.append('question_text', form.data.question_text || '');
        formData.append('score_weight', String(form.data.score_weight));
        formData.append('explanation', form.data.explanation || '');
        formData.append('is_active', form.data.is_active ? '1' : '0');

        if (form.data.image) {
            formData.append('image', form.data.image);
        }
        if (removeQuestionImage) {
            formData.append('image_remove', '1');
        }

        // Append options
        options.forEach((opt, idx) => {
            formData.append(`options[${idx}][label]`, opt.label);
            formData.append(`options[${idx}][text]`, opt.text || '');
            formData.append(`options[${idx}][is_correct]`, opt.correct ? '1' : '0');
            formData.append(`options[${idx}][correct]`, opt.correct ? '1' : '0');

            if (opt.id) {
                formData.append(`options[${idx}][id]`, String(opt.id));
            }
            if (opt.image) {
                formData.append(`options[${idx}][existing_image]`, opt.image);
            }
            if (opt.removeImage) {
                formData.append(`options[${idx}][remove_image]`, '1');
            }
            if (opt.file) {
                formData.append(`options[${idx}][image]`, opt.file);
            }
        });

        // Set single correct label helper
        if (form.data.type === 'single') {
            const correctOpt = options.find((o) => o.correct);
            if (correctOpt) {
                formData.append('correct', correctOpt.label);
            }
        }

        const url = question ? `/admin/questions/${question.id}` : '/admin/questions';

        router.post(url, formData, {
            forceFormData: true,
            preserveScroll: true,
        });
    };

    const backUrl = `/admin/questions?exam_id=${question?.exam_id ?? selectedExamId ?? ''}`;
    const selectedExamObj = exams.find((e) => e.id === Number(form.data.exam_id));

    return (
        <AdminLayout
            title={question ? `Edit Soal #${question.question_number}` : 'Tambah Soal'}
            subtitle={selectedExamObj ? `${selectedExamObj.title} · ${selectedExamObj.subject_name}` : 'Formulir bank soal'}
            actions={
                <Link
                    href={backUrl}
                    className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 sm:text-sm"
                >
                    <ArrowLeft size={16} /> Kembali ke bank soal
                </Link>
            }
        >
            <form onSubmit={submit} className="mx-auto max-w-4xl space-y-5">
                {Object.keys(form.errors).length > 0 && (
                    <Alert tone="error">
                        <ul className="list-inside list-disc space-y-1">
                            {Object.entries(form.errors).map(([key, msg]) => (
                                <li key={key}>{msg}</li>
                            ))}
                        </ul>
                    </Alert>
                )}

                <Card className="space-y-5 p-6">
                    {/* Top Metadata Grid */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                            <Label htmlFor="exam_id">
                                Ujian <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                id="exam_id"
                                value={form.data.exam_id}
                                onChange={(e) => form.setData('exam_id', Number(e.target.value))}
                                required
                            >
                                {exams.map((exam) => (
                                    <option key={exam.id} value={exam.id}>
                                        {exam.title}
                                    </option>
                                ))}
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="module_id">
                                Modul Soal <span className="text-slate-400 font-normal">(opsional)</span>
                            </Label>
                            <Select
                                id="module_id"
                                value={form.data.module_id}
                                onChange={(e) => form.setData('module_id', e.target.value ? Number(e.target.value) : '')}
                            >
                                <option value="">- Tanpa Modul / Umum -</option>
                                {modules.map((m) => (
                                    <option key={m.id} value={m.id}>
                                        {m.name} ({m.code})
                                    </option>
                                ))}
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="type">
                                Jenis Soal <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                id="type"
                                value={form.data.type}
                                onChange={(e) => handleTypeChange(e.target.value as 'single' | 'multiple')}
                            >
                                <option value="single">Pilihan Ganda (1 jawaban benar)</option>
                                <option value="multiple">PG Kompleks (lebih dari 1 benar)</option>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="difficulty">Tingkat Kesukaran</Label>
                            <Select
                                id="difficulty"
                                value={form.data.difficulty}
                                onChange={(e) => form.setData('difficulty', e.target.value as any)}
                            >
                                <option value="">- Pilih -</option>
                                <option value="mudah">Mudah</option>
                                <option value="sedang">Sedang</option>
                                <option value="sulit">Sulit</option>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="question_number">
                                Urutan Ke- <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="question_number"
                                type="number"
                                min={1}
                                value={form.data.question_number}
                                onChange={(e) => form.setData('question_number', Number(e.target.value))}
                                required
                            />
                        </div>

                        <div>
                            <Label htmlFor="score_weight">
                                Bobot Nilai <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="score_weight"
                                type="number"
                                step="0.1"
                                min={0.1}
                                max={100}
                                value={form.data.score_weight}
                                onChange={(e) => form.setData('score_weight', Number(e.target.value))}
                                required
                            />
                        </div>
                    </div>

                    {/* Lembar Bacaan / Passage */}
                    <div>
                        <Label htmlFor="passage">
                            Lembar Bacaan / Petikan <span className="font-normal text-slate-400">(opsional — tampil di atas soal)</span>
                        </Label>
                        <Textarea
                            id="passage"
                            rows={3}
                            value={form.data.passage}
                            onChange={(e) => form.setData('passage', e.target.value)}
                            placeholder="Tempel teks bacaan/petikan di sini jika soal mengacu pada teks panjang..."
                            className="text-xs sm:text-sm"
                        />
                    </div>

                    {/* Teks Soal */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <Label htmlFor="question_text" className="mb-0">
                                Teks Soal <span className="font-normal text-slate-400">(wajib diisi kecuali soal hanya berupa gambar)</span>
                            </Label>
                            <button
                                type="button"
                                onClick={() => setPreviewLatex(!previewLatex)}
                                className="inline-flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400"
                            >
                                <Eye size={13} /> {previewLatex ? 'Tutup Preview' : 'Preview Rumus LaTeX'}
                            </button>
                        </div>
                        <Textarea
                            id="question_text"
                            rows={4}
                            value={form.data.question_text}
                            onChange={(e) => form.setData('question_text', e.target.value)}
                            placeholder="Tulis pertanyaan di sini... Gunakan $...$ untuk LaTeX (mis. $x^2 + y^2 = r^2$)"
                        />
                        {previewLatex && form.data.question_text && (
                            <div className="mt-2.5 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white">
                                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Preview Tampilan</p>
                                <MathText text={form.data.question_text} />
                            </div>
                        )}
                    </div>

                    {/* Gambar Soal */}
                    <div>
                        <Label htmlFor="question-image">
                            Gambar Soal <span className="font-normal text-slate-400">(opsional — JPG/PNG/WEBP, maks 4 MB)</span>
                        </Label>
                        <div className="flex flex-wrap items-center gap-4">
                            {question?.image_url && !removeQuestionImage && (
                                <div className="relative">
                                    <img
                                        src={question.image_url}
                                        alt="Gambar soal saat ini"
                                        className="h-24 w-32 rounded-lg border object-cover"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setRemoveQuestionImage(true)}
                                        className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-white shadow hover:bg-rose-700"
                                        title="Hapus gambar saat ini"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            )}

                            {imagePreview && (
                                <div className="relative">
                                    <img
                                        src={imagePreview}
                                        alt="Preview gambar baru"
                                        className="h-24 w-32 rounded-lg border object-cover"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setImagePreview(null);
                                            form.setData('image', null);
                                        }}
                                        className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-slate-600 text-white shadow hover:bg-slate-700"
                                        title="Batal unggah"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            )}

                            <input
                                id="question-image"
                                type="file"
                                accept="image/jpeg,image/png,image/gif,image/webp"
                                onChange={(e) => {
                                    const file = e.target.files?.[0] || null;
                                    form.setData('image', file);
                                    setImagePreview(file ? URL.createObjectURL(file) : null);
                                    setRemoveQuestionImage(false);
                                }}
                                className="text-xs text-slate-600 file:mr-3 file:rounded-xl file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-brand-700 hover:file:bg-brand-100 dark:file:bg-brand-500/10 dark:file:text-brand-300"
                            />
                        </div>
                    </div>

                    {/* Pilihan Jawaban */}
                    <div className="border-t border-slate-200/80 pt-5 dark:border-slate-800">
                        <div className="mb-3 flex items-center justify-between">
                            <div>
                                <Label className="mb-0 text-base font-bold">
                                    Pilihan Jawaban <span className="text-red-500">*</span>
                                </Label>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {form.data.type === 'multiple'
                                        ? 'Centang semua jawaban yang benar (bisa lebih dari satu).'
                                        : 'Pilih satu radio kunci jawaban yang benar.'}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {options.map((opt, index) => (
                                <div
                                    key={opt.label}
                                    className={cn(
                                        'rounded-xl border p-3.5 transition',
                                        opt.correct
                                            ? 'border-emerald-300 bg-emerald-50/40 dark:border-emerald-500/40 dark:bg-emerald-500/10'
                                            : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <span
                                            className={cn(
                                                'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold',
                                                opt.correct
                                                    ? 'bg-emerald-600 text-white'
                                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                                            )}
                                        >
                                            {opt.label}
                                        </span>

                                        <input
                                            type="text"
                                            value={opt.text}
                                            onChange={(e) => updateOptionText(index, e.target.value)}
                                            placeholder="Teks pilihan jawaban... (opsional bila ada gambar)"
                                            className="flex-1 rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-sm focus:border-brand-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:focus:bg-slate-950"
                                        />

                                        {/* Kunci / Benar control */}
                                        <label
                                            onClick={() => setCorrect(index)}
                                            className={cn(
                                                'flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold select-none transition',
                                                opt.correct
                                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300'
                                                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                                            )}
                                        >
                                            <input
                                                type={form.data.type === 'multiple' ? 'checkbox' : 'radio'}
                                                checked={opt.correct}
                                                onChange={() => setCorrect(index)}
                                                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                            />
                                            <span>{form.data.type === 'multiple' ? 'Benar' : 'Kunci'}</span>
                                        </label>

                                        {options.length > 2 && (
                                            <button
                                                type="button"
                                                onClick={() => removeOption(index)}
                                                className="shrink-0 p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
                                                title="Hapus pilihan"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>

                                    {/* Option image upload */}
                                    <div className="mt-2.5 flex flex-wrap items-center gap-3 pl-11">
                                        {opt.image && !opt.removeImage && (
                                            <div className="relative">
                                                <img
                                                    src={opt.image}
                                                    alt={`Gambar ${opt.label}`}
                                                    className="h-12 w-16 rounded border object-cover"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => toggleRemoveOptionImage(index)}
                                                    className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-white"
                                                    title="Hapus gambar opsi"
                                                >
                                                    <X size={10} />
                                                </button>
                                            </div>
                                        )}

                                        {opt.preview && (
                                            <div className="relative">
                                                <img
                                                    src={opt.preview}
                                                    alt="Preview opsi baru"
                                                    className="h-12 w-16 rounded border object-cover"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => updateOptionImage(index, null)}
                                                    className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-slate-600 text-white"
                                                    title="Batal gambar"
                                                >
                                                    <X size={10} />
                                                </button>
                                            </div>
                                        )}

                                        <input
                                            type="file"
                                            accept="image/jpeg,image/png,image/gif,image/webp"
                                            onChange={(e) => updateOptionImage(index, e.target.files?.[0] || null)}
                                            className="text-[11px] text-slate-500 file:mr-2 file:rounded-md file:border-0 file:bg-slate-100 file:px-2.5 file:py-1 file:text-[11px] file:font-medium file:text-slate-600 hover:file:bg-slate-200 dark:file:bg-slate-800 dark:file:text-slate-300"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {options.length < 6 && (
                            <button
                                type="button"
                                onClick={addOption}
                                className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
                            >
                                <Plus size={16} /> Tambah pilihan ({DEFAULT_LABELS[options.length]})
                            </button>
                        )}
                    </div>

                    {/* Pembahasan */}
                    <div className="border-t border-slate-200/80 pt-5 dark:border-slate-800">
                        <Label htmlFor="explanation">
                            Pembahasan <span className="font-normal text-slate-400">(opsional — penjelasan kenapa jawaban benar)</span>
                        </Label>
                        <Textarea
                            id="explanation"
                            rows={3}
                            value={form.data.explanation}
                            onChange={(e) => form.setData('explanation', e.target.value)}
                            placeholder="Penjelasan kenapa jawaban tersebut benar..."
                        />
                    </div>

                    {/* Soal aktif */}
                    <div className="pt-2">
                        <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-700 select-none dark:text-slate-300">
                            <input
                                type="checkbox"
                                checked={form.data.is_active}
                                onChange={(e) => form.setData('is_active', e.target.checked)}
                                className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-900"
                            />
                            <span>Soal aktif (ikut diujikan kepada peserta)</span>
                        </label>
                    </div>

                    {/* Form actions */}
                    <div className="flex justify-end gap-2.5 border-t border-slate-200/80 pt-5 dark:border-slate-800">
                        <Link href={backUrl} className="btn-secondary">
                            Batal
                        </Link>
                        <Button type="submit" disabled={form.processing}>
                            <Save size={16} /> {form.processing ? 'Menyimpan...' : 'Simpan Soal'}
                        </Button>
                    </div>
                </Card>
            </form>
        </AdminLayout>
    );
}
