import { Link, router, useForm } from '@inertiajs/react';
import { Download, Printer, RotateCcw, Users } from 'lucide-react';
import { useState } from 'react';
import { Alert, Badge, Button, Card, EmptyState, Select } from '../../components/ui';
import { AdminLayout } from '../../layouts/AdminLayout';

interface ExamOption {
    id: number;
    title: string;
    subject_name: string;
}

interface ResultRow {
    id: number;
    total_correct: number;
    total_wrong: number;
    total_empty: number;
    final_score: number;
    passing_status: string | null;
    completed_at: string | null;
    participant: { exam_number: string; full_name: string; class_name: string | null } | null;
}

interface ActiveSession {
    id: number;
    start_time: string | null;
    violations_count: number;
    participant: { exam_number: string; full_name: string } | null;
    exam: { title: string } | null;
}

interface ParticipantOption {
    id: number;
    exam_number: string;
    full_name: string;
}

export default function Results({
    exams,
    selectedExamId,
    selectedExam,
    results,
    activeSessions,
    participants,
    summary,
}: {
    exams: ExamOption[];
    selectedExamId: number | null;
    selectedExam: { id: number; title: string; subject_name: string; passing_grade: number } | null;
    results: ResultRow[];
    activeSessions: ActiveSession[];
    participants: ParticipantOption[];
    summary: { total_participants: number; total_completed: number; average: number; passed: number };
}) {
    const [confirmReset, setConfirmReset] = useState(false);

    const resetForm = useForm({
        exam_id: selectedExamId ?? '',
        participant_id: '',
    });

    const changeExam = (examId: string) => {
        router.get('/admin/results', { exam_id: examId }, { preserveState: true, replace: true });
    };

    const submitReset = (event: React.FormEvent) => {
        event.preventDefault();

        resetForm.post('/admin/reset', {
            preserveScroll: true,
            onSuccess: () => {
                setConfirmReset(false);
                resetForm.reset('participant_id');
            },
        });
    };

    const exportUrl = selectedExamId ? `/admin/results/export?exam_id=${selectedExamId}` : '/admin/results/export';
    const printUrl = selectedExamId ? `/admin/results/print?exam_id=${selectedExamId}` : '/admin/results/print';

    return (
        <AdminLayout
            title="Rekap Nilai"
            subtitle="Pantau hasil ujian, sesi berjalan, dan cetak rekap nilai."
            actions={
                <>
                    <a
                        href={exportUrl}
                        className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                        <Download size={16} /> Export CSV
                    </a>
                    <a
                        href={printUrl}
                        className="btn-primary h-10 px-3"
                    >
                        <Printer size={16} /> Cetak
                    </a>
                </>
            }
        >
            <Card className="mb-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div className="w-full sm:max-w-md">
                        <label className="mb-1 block text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Pilih Ujian</label>
                        <Select value={selectedExamId ?? ''} onChange={(event) => changeExam(event.target.value)}>
                            {exams.map((exam) => (
                                <option key={exam.id} value={exam.id}>
                                    {exam.title} — {exam.subject_name}
                                </option>
                            ))}
                        </Select>
                    </div>
                    {selectedExam && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            KKM {selectedExam.passing_grade} • {summary.total_completed} peserta selesai
                        </p>
                    )}
                </div>
            </Card>

            <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[
                    { label: 'Total Peserta', value: summary.total_participants },
                    { label: 'Selesai', value: summary.total_completed },
                    { label: 'Rata-rata Nilai', value: summary.average },
                    { label: 'Lulus', value: summary.passed },
                ].map((item) => (
                    <Card key={item.label}>
                        <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{item.label}</p>
                        <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{item.value}</p>
                    </Card>
                ))}
            </div>

            <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
                <div className="space-y-4">
                    <Card>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3">
                                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
                                    <Users size={20} />
                                </span>
                                <div>
                                    <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                                        Sesi Berjalan: {activeSessions.length}
                                    </h2>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Monitoring &amp; penghentian sesi dilakukan di halaman Sesi Berjalan.
                                    </p>
                                </div>
                            </div>
                            <Link
                                href="/admin/sessions"
                                className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                            >
                                Buka Sesi Berjalan &rarr;
                            </Link>
                        </div>
                    </Card>

                    <Card>
                        <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Hasil Peserta</h2>
                        {results.length === 0 ? (
                            <EmptyState>Belum ada peserta yang menyelesaikan ujian ini.</EmptyState>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                            <th className="pb-2">No</th>
                                            <th className="pb-2">Peserta</th>
                                            <th className="pb-2 text-right">B</th>
                                            <th className="pb-2 text-right">S</th>
                                            <th className="pb-2 text-right">K</th>
                                            <th className="pb-2 text-right">Nilai</th>
                                            <th className="pb-2 text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {results.map((result, index) => (
                                            <tr key={result.id}>
                                                <td className="py-2 text-slate-500 dark:text-slate-400">{index + 1}</td>
                                                <td className="py-2">
                                                    <p className="font-medium text-slate-900 dark:text-white">
                                                        {result.participant?.full_name}
                                                    </p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                                        {result.participant?.exam_number}
                                                        {result.participant?.class_name
                                                            ? ` • ${result.participant.class_name}`
                                                            : ''}
                                                    </p>
                                                </td>
                                                <td className="py-2 text-right text-emerald-600 dark:text-emerald-300">{result.total_correct}</td>
                                                <td className="py-2 text-right text-rose-600 dark:text-rose-300">{result.total_wrong}</td>
                                                <td className="py-2 text-right text-slate-500 dark:text-slate-400">{result.total_empty}</td>
                                                <td className="py-2 text-right font-mono text-slate-900 dark:text-slate-200">
                                                    {Number(result.final_score).toFixed(2)}
                                                </td>
                                                <td className="py-2 text-right">
                                                    <Badge tone={result.passing_status === 'lulus' ? 'green' : 'red'}>
                                                        {result.passing_status === 'lulus' ? 'Lulus' : 'Belum'}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Card>
                </div>

                <Card className="h-fit">
                    <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                        <RotateCcw size={16} /> Reset Peserta
                    </h2>
                    <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
                        Menghapus sesi dan hasil peserta pada ujian ini sehingga dapat mengerjakan ulang.
                    </p>

                    {!selectedExamId ? (
                        <Alert tone="info">Pilih ujian terlebih dahulu.</Alert>
                    ) : !confirmReset ? (
                        <Button variant="danger" className="w-full" onClick={() => setConfirmReset(true)}>
                            Pilih Peserta untuk Direset
                        </Button>
                    ) : (
                        <form onSubmit={submitReset} className="space-y-3">
                            <Alert tone="error">
                                Tindakan ini menghapus jawaban dan nilai peserta. Tidak dapat dibatalkan.
                            </Alert>
                            <Select
                                value={resetForm.data.participant_id}
                                onChange={(event) => resetForm.setData('participant_id', event.target.value)}
                                required
                            >
                                <option value="">Pilih peserta...</option>
                                {participants.map((participant) => (
                                    <option key={participant.id} value={participant.id}>
                                        {participant.exam_number} — {participant.full_name}
                                    </option>
                                ))}
                            </Select>
                            {resetForm.errors.participant_id && (
                                <p className="text-xs text-rose-600 dark:text-rose-400">{resetForm.errors.participant_id}</p>
                            )}
                            <div className="flex gap-2">
                                <Button
                                    type="submit"
                                    variant="danger"
                                    disabled={resetForm.processing || !resetForm.data.participant_id}
                                >
                                    Reset Sekarang
                                </Button>
                                <Button type="button" variant="secondary" onClick={() => setConfirmReset(false)}>
                                    Batal
                                </Button>
                            </div>
                        </form>
                    )}
                </Card>
            </div>
        </AdminLayout>
    );
}
