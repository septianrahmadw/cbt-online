import { Link, router } from '@inertiajs/react';
import { Layers, Plus, Trash2 } from 'lucide-react';
import { AdminLayout } from '../../../layouts/AdminLayout';
import { Badge, Card, EmptyState } from '../../../components/ui';
import { moduleColorLabel, moduleGradient, moduleTone } from '../../../lib/moduleColors';

export interface ModuleCard {
    id: number;
    name: string;
    code: string;
    color: string;
    sort_order: number;
    is_active: boolean;
    description: string | null;
    questions_count: number;
    exams_count: number;
}

export default function ModulesIndex({ modules }: { modules: ModuleCard[] }) {
    const remove = (module: ModuleCard) => {
        if (window.confirm(`Hapus modul ${module.name}? Soal terkait tidak ikut dihapus.`)) {
            router.delete(`/admin/modules/${module.id}`, { preserveScroll: true });
        }
    };

    return (
        <AdminLayout
            title="Modul Soal"
            subtitle="Kelola kategori/tipe soal untuk bank soal"
            actions={
                <Link href="/admin/modules/create" className="btn-primary h-10 px-3">
                    <Plus size={16} /> Tambah Modul
                </Link>
            }
        >
            {modules.length === 0 ? (
                <Card>
                    <EmptyState>Belum ada modul. Klik "Tambah Modul" untuk memulai.</EmptyState>
                </Card>
            ) : (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {modules.map((module) => (
                        <div
                            key={module.id}
                            className="card flex flex-col overflow-hidden transition-shadow hover:shadow-md"
                        >
                            <div
                                className="relative p-5"
                                style={{ background: moduleGradient(module.color) }}
                            >
                                <div className="pointer-events-none absolute inset-0 opacity-10">
                                    <svg viewBox="0 0 400 200" fill="none" className="h-full w-full">
                                        <rect x="30" y="40" width="90" height="60" rx="8" fill="white" />
                                        <rect x="150" y="30" width="70" height="70" rx="8" fill="white" />
                                        <rect x="250" y="50" width="80" height="50" rx="8" fill="white" />
                                    </svg>
                                </div>
                                <div className="relative flex items-start justify-between gap-3">
                                    <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                                        {module.questions_count} soal
                                    </span>
                                    <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs font-bold text-white">
                                        {module.is_active ? 'Aktif' : 'Nonaktif'}
                                    </span>
                                </div>
                                <h3 className="relative mt-3 text-xl font-bold text-white drop-shadow">
                                    {module.name}
                                </h3>
                                <p className="relative mt-1 font-mono text-sm text-white/80">{module.code}</p>
                            </div>

                            <div className="flex flex-1 flex-col p-5">
                                <p className="mb-4 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">
                                    {module.description || 'Belum ada deskripsi.'}
                                </p>
                                <div className="mb-4 flex flex-wrap gap-1.5">
                                    <Badge tone={moduleTone(module.color)}>{moduleColorLabel(module.color)}</Badge>
                                    <Badge tone="slate">{module.exams_count} ujian pemakai</Badge>
                                </div>
                                <div className="mt-auto flex gap-2">
                                    <Link
                                        href={`/admin/modules/${module.id}`}
                                        className="btn-primary flex-1 py-2 text-center text-xs"
                                    >
                                        Lihat Detail
                                    </Link>
                                    <Link
                                        href={`/admin/modules/${module.id}/edit`}
                                        className="btn-secondary py-2 text-xs"
                                    >
                                        Edit
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={() => remove(module)}
                                        className="btn-ghost px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-500/10 dark:hover:text-rose-300"
                                        aria-label={`Hapus modul ${module.name}`}
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <p className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                <Layers size={14} /> Modul digunakan untuk mengelompokkan soal-soal di Bank Soal.
            </p>
        </AdminLayout>
    );
}
