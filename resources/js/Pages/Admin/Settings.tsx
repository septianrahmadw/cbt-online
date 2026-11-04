import { useForm, usePage } from '@inertiajs/react';
import { Save } from 'lucide-react';
import { Alert, Button, Card, Input, Label } from '../../components/ui';
import { AdminLayout } from '../../layouts/AdminLayout';
import type { SharedProps } from '../../types/shared';

interface Settings {
    id: number;
    school_name: string;
    logo_url: string | null;
    academic_year: string | null;
    exam_event_name: string | null;
    passing_grade_default: number;
}

export default function SettingsPage({ settings }: { settings: Settings }) {
    const { props } = usePage<SharedProps>();
    const { data, setData, post, processing, errors } = useForm({
        school_name: settings.school_name,
        academic_year: settings.academic_year ?? '',
        exam_event_name: settings.exam_event_name ?? '',
        passing_grade_default: settings.passing_grade_default,
        logo: null as File | null,
    });

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        post('/admin/settings', { forceFormData: true });
    };

    return (
        <AdminLayout title="Pengaturan Lembaga" subtitle="Identitas sekolah dan konfigurasi dasar ujian.">
            <form onSubmit={submit} className="grid gap-4 xl:grid-cols-3">
                <Card className="space-y-4 xl:col-span-2">
                    {errors.school_name && <Alert tone="error">{errors.school_name}</Alert>}

                    <div>
                        <Label htmlFor="school_name">Nama Sekolah / Universitas / Politeknik</Label>
                        <Input
                            id="school_name"
                            value={data.school_name}
                            onChange={(event) => setData('school_name', event.target.value)}
                            required
                        />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                            <Label htmlFor="academic_year">Tahun Pelajaran</Label>
                            <Input
                                id="academic_year"
                                value={data.academic_year}
                                onChange={(event) => setData('academic_year', event.target.value)}
                                placeholder="2026/2027"
                            />
                        </div>
                        <div>
                            <Label htmlFor="passing_grade_default">KKM Default</Label>
                            <Input
                                id="passing_grade_default"
                                type="number"
                                min={0}
                                max={100}
                                value={data.passing_grade_default}
                                onChange={(event) => setData('passing_grade_default', Number(event.target.value))}
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="exam_event_name">Nama Acara Ujian</Label>
                        <Input
                            id="exam_event_name"
                            value={data.exam_event_name}
                            onChange={(event) => setData('exam_event_name', event.target.value)}
                            placeholder="Ujian Tertulis Berbasis Komputer 2026"
                        />
                    </div>

                    <div>
                        <Label htmlFor="logo">Logo Institusi (opsional)</Label>
                        <input
                            id="logo"
                            type="file"
                            accept="image/*"
                            onChange={(event) => setData('logo', event.target.files?.[0] ?? null)}
                            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:text-slate-700 dark:text-slate-400 dark:file:bg-slate-800 dark:file:text-slate-200"
                        />
                        {errors.logo && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errors.logo}</p>}
                    </div>

                    <Button type="submit" disabled={processing}>
                        <Save size={16} /> {processing ? 'Menyimpan...' : 'Simpan Pengaturan'}
                    </Button>
                </Card>

                <Card className="space-y-3">
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Pratinjau Identitas</h2>
                    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
                        {settings.logo_url ? (
                            <img src={settings.logo_url} alt="Logo" className="h-12 w-12 rounded object-contain" />
                        ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded bg-brand-100 text-sm font-bold text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
                                {data.school_name.slice(0, 2).toUpperCase()}
                            </div>
                        )}
                        <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{data.school_name}</p>
                            <p className="truncate text-xs text-slate-500 dark:text-slate-400">{data.academic_year || '-'}</p>
                        </div>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{data.exam_event_name || 'Nama acara ujian belum diisi'}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Institusi: {props.institution?.school_name}
                    </p>
                </Card>
            </form>
        </AdminLayout>
    );
}
