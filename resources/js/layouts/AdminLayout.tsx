import { Link, router, usePage } from '@inertiajs/react';
import {
    Activity,
    BarChart3,
    BookOpen,
    ClipboardList,
    FileText,
    GraduationCap,
    LayoutDashboard,
    LogOut,
    Menu,
    Settings,
    Tags,
    UserCog,
    Users,
    X,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import type { SharedProps, UserRole } from '../types/shared';
import { Alert } from '../components/ui';
import { ThemeToggle } from '../components/ThemeToggle';
import { cn } from '../lib/utils';

interface NavigationItem {
    href: string;
    label: string;
    icon: typeof LayoutDashboard;
    exact: boolean;
    roles?: UserRole[];
}

const navigation: NavigationItem[] = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { href: '/admin/participants', label: 'Peserta', icon: Users, exact: true, roles: ['admin'] },
    { href: '/admin/participant-categories', label: 'Kategori Peserta', icon: Tags, exact: false, roles: ['admin'] },
    { href: '/admin/exams', label: 'Daftar Ujian', icon: FileText, exact: false, roles: ['admin', 'dosen', 'pengawas'] },
    { href: '/admin/questions', label: 'Bank Soal', icon: BookOpen, exact: false, roles: ['admin', 'dosen'] },
    { href: '/admin/modules', label: 'Modul Soal', icon: ClipboardList, exact: false, roles: ['admin'] },
    { href: '/admin/results', label: 'Nilai & Rekap', icon: BarChart3, exact: false, roles: ['admin', 'dosen', 'pengawas'] },
    { href: '/admin/sessions', label: 'Sesi Berjalan', icon: Activity, exact: false, roles: ['admin', 'pengawas'] },
    { href: '/admin/users', label: 'Manajemen User', icon: UserCog, exact: false, roles: ['admin'] },
    { href: '/admin/settings', label: 'Pengaturan', icon: Settings, exact: false, roles: ['admin'] },
];

function todayLabel(): string {
    return new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    }).format(new Date());
}

export function AdminLayout({
    children,
    title,
    subtitle,
    actions,
}: {
    children: ReactNode;
    title: string;
    subtitle?: string;
    actions?: ReactNode;
}) {
    const { props } = usePage<SharedProps>();
    const { auth, institution, flash } = props;
    const currentUrl = usePage().url;
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const user = auth?.user;
    const initial = (user?.name ?? 'A').trim().charAt(0).toUpperCase();
    const visibleNavigation = navigation.filter(
        (item) => !item.roles || (user?.role && item.roles.includes(user.role)),
    );

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <aside
                className={cn(
                    'no-print fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-brand-900 text-white transition-transform duration-200 lg:translate-x-0',
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                )}
            >
                <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
                    <Link href="/admin" className="flex min-w-0 items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-600 shadow-md shadow-brand-900/40">
                            <GraduationCap size={17} className="text-white" />
                        </div>
                        <span className="min-w-0 leading-none">
                            <span className="block truncate text-base font-bold">
                                CBT <span className="text-brand-300">Online</span>
                            </span>
                            <span className="mt-0.5 block truncate text-[10px] font-medium text-brand-300/80">
                                {institution?.school_name}
                            </span>
                        </span>
                    </Link>
                    <button
                        type="button"
                        onClick={() => setSidebarOpen(false)}
                        className="rounded-lg p-1 text-brand-100/80 hover:bg-white/10 hover:text-white lg:hidden"
                        aria-label="Tutup menu"
                    >
                        <X size={18} />
                    </button>
                </div>

                <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
                    {visibleNavigation.map((item) => {
                        const Icon = item.icon;
                        const active = item.exact ? currentUrl === item.href : currentUrl.startsWith(item.href);

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={cn(
                                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                                    active
                                        ? 'bg-white/10 text-white'
                                        : 'text-brand-100/80 hover:bg-white/5 hover:text-white'
                                )}
                            >
                                <Icon size={19} className="shrink-0" />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="border-t border-white/10 p-3">
                    {user && (
                        <div className="mb-2 flex items-center gap-2.5 rounded-xl bg-white/5 px-3 py-2">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                                {initial}
                            </div>
                            <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-white">{user.name}</p>
                                <p className="truncate text-xs text-brand-200/80">{user.role_label}</p>
                            </div>
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={() => router.post('/admin/logout')}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-brand-100/80 transition-colors hover:bg-white/5 hover:text-white"
                    >
                        <LogOut size={19} />
                        Keluar
                    </button>
                </div>
            </aside>

            {sidebarOpen && (
                <div
                    className="no-print fixed inset-0 z-30 bg-slate-900/50 backdrop-blur-sm lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <div className="flex min-h-screen min-w-0 flex-col lg:pl-64">
                <header className="no-print sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200/70 bg-white/60 px-4 backdrop-blur-lg sm:px-6 dark:border-slate-800/70 dark:bg-slate-900/60">
                    <button
                        type="button"
                        onClick={() => setSidebarOpen(true)}
                        className="text-slate-600 hover:text-slate-900 lg:hidden dark:text-slate-300 dark:hover:text-white"
                        aria-label="Buka menu"
                    >
                        <Menu size={22} />
                    </button>
                    <h1 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h1>

                    <div className="ml-auto flex items-center gap-2 sm:gap-3">
                        <span className="hidden text-sm text-slate-500 sm:block dark:text-slate-400">{todayLabel()}</span>
                        <ThemeToggle />
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
                                {initial}
                            </div>
                            <div className="hidden leading-tight sm:block">
                                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                    {user?.name ?? 'Administrator'}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {user?.role_label ?? 'Staff'}
                                </p>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="mx-auto w-full max-w-screen-2xl flex-1 p-4 sm:p-6 lg:p-8">
                    {(subtitle || actions) && (
                        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h2>
                                {subtitle && <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
                            </div>
                            {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
                        </div>
                    )}

                    {flash?.success && (
                        <div className="mb-4">
                            <Alert tone="success">{flash.success}</Alert>
                        </div>
                    )}
                    {flash?.error && (
                        <div className="mb-4">
                            <Alert tone="error">{flash.error}</Alert>
                        </div>
                    )}

                    {children}
                </main>
            </div>
        </div>
    );
}
