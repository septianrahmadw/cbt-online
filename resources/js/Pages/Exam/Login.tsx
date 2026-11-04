import { Link, useForm, usePage } from '@inertiajs/react';
import { AlertCircle, BookOpen, Hash, Loader2, LogIn, User } from 'lucide-react';
import { Alert, Button, Input, Label, Select } from '../../components/ui';
import { ExamLayout } from '../../layouts/ExamLayout';
import type { SharedProps } from '../../types/shared';

interface ExamOption {
    id: number;
    title: string;
    subject_name: string;
    duration_minutes: number;
    total_questions: number;
    questions_count: number;
}

export default function ExamLogin({ exams }: { exams: ExamOption[] }) {
    const { institution } = usePage<SharedProps>().props;
    const { data, setData, post, processing, errors } = useForm({
        exam_id: exams[0]?.id ?? '',
        exam_number: '',
        full_name: '',
    });

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        post('/exam/login');
    };

    const selectedExam = exams.find((exam) => exam.id === data.exam_id);

    return (
        <ExamLayout>
            <div className="w-full">
                <div className="mb-6 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-md shadow-brand-200 dark:shadow-none">
                        <BookOpen size={24} />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Masuk Ujian</h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {institution?.exam_event_name ?? 'Ujian Berbasis Komputer'}
                    </p>
                </div>

                <form onSubmit={submit} className="card space-y-4 p-6 shadow-xl sm:p-8">
                    {errors.exam_number && (
                        <Alert tone="error">
                            <span className="flex items-center gap-2">
                                <AlertCircle size={16} /> {errors.exam_number}
                            </span>
                        </Alert>
                    )}
                    {errors.full_name && <Alert tone="error">{errors.full_name}</Alert>}
                    {errors.exam_id && <Alert tone="error">{errors.exam_id}</Alert>}

                    <div>
                        <Label htmlFor="exam_id">Pilih Ujian</Label>
                        <Select
                            id="exam_id"
                            value={data.exam_id}
                            onChange={(event) => setData('exam_id', Number(event.target.value))}
                        >
                            {exams.length === 0 && <option value="">Belum ada ujian aktif</option>}
                            {exams.map((exam) => (
                                <option key={exam.id} value={exam.id}>
                                    {exam.title} — {exam.subject_name} ({exam.questions_count} soal,{' '}
                                    {exam.duration_minutes} menit)
                                </option>
                            ))}
                        </Select>
                        {selectedExam && (
                            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                {selectedExam.questions_count} soal &middot; {selectedExam.duration_minutes} menit
                            </p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="exam_number">Nomor Peserta</Label>
                        <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                                <Hash className="h-5 w-5" />
                            </span>
                            <Input
                                id="exam_number"
                                value={data.exam_number}
                                onChange={(event) => setData('exam_number', event.target.value)}
                                placeholder="Contoh: 2026001"
                                autoComplete="off"
                                className="pl-11"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="full_name">Nama Lengkap</Label>
                        <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                                <User className="h-5 w-5" />
                            </span>
                            <Input
                                id="full_name"
                                value={data.full_name}
                                onChange={(event) => setData('full_name', event.target.value)}
                                placeholder="Sesuai data sekolah"
                                autoComplete="off"
                                className="pl-11"
                                required
                            />
                        </div>
                    </div>

                    <Button type="submit" className="w-full py-3" disabled={processing || exams.length === 0}>
                        {processing ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
                        {processing ? 'Memeriksa data...' : 'Mulai Ujian'}
                    </Button>

                    <p className="text-center text-xs text-slate-500 dark:text-slate-400">
                        <Link
                            href="/admin/login"
                            className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-300 dark:hover:text-brand-200"
                        >
                            Login admin / proktor
                        </Link>
                    </p>
                </form>

                <p className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">
                    Pastikan data nomor peserta dan nama sesuai. Hubungi proktor jika mengalami kendala.
                </p>
            </div>
        </ExamLayout>
    );
}
