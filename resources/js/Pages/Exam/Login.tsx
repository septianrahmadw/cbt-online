import { Link, useForm, usePage } from '@inertiajs/react';
import { AlertCircle, BookOpen, CheckCircle2, Hash, Loader2, LogIn, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Alert, Button, Input, Label } from '../../components/ui';
import { ExamLayout } from '../../layouts/ExamLayout';
import { csrfToken } from '../../lib/utils';
import type { SharedProps } from '../../types/shared';

type NumberStatus = 'idle' | 'checking' | 'registered' | 'not_registered' | 'error';

export default function ExamLogin() {
    const { institution } = usePage<SharedProps>().props;
    const { data, setData, post, processing, errors } = useForm({
        exam_number: '',
        full_name: '',
    });
    const [numberStatus, setNumberStatus] = useState<NumberStatus>('idle');

    useEffect(() => {
        const examNumber = data.exam_number.trim();

        if (examNumber.length < 3) {
            setNumberStatus('idle');
            return;
        }

        setNumberStatus('idle');
        const controller = new AbortController();
        const timer = window.setTimeout(async () => {
            setNumberStatus('checking');

            try {
                const response = await fetch('/exam/check-number', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        'X-CSRF-TOKEN': csrfToken(),
                    },
                    body: JSON.stringify({ exam_number: examNumber }),
                    signal: controller.signal,
                });

                if (!response.ok) {
                    setNumberStatus('error');
                    return;
                }

                const payload = (await response.json()) as { registered?: boolean };
                setNumberStatus(payload.registered ? 'registered' : 'not_registered');
            } catch (error) {
                if ((error as Error).name === 'AbortError') {
                    return;
                }

                setNumberStatus('error');
            }
        }, 400);

        return () => {
            window.clearTimeout(timer);
            controller.abort();
        };
    }, [data.exam_number]);

    const canSubmit = numberStatus === 'registered' && data.full_name.trim() !== '' && !processing;

    const submit = (event: React.FormEvent) => {
        event.preventDefault();

        if (!canSubmit) {
            return;
        }

        post('/exam/login');
    };

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

                        <div className="mt-2 min-h-5">
                            {numberStatus === 'checking' && (
                                <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                                    <Loader2 size={13} className="animate-spin" /> Memeriksa nomor peserta...
                                </p>
                            )}
                            {numberStatus === 'registered' && (
                                <Alert tone="success">
                                    <span className="flex items-center gap-2">
                                        <CheckCircle2 size={16} /> Anda Terdaftar Ujian
                                    </span>
                                </Alert>
                            )}
                            {numberStatus === 'not_registered' && (
                                <Alert tone="error">
                                    <span className="flex items-center gap-2">
                                        <AlertCircle size={16} /> Anda Tidak Terdaftar / Nomor Ujian Salah
                                    </span>
                                </Alert>
                            )}
                            {numberStatus === 'error' && (
                                <Alert tone="info">
                                    Gagal memeriksa nomor peserta. Periksa koneksi lalu coba lagi.
                                </Alert>
                            )}
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

                    <Button type="submit" className="w-full py-3" disabled={!canSubmit}>
                        {processing ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
                        {processing ? 'Memeriksa data...' : 'Lanjutkan'}
                    </Button>

                    <p className="text-center text-xs text-slate-500 dark:text-slate-400">
                        Setelah nomor dan nama terverifikasi, daftar ujian yang tersedia untuk Anda akan ditampilkan.
                    </p>

                    <p className="text-center text-xs text-slate-500 dark:text-slate-400">
                        <Link
                            href="/admin/login"
                            className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-300"
                        >
                            Masuk sebagai admin
                        </Link>
                    </p>
                </form>
            </div>
        </ExamLayout>
    );
}
