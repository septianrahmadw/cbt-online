import { Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import { AdminLayout } from '../../../layouts/AdminLayout';
import { Button, Card, Input, Label, Select, Textarea } from '../../../components/ui';
import { MODULE_COLOR_OPTIONS, type ModuleColor } from '../../../lib/moduleColors';

interface ModuleData {
    id: number;
    name: string;
    code: string;
    color: string;
    sort_order: number;
    is_active: boolean;
    description: string | null;
}

export default function ModuleForm({
    module,
    nextSortOrder,
}: {
    module: ModuleData | null;
    nextSortOrder: number | null;
}) {
    const form = useForm({
        name: module?.name ?? '',
        code: module?.code ?? '',
        color: (module?.color ?? 'brand') as ModuleColor,
        sort_order: module?.sort_order ?? nextSortOrder ?? 0,
        is_active: module?.is_active ?? true,
        description: module?.description ?? '',
    });

    const submit = (event: React.FormEvent) => {
        event.preventDefault();

        if (module) {
            form.put(`/admin/modules/${module.id}`, { preserveScroll: true });
        } else {
            form.post('/admin/modules');
        }
    };

    return (
        <AdminLayout
            title={module ? 'Edit Modul Soal' : 'Tambah Modul Soal'}
            subtitle="Buat kategori modul untuk mengelompokkan bank soal"
            actions={
                <Link
                    href="/admin/modules"
                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                    <ArrowLeft size={16} /> Kembali ke Modul Soal
                </Link>
            }
        >
            <form onSubmit={submit}>
                <Card className="max-w-2xl space-y-4">
                    {Object.keys(form.errors).length > 0 && (
                        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200">
                            Periksa kembali isian modul di bawah ini.
                        </p>
                    )}

                    <div className="sm:col-span-2">
                        <Label htmlFor="name">
                            Nama Modul <span className="text-rose-500">*</span>
                        </Label>
                        <Input
                            id="name"
                            value={form.data.name}
                            onChange={(event) => form.setData('name', event.target.value)}
                            placeholder="mis. Penalaran Matematika"
                            required
                        />
                        {form.errors.name && (
                            <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{form.errors.name}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <Label htmlFor="code">
                                Kode Modul <span className="text-rose-500">*</span>
                            </Label>
                            <Input
                                id="code"
                                value={form.data.code}
                                onChange={(event) => form.setData('code', event.target.value)}
                                placeholder="penalaran-matematika"
                                required
                            />
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                Hanya huruf kecil, angka, strip (-), dan underscore (_).
                            </p>
                            {form.errors.code && (
                                <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{form.errors.code}</p>
                            )}
                        </div>
                        <div>
                            <Label htmlFor="color">
                                Warna Badge <span className="text-rose-500">*</span>
                            </Label>
                            <Select
                                id="color"
                                value={form.data.color}
                                onChange={(event) => form.setData('color', event.target.value as ModuleColor)}
                            >
                                {MODULE_COLOR_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </Select>
                            {form.errors.color && (
                                <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{form.errors.color}</p>
                            )}
                        </div>
                        <div>
                            <Label htmlFor="sort_order">Urutan Tampil</Label>
                            <Input
                                id="sort_order"
                                type="number"
                                min={0}
                                value={form.data.sort_order}
                                onChange={(event) => form.setData('sort_order', Number(event.target.value))}
                            />
                            {form.errors.sort_order && (
                                <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{form.errors.sort_order}</p>
                            )}
                        </div>
                        <div className="flex items-center">
                            <label className="mt-6 flex select-none items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                                <input
                                    type="checkbox"
                                    checked={form.data.is_active}
                                    onChange={(event) => form.setData('is_active', event.target.checked)}
                                    className="h-4 w-4 rounded border-slate-300 bg-white text-brand-600 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-950"
                                />
                                Modul aktif
                            </label>
                        </div>
                        <div className="sm:col-span-2">
                            <Label htmlFor="description">Deskripsi</Label>
                            <Textarea
                                id="description"
                                rows={3}
                                value={form.data.description}
                                onChange={(event) => form.setData('description', event.target.value)}
                                placeholder="Deskripsi singkat tentang modul ini..."
                            />
                            {form.errors.description && (
                                <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{form.errors.description}</p>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Link href="/admin/modules" className="btn-secondary">
                            Batal
                        </Link>
                        <Button type="submit" disabled={form.processing}>
                            <Save size={16} /> {form.processing ? 'Menyimpan...' : 'Simpan'}
                        </Button>
                    </div>
                </Card>
            </form>
        </AdminLayout>
    );
}
