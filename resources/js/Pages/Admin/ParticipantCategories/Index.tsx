import { Link, router } from '@inertiajs/react';
import { Plus, Trash2 } from 'lucide-react';
import { AdminLayout } from '../../../layouts/AdminLayout';
import { Badge, Card, EmptyState } from '../../../components/ui';

interface CategoryItem {
    id: number;
    name: string;
    code: string;
    description: string | null;
    is_active: boolean;
    participants_count: number;
}

interface Paginator {
    data: CategoryItem[];
    current_page: number;
    last_page: number;
    prev_page_url: string | null;
    next_page_url: string | null;
    total: number;
}

export default function ParticipantCategoriesIndex({ categories }: { categories: Paginator }) {
    const remove = (category: CategoryItem) => {
        if (window.confirm(`Hapus kategori ${category.name}? Peserta akan dilepas dari kategori ini.`)) {
            router.delete(`/admin/participant-categories/${category.id}`, { preserveScroll: true });
        }
    };

    return (
        <AdminLayout
            title="Kategori Peserta"
            subtitle="Kelola kategori untuk penugasan peserta ke ujian"
            actions={
                <Link href="/admin/participant-categories/create" className="btn-primary h-10 px-3">
                    <Plus size={16} /> Tambah Kategori
                </Link>
            }
        >
            <Card>
                {categories.data.length === 0 ? (
                    <EmptyState>Belum ada kategori. Klik &quot;Tambah Kategori&quot; untuk memulai.</EmptyState>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                    <th className="pb-2">Nama</th>
                                    <th className="pb-2">Kode</th>
                                    <th className="pb-2">Jumlah Peserta</th>
                                    <th className="pb-2">Status</th>
                                    <th className="pb-2 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {categories.data.map((category) => (
                                    <tr key={category.id}>
                                        <td className="py-2">
                                            <p className="font-medium text-slate-900 dark:text-white">{category.name}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                {category.description ?? '-'}
                                            </p>
                                        </td>
                                        <td className="py-2 font-mono text-xs text-slate-700 dark:text-slate-300">
                                            {category.code}
                                        </td>
                                        <td className="py-2 text-slate-700 dark:text-slate-300">
                                            {category.participants_count} peserta
                                        </td>
                                        <td className="py-2">
                                            <Badge tone={category.is_active ? 'green' : 'slate'}>
                                                {category.is_active ? 'Aktif' : 'Nonaktif'}
                                            </Badge>
                                        </td>
                                        <td className="py-2">
                                            <div className="flex justify-end gap-3">
                                                <Link
                                                    href={`/admin/participant-categories/${category.id}/edit`}
                                                    className="rounded-md p-2 text-xs font-semibold text-brand-600 transition hover:bg-brand-50 hover:text-brand-700 dark:text-brand-300 dark:hover:bg-brand-500/10"
                                                >
                                                    Edit
                                                </Link>
                                                <button
                                                    type="button"
                                                    onClick={() => remove(category)}
                                                    className="rounded-md p-2 text-rose-600 transition hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-500/10"
                                                    aria-label="Hapus"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="mt-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>
                        Halaman {categories.current_page} dari {categories.last_page}
                    </span>
                    <div className="flex gap-2">
                        {categories.prev_page_url && (
                            <Link
                                href={categories.prev_page_url}
                                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                            >
                                Sebelumnya
                            </Link>
                        )}
                        {categories.next_page_url && (
                            <Link
                                href={categories.next_page_url}
                                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                            >
                                Berikutnya
                            </Link>
                        )}
                    </div>
                </div>
            </Card>
        </AdminLayout>
    );
}
