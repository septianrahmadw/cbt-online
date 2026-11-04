import { Link } from '@inertiajs/react';
import { Award, BarChart3, BookOpen, Clock, Users } from 'lucide-react';
import { AdminLayout } from '../../layouts/AdminLayout';
import { Badge, EmptyState } from '../../components/ui';
import { cn } from '../../lib/utils';

interface Stats {
    total_participants: number;
    total_exams: number;
    completed: number;
    not_started: number;
    average_score: number;
    active_sessions: number;
}

interface ResultRow {
    id: number;
    total_correct: number;
    total_wrong: number;
    total_empty: number;
    final_score: number;
    passing_status: string | null;
    completed_at: string | null;
    participant: { exam_number: string; full_name: string } | null;
    exam: { title: string; subject_name: string } | null;
}

interface ExamRow {
    id: number;
    title: string;
    subject_name: string;
    is_active: boolean;
    questions_count: number;
    sessions_count: number;
    results_count: number;
}

interface DistributionItem {
    label: string;
    count: number;
}

interface ActiveSession {
    id: number;
    start_time: string | null;
    violations_count: number;
    participant: { exam_number: string; full_name: string } | null;
    exam: { title: string } | null;
}

export default function Dashboard({
    stats,
    recentResults,
    exams,
    scoreDistribution,
    activeSessions,
}: {
    stats: Stats;
    recentResults: ResultRow[];
    exams: ExamRow[];
    scoreDistribution: DistributionItem[];
    activeSessions: ActiveSession[];
}) {
    const cards = [
        { label: 'Total Peserta', value: stats.total_participants, icon: Users, tone: 'brand' },
        { label: 'Paket Ujian', value: stats.total_exams, icon: BookOpen, tone: 'brand' },
        { label: 'Sesi Berlangsung', value: stats.active_sessions, icon: Clock, tone: 'slate' },
        { label: 'Rata-rata Nilai', value: Number(stats.average_score).toFixed(2), icon: BarChart3, tone: 'brand' },
    ];

    const maxCount = Math.max(1, ...scoreDistribution.map((item) => item.count));

    return (
        <AdminLayout title="Dashboard">
            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {cards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <div key={card.label} className="card p-5">
                            <div className="flex items-center gap-3">
                                <div
                                    className={cn(
                                        'flex h-11 w-11 items-center justify-center rounded-xl',
                                        card.tone === 'brand'
                                            ? 'bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300'
                                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                                    )}
                                >
                                    <Icon size={22} />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{card.value}</p>
                                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{card.label}</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="card p-6 lg:col-span-2">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Distribusi Nilai</h2>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{stats.completed} hasil ujian</span>
                    </div>
                    <div className="flex h-64 items-end gap-1.5 sm:gap-2">
                        {scoreDistribution.map((item) => (
                            <div key={item.label} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                                    {item.count > 0 ? item.count : ''}
                                </span>
                                <div
                                    className="w-full rounded-t-lg bg-brand-500 transition hover:bg-brand-600"
                                    style={{ height: `${Math.max(item.count > 0 ? 6 : 2, (item.count / maxCount) * 100)}%` }}
                                    title={`${item.label}: ${item.count} peserta`}
                                />
                                <span className="text-[9px] text-slate-400 sm:text-[10px]">{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card p-6">
                    <h2 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">Sesi Ujian Aktif</h2>
                    {activeSessions.length === 0 ? (
                        <div className="py-8 text-center">
                            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                                <Clock size={22} />
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Tidak ada sesi ujian aktif.</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {activeSessions.map((session) => (
                                <div
                                    key={session.id}
                                    className="rounded-xl border border-slate-100 p-3 dark:border-slate-800"
                                >
                                    <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                                        {session.participant?.full_name}
                                    </p>
                                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                                        {session.exam?.title}
                                    </p>
                                    <div className="mt-1.5 flex items-center justify-between text-xs">
                                        <span className="text-slate-400 dark:text-slate-500">
                                            {session.start_time
                                                ? new Date(session.start_time).toLocaleTimeString('id-ID', {
                                                      hour: '2-digit',
                                                      minute: '2-digit',
                                                  })
                                                : '-'}
                                        </span>
                                        <Badge tone={session.violations_count > 0 ? 'red' : 'green'}>
                                            {session.violations_count} pelanggaran
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="card overflow-hidden p-0">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Hasil Ujian Terbaru</h2>
                    <Link
                        href="/admin/results"
                        className="text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-300 dark:hover:text-brand-200"
                    >
                        Lihat semua &rarr;
                    </Link>
                </div>
                <div className="overflow-x-auto">
                    {recentResults.length === 0 ? (
                        <div className="p-6">
                            <EmptyState>Belum ada peserta yang menyelesaikan ujian.</EmptyState>
                        </div>
                    ) : (
                        <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
                            <thead className="bg-slate-50 dark:bg-slate-950/60">
                                <tr>
                                    <th className="table-th">Peserta</th>
                                    <th className="table-th">Ujian</th>
                                    <th className="table-th">Benar/Salah/Kosong</th>
                                    <th className="table-th">Skor</th>
                                    <th className="table-th">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
                                {recentResults.map((row) => (
                                    <tr key={row.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50">
                                        <td className="table-td">
                                            <p className="font-semibold text-slate-900 dark:text-white">
                                                {row.participant?.full_name}
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                {row.participant?.exam_number}
                                            </p>
                                        </td>
                                        <td className="table-td">
                                            <p>{row.exam?.title}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                {row.exam?.subject_name}
                                            </p>
                                        </td>
                                        <td className="table-td">
                                            <div className="flex flex-wrap items-center gap-1 text-xs">
                                                <span className="rounded-md bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                                                    {row.total_correct}
                                                </span>
                                                <span className="rounded-md bg-rose-100 px-2 py-0.5 font-semibold text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
                                                    {row.total_wrong}
                                                </span>
                                                <span className="rounded-md bg-slate-100 px-2 py-0.5 font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                                    {row.total_empty}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="table-td font-mono font-semibold">
                                            {Number(row.final_score).toFixed(2)}
                                        </td>
                                        <td className="table-td">
                                            <Badge tone={row.passing_status === 'lulus' ? 'green' : 'red'}>
                                                {row.passing_status === 'lulus' ? 'Lulus' : 'Belum'}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {exams.length > 0 && (
                <div className="mt-6 card p-0">
                    <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
                        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Ujian Terbaru</h2>
                        <Link
                            href="/admin/exams"
                            className="text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-300 dark:hover:text-brand-200"
                        >
                            Kelola ujian &rarr;
                        </Link>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {exams.map((exam) => (
                            <div
                                key={exam.id}
                                className="flex flex-wrap items-center justify-between gap-2 px-6 py-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/50"
                            >
                                <div>
                                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{exam.title}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{exam.subject_name}</p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                    <Badge tone={exam.is_active ? 'green' : 'slate'}>
                                        {exam.is_active ? 'Aktif' : 'Nonaktif'}
                                    </Badge>
                                    <span>{exam.questions_count} soal</span>
                                    <span className="text-slate-300 dark:text-slate-600">&bull;</span>
                                    <span>{exam.results_count} selesai</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                <Award size={14} />
                <span>
                    {stats.completed} peserta telah menyelesaikan ujian, {stats.not_started} belum mengerjakan.
                </span>
            </div>
        </AdminLayout>
    );
}
