import { router, usePage } from '@inertiajs/react';
import { CheckCircle2, LogOut, Printer, XCircle } from 'lucide-react';
import { Badge, Button } from '../../components/ui';
import { ExamLayout } from '../../layouts/ExamLayout';
import type { SharedProps } from '../../types/shared';

interface ResultProps {
    result: {
        final_score: number;
        passing_status: 'lulus' | 'belum_lulus' | null;
        total_correct: number;
        total_wrong: number;
        total_empty: number;
        completed_at: string | null;
    };
    exam: { id: number; title: string; subject_name: string; passing_grade: number };
    participant: { id: number; exam_number: string; full_name: string; class_name: string | null };
}

export default function Result({ result, exam, participant }: ResultProps) {
    const { institution } = usePage<SharedProps>().props;
    const passed = result.passing_status === 'lulus';

    return (
        <ExamLayout>
            <div className="w-full print-area">
                <div className="card p-6 print:border-0 print:bg-white print:text-black">
                    <div className="mb-6 text-center">
                        <p className="text-xs uppercase tracking-wide text-slate-500 print:text-black dark:text-slate-400">
                            {institution?.school_name}
                        </p>
                        <h1 className="mt-1 text-xl font-semibold text-slate-900 print:text-black dark:text-white">
                            Hasil Ujian {exam.title}
                        </h1>
                        <p className="text-sm text-slate-500 print:text-black dark:text-slate-400">
                            {participant.full_name} • {participant.exam_number}
                            {participant.class_name ? ` • ${participant.class_name}` : ''}
                        </p>
                    </div>

                    <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center print:border-slate-300 print:bg-white dark:border-slate-800 dark:bg-slate-950">
                        <p className="text-xs uppercase tracking-wide text-slate-500 print:text-black dark:text-slate-400">Nilai Akhir</p>
                        <p className={`mt-1 text-5xl font-bold ${passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'} print:text-black`}>
                            {result.final_score.toFixed(2)}
                        </p>
                        <div className="mt-3 flex items-center justify-center gap-2">
                            {passed ? (
                                <Badge tone="green">
                                    <CheckCircle2 size={12} className="mr-1" /> Lulus
                                </Badge>
                            ) : (
                                <Badge tone="red">
                                    <XCircle size={12} className="mr-1" /> Belum Lulus
                                </Badge>
                            )}
                            <span className="text-xs text-slate-500 print:text-black dark:text-slate-400">
                                KKM {exam.passing_grade}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-center">
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 print:border-slate-300 print:bg-white dark:border-slate-800 dark:bg-slate-950">
                            <p className="text-2xl font-semibold text-emerald-600 print:text-black dark:text-emerald-300">
                                {result.total_correct}
                            </p>
                            <p className="text-xs text-slate-500 print:text-black dark:text-slate-400">Benar</p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 print:border-slate-300 print:bg-white dark:border-slate-800 dark:bg-slate-950">
                            <p className="text-2xl font-semibold text-rose-600 print:text-black dark:text-rose-300">{result.total_wrong}</p>
                            <p className="text-xs text-slate-500 print:text-black dark:text-slate-400">Salah</p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 print:border-slate-300 print:bg-white dark:border-slate-800 dark:bg-slate-950">
                            <p className="text-2xl font-semibold text-slate-700 print:text-black dark:text-slate-300">{result.total_empty}</p>
                            <p className="text-xs text-slate-500 print:text-black dark:text-slate-400">Kosong</p>
                        </div>
                    </div>

                    {result.completed_at && (
                        <p className="mt-5 text-center text-xs text-slate-500 print:text-black dark:text-slate-400">
                            Dikirim pada {new Date(result.completed_at).toLocaleString('id-ID')}
                        </p>
                    )}
                </div>

                <div className="no-print mt-5 flex flex-wrap justify-center gap-2">
                    <Button variant="secondary" onClick={() => window.print()}>
                        <Printer size={16} /> Cetak Bukti
                    </Button>
                    <Button variant="outline" onClick={() => router.post('/exam/logout')}>
                        <LogOut size={16} /> Keluar
                    </Button>
                </div>
            </div>
        </ExamLayout>
    );
}
