import { Link, usePage } from '@inertiajs/react';
import { GraduationCap } from 'lucide-react';
import type { ReactNode } from 'react';
import type { SharedProps } from '../types/shared';
import { ThemeToggle } from '../components/ThemeToggle';

export function ExamLayout({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
    const { institution } = usePage<SharedProps>().props;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <header className="border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
                <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
                    <Link href="/" className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white shadow-md shadow-brand-200 dark:shadow-none">
                            <GraduationCap size={20} />
                        </div>
                        <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                                {institution?.school_name}
                            </p>
                            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                                {institution?.exam_event_name ?? 'Ujian Berbasis Komputer'}
                            </p>
                        </div>
                    </Link>
                    <div className="ml-auto">
                        <ThemeToggle />
                    </div>
                </div>
            </header>

            <main className={wide ? 'mx-auto max-w-7xl px-4 py-6' : 'mx-auto flex max-w-3xl px-4 py-10'}>
                {children}
            </main>
        </div>
    );
}
