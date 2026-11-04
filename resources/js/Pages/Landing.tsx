import { Link, usePage } from '@inertiajs/react';
import { ArrowRight, GraduationCap, ShieldCheck } from 'lucide-react';
import { ThemeToggle } from '../components/ThemeToggle';
import type { SharedProps } from '../types/shared';

export default function Landing() {
    const { institution } = usePage<SharedProps>().props;

    return (
        <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-100 via-brand-50 to-brand-100 px-4 py-12 dark:from-slate-950 dark:via-slate-900 dark:to-brand-900">
            <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
                <ThemeToggle />
            </div>

            <div className="w-full max-w-3xl">
                <div className="mb-8 flex flex-col items-center gap-3 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-md shadow-brand-200 dark:shadow-none">
                        <GraduationCap size={30} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                            CBT <span className="text-brand-600 dark:text-brand-300">Online</span>
                        </h1>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{institution?.school_name}</p>
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <Link
                        href="/exam/login"
                        className="card group p-6 transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                            <GraduationCap size={22} />
                        </div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Masuk Ujian</h2>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Untuk peserta: masukkan nomor peserta dan nama sesuai data sekolah.
                        </p>
                        <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 dark:text-brand-300">
                            Mulai <ArrowRight size={14} className="transition group-hover:translate-x-0.5" />
                        </span>
                    </Link>

                    <Link
                        href="/admin/login"
                        className="card group p-6 transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                            <ShieldCheck size={22} />
                        </div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Panel Admin</h2>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Untuk proktor: kelola peserta, jadwal ujian, bank soal, dan rekap nilai.
                        </p>
                        <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-emerald-600 dark:text-emerald-300">
                            Masuk <ArrowRight size={14} className="transition group-hover:translate-x-0.5" />
                        </span>
                    </Link>
                </div>

                <p className="mt-8 text-center text-xs text-slate-500 dark:text-slate-400">
                    {institution?.exam_event_name ?? 'Ujian Berbasis Komputer'} &bull; Tahun Pelajaran{' '}
                    {institution?.academic_year ?? '-'}
                </p>
            </div>
        </div>
    );
}
