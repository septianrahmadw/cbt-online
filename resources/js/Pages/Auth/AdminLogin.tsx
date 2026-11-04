import { Link, useForm, usePage } from '@inertiajs/react';
import { Eye, EyeOff, GraduationCap, Loader2, Lock, LogIn, Mail } from 'lucide-react';
import { useState } from 'react';
import { Alert, Button, Input, Label } from '../../components/ui';
import { ThemeToggle } from '../../components/ThemeToggle';
import type { SharedProps } from '../../types/shared';

export default function AdminLogin() {
    const { institution } = usePage<SharedProps>().props;
    const [showPassword, setShowPassword] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        post('/admin/login', {
            onFinish: () => reset('password'),
        });
    };

    return (
        <div className="relative flex min-h-screen flex-col justify-center bg-gradient-to-br from-brand-100 via-brand-50 to-brand-100 px-4 py-12 sm:px-6 lg:px-8 dark:from-slate-950 dark:via-slate-900 dark:to-brand-900">
            <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
                <ThemeToggle />
            </div>

            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-600 shadow-md shadow-brand-200 dark:shadow-none">
                            <GraduationCap className="h-7 w-7 text-white" />
                        </div>
                        <span className="text-2xl font-bold leading-none text-slate-900 dark:text-white">
                            CBT <span className="text-brand-600 dark:text-brand-300">Online</span>
                        </span>
                    </div>
                </div>
                <p className="mt-4 text-center text-sm text-slate-600 dark:text-slate-300">
                    Ujian Online Berbasis Komputer
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="card p-8 shadow-xl">
                    <div className="mb-6 text-center">
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Selamat Datang</h1>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Masuk ke panel admin {institution?.school_name ?? 'CBT Online'}
                        </p>
                    </div>

                    <form onSubmit={submit} className="space-y-4">
                        {errors.email && <Alert tone="error">{errors.email}</Alert>}

                        <div>
                            <Label htmlFor="email">Email Admin</Label>
                            <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                                    <Mail className="h-5 w-5" />
                                </span>
                                <Input
                                    id="email"
                                    type="email"
                                    autoComplete="username"
                                    value={data.email}
                                    onChange={(event) => setData('email', event.target.value)}
                                    placeholder="admin@cbt.test"
                                    className="pl-11"
                                    required
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="password">Password</Label>
                            <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                                    <Lock className="h-5 w-5" />
                                </span>
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    value={data.password}
                                    onChange={(event) => setData('password', event.target.value)}
                                    placeholder="password anda"
                                    className="pl-11 pr-11"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((value) => !value)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200"
                                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        <label className="flex select-none items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                            <input
                                type="checkbox"
                                checked={data.remember}
                                onChange={(event) => setData('remember', event.target.checked)}
                                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-950"
                            />
                            Ingat saya
                        </label>

                        <Button type="submit" className="w-full py-3" disabled={processing}>
                            {processing ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
                            {processing ? 'Memproses...' : 'Masuk'}
                        </Button>
                    </form>

                    <p className="mt-5 text-center text-xs text-slate-500 dark:text-slate-400">
                        <Link href="/exam/login" className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-300 dark:hover:text-brand-200">
                            Masuk sebagai peserta
                        </Link>
                    </p>
                </div>

                <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
                    &copy; {new Date().getFullYear()} {institution?.school_name ?? 'CBT Online'} &middot;{' '}
                    {institution?.academic_year ?? 'Tahun Pelajaran'}
                </p>
            </div>
        </div>
    );
}
