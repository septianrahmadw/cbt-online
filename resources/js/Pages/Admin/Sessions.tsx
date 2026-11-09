import { router, usePage, usePoll } from '@inertiajs/react';
import { Activity, Ban, CheckCircle2, Clock, RefreshCw, Square, Trash2, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge, Button, Card, EmptyState, Modal } from '../../components/ui';
import { AdminLayout } from '../../layouts/AdminLayout';
import { cn, formatDuration } from '../../lib/utils';
import type { SharedProps } from '../../types/shared';

interface SessionParticipant {
    id: number;
    exam_number: string;
    full_name: string;
    class_name: string | null;
}

interface SessionExam {
    id: number;
    title: string;
    subject_name: string;
    is_active: boolean;
    duration_minutes: number;
}

interface SessionRow {
    id: number;
    start_time: string | null;
    remaining_seconds: number;
    violations_count: number;
    last_violation_type: string | null;
    answered_count: number;
    total_questions: number;
    participant: SessionParticipant | null;
    exam: SessionExam | null;
}

interface ExamGroup {
    exam: SessionExam;
    sessions: SessionRow[];
}

type StopAction = 'submit' | 'delete';

interface StopTarget {
    scope: 'one' | 'all';
    sessionId?: number;
    examId: number;
    description: string;
    sessionCount: number;
}

const violationLabels: Record<string, string> = {
    blur: 'Kehilangan fokus',
    tab_switch: 'Pindah tab',
    fullscreen_exit: 'Keluar layar penuh',
    shortcut: 'Shortcut terlarang',
};

