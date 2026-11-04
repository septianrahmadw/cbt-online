import { Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import { AdminLayout } from '../../../layouts/AdminLayout';
import { Button, Card, Input, Label, Textarea } from '../../../components/ui';

interface CategoryData {
    id: number;
    name: string;
    code: string;
    description: string | null;
    is_active: boolean;
}

export default function ParticipantCategoryForm({ category }: { category: CategoryData | null }) {
    const form = useForm({
        name: category?.name ?? '',
        code: category?.code ?? '',
        description: category?.description ?? '',
        is_active: category?.is_active ?? true,
    });

    const submit = (event: React.FormEvent) => {
        event.preventDefault();

        if (category) {
            form.put(`/admin/participant-categories/${category.id}`);
        } else {
            form.post('/admin/participant-categories');
        }
    };

    return (
        <AdminLayout
            title={category ? 'Edit Kategori Peserta' : 'Tambah Kategori Peserta'}
            subtitle="Kelompokkan peserta berdasarkan prodi/gelombang/kategori lain"
            actions={
                <Link
                    href="/admin/participant-categories"
                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                    <ArrowLeft size={16} /> Kembali ke Kategori Peserta
                </Link>
            }
        >
            <form onSubmit={submit}>
                <Card className="max-w-2xl space-y-4">
                    {Object.keys(form.errors).length > 0 && (
                        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200">
                            Periksa kembali isian kategori di bawah ini.
                        </p>
                    )}

                    <div className="sm:col-span-2">
                        <Label htmlFor="name">
                            Nama Kategori <span className="text-rose-500">*</span>
                        </Label>
                        <Input
                            id="name"
                            value={form.data.name}
                            onChange={(event) => form.setData('name', event.target.value)}
                            placeholder="mis. Prodi TI"
                            required
                        />
                        {form.errors.name && (
                            <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{form.errors.name}</p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="code">
                            Kode Kategori <span className="text-rose-500">*</span>
                        </Label>
                        <Input
                            id="code"
                            value={form.data.code}
                            onChange={(event) => form.setData('code', event.target.value)}
                            placeholder="prodi-ti"
                            required
                        />
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Hanya huruf kecil, angka, strip (-), dan underscore (_).
                        </p>
                        {form.errors.code && (
                            <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{form.errors.code}</p>
                        )}
                    </div>

                    <div className="flex items-center">
                        <label className="flex select-none items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                            <input
                                type="checkbox"
                                checked={form.data.is_active}
                                onChange={(event) => form.setData('is_active', event.target.checked)}
                                className="h-4 w-4 rounded border-slate-300 bg-white text-brand-600 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-950"
                            />
                            Kategori aktif
                        </label>
                    </div>

                    <div className="sm:col-span-2">
                        <Label htmlFor="description">Deskripsi</Label>
                        <Textarea
                            id="description"
                            rows={3}
                            value={form.data.description}
                            onChange={(event) => form.setData('description', event.target.value)}
                            placeholder="Deskripsi singkat kategori peserta..."
                        />
                        {form.errors.description && (
                            <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{form.errors.description}</p>
                        )}
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Link href="/admin/participant-categories" className="btn-secondary">
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