function formatStartTime(value: string | null): string {
    if (!value) {
        return '-';
    }

    return new Date(value).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

export default function Sessions({ sessions }: { sessions: SessionRow[]; serverTime: string }) {
    const { auth } = usePage<SharedProps>().props;
    const isAdmin = auth?.user?.role === 'admin';
    const [tab, setTab] = useState<'active' | 'inactive'>('active');
    const [stopTarget, setStopTarget] = useState<StopTarget | null>(null);
    const [processing, setProcessing] = useState(false);

    usePoll(5000, { only: ['sessions'] });

    const grouped = useMemo(() => {
        const map = new Map<number, ExamGroup>();

        for (const session of sessions) {
            if (!session.exam) {
                continue;
            }

            const group = map.get(session.exam.id) ?? { exam: session.exam, sessions: [] };
            group.sessions.push(session);
            map.set(session.exam.id, group);
        }

        return [...map.values()];
    }, [sessions]);

    const activeGroups = useMemo(() => grouped.filter((group) => group.exam.is_active), [grouped]);
    const inactiveGroups = useMemo(() => grouped.filter((group) => !group.exam.is_active), [grouped]);
    const activeCount = useMemo(() => activeGroups.reduce((sum, group) => sum + group.sessions.length, 0), [activeGroups]);
    const inactiveCount = useMemo(() => inactiveGroups.reduce((sum, group) => sum + group.sessions.length, 0), [inactiveGroups]);

    const visibleGroups = tab === 'active' ? activeGroups : inactiveGroups;
    const visibleCount = tab === 'active' ? activeCount : inactiveCount;

    const confirmStop = (action: StopAction) => {
        if (!stopTarget || processing) {
            return;
        }

        setProcessing(true);

        const options = {
            preserveScroll: true,
            onFinish: () => {
                setProcessing(false);
                setStopTarget(null);
            },
        };

        if (stopTarget.scope === 'one' && stopTarget.sessionId) {
            router.post(`/admin/sessions/${stopTarget.sessionId}/stop`, { action }, options);
        } else {
            router.post('/admin/sessions/stop-all', { exam_id: stopTarget.examId, action }, options);
        }
    };

    const renderGroup = (group: ExamGroup) => (
        <Card key={group.exam.id} className="p-0">
            <div className="flex flex-col gap-2 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate text-sm font-semibold text-slate-900 dark:text-white">{group.exam.title}</h2>
                        <Badge tone={group.exam.is_active ? 'green' : 'red'}>
                            {group.exam.is_active ? 'Ujian Aktif' : 'Ujian Nonaktif'}
                        </Badge>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                        {group.exam.subject_name} &middot; {group.sessions.length} sesi berjalan
                    </p>
                </div>
                <Button
                    variant="danger"
                    size="sm"
                    className="shrink-0"
                    onClick={() =>
                        setStopTarget({
                            scope: 'all',
                            examId: group.exam.id,
                            description: `semua ${group.sessions.length} sesi berjalan pada ujian "${group.exam.title}"`,
                            sessionCount: group.sessions.length,
                        })
                    }
                >
                    <Square size={14} /> Hentikan Semua ({group.sessions.length})
                </Button>
            </div>

            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {group.sessions.map((session) => {
                    const progress = session.total_questions > 0
                        ? Math.round((session.answered_count / session.total_questions) * 100)
                        : 0;
                    const urgent = session.remaining_seconds <= 300;

                    return (
                        <li key={session.id} className="flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:gap-4">
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                                    {session.participant?.full_name ?? '-'}
                                </p>
                                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                                    {session.participant?.exam_number}
                                    {session.participant?.class_name ? ` • ${session.participant.class_name}` : ''}
                                    {' • mulai '}
                                    {formatStartTime(session.start_time)}
                                </p>
                            </div>

                            <div className="w-full sm:w-48">
                                <div className="mb-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                                    <span>Progres</span>
                                    <span>
                                        {session.answered_count}/{session.total_questions} soal
                                    </span>
                                </div>
                                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                    <div
                                        className="h-full rounded-full bg-brand-500 transition-all"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2 lg:w-28">
                                <Clock size={14} className={urgent ? 'text-rose-500' : 'text-slate-400'} />
                                <span
                                    className={cn(
                                        'font-mono text-sm font-semibold tabular-nums',
                                        urgent ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-200',
                                    )}
                                >
                                    {formatDuration(session.remaining_seconds)}
                                </span>
                            </div>

                            <div className="lg:w-40">
                                <Badge tone={session.violations_count > 0 ? 'red' : 'slate'}>
                                    {session.violations_count}x pelanggaran
                                </Badge>
                                {session.last_violation_type && (
                                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                                        Terakhir: {violationLabels[session.last_violation_type] ?? session.last_violation_type}
                                    </p>
                                )}
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                className="shrink-0 self-start lg:self-center"
                                onClick={() =>
                                    setStopTarget({
                                        scope: 'one',
                                        sessionId: session.id,
                                        examId: group.exam.id,
                                        description: `sesi milik ${session.participant?.full_name ?? 'peserta'} pada ujian "${group.exam.title}"`,
                                        sessionCount: 1,
                                    })
                                }
                            >
                                <Square size={14} /> Hentikan
                            </Button>
                        </li>
                    );
                })}
            </ul>
        </Card>
    );

    return (
        <AdminLayout
            title="Sesi Berjalan"
            subtitle="Pantau dan hentikan sesi ujian yang sedang dikerjakan peserta."
            actions={
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <RefreshCw size={12} /> Diperbarui otomatis setiap 5 detik
                </span>
            }
        >
            <div className="mb-4 flex flex-wrap items-center gap-2">
                <button
                    type="button"
                    onClick={() => setTab('active')}
                    className={cn(
                        'inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition',
                        tab === 'active'
                            ? 'bg-brand-600 text-white shadow-sm'
                            : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300',
                    )}
                >
                    <Activity size={16} /> Ujian Aktif ({activeCount})
                </button>
                <button
                    type="button"
                    onClick={() => setTab('inactive')}
                    className={cn(
                        'inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition',
                        tab === 'inactive'
                            ? 'bg-brand-600 text-white shadow-sm'
                            : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300',
                    )}
                >
                    <Ban size={16} /> Ujian Nonaktif ({inactiveCount})
                </button>
            </div>

            {visibleGroups.length === 0 ? (
                <EmptyState>
                    {tab === 'active'
                        ? 'Tidak ada sesi berjalan pada ujian yang aktif.'
                        : 'Tidak ada sesi berjalan pada ujian yang nonaktif.'}
                </EmptyState>
            ) : (
                <div className="space-y-4">{visibleGroups.map(renderGroup)}</div>
            )}

            <Modal
                open={stopTarget !== null}
                onClose={() => !processing && setStopTarget(null)}
                title="Hentikan Ujian?"
                footer={
                    <>
                        <Button variant="ghost" size="sm" onClick={() => setStopTarget(null)} disabled={processing}>
                            Batal
                        </Button>
                        {isAdmin && (
                            <Button variant="danger" size="sm" onClick={() => confirmStop('delete')} disabled={processing}>
                                <Trash2 size={14} /> Hapus (tanpa nilai)
                            </Button>
                        )}
                        <Button variant="success" size="sm" onClick={() => confirmStop('submit')} disabled={processing}>
                            <CheckCircle2 size={14} /> Paksa submit &amp; nilai
                        </Button>
                    </>
                }
            >
                <div className="space-y-3">
                    <p>
                        Anda akan menghentikan{' '}
                        <span className="font-semibold text-slate-900 dark:text-white">{stopTarget?.description}</span>.
                        Pilih tindakan yang diinginkan:
                    </p>
                    <ul className="space-y-2 text-xs">
                        <li className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-2 dark:border-emerald-500/30 dark:bg-emerald-500/10">
                            <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                            <span>
                                <strong>Paksa submit &amp; nilai</strong> — jawaban tersimpan dinilai dan masuk rekap.
                                Sesi ditandai <em>forced_submit</em>.
                            </span>
                        </li>
                        {isAdmin && (
                            <li className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-2 dark:border-rose-500/30 dark:bg-rose-500/10">
                                <Trash2 size={14} className="mt-0.5 shrink-0 text-rose-600 dark:text-rose-400" />
                                <span>
                                    <strong>Hapus (tanpa nilai)</strong> — sesi, jawaban, dan log pelanggaran dihapus
                                    permanen. Peserta dapat login kembali jika ujian masih dibuka.
                                </span>
                            </li>
                        )}
                    </ul>
                    {stopTarget && stopTarget.sessionCount > 1 && (
                        <p className="flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                            <Users size={12} /> Tindakan ini memengaruhi {stopTarget.sessionCount} peserta sekaligus.
                        </p>
                    )}
                </div>
            </Modal>
        </AdminLayout>
    );
}
