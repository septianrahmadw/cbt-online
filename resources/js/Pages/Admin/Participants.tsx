import { Link, router, useForm } from '@inertiajs/react';
import { Download, Pencil, Plus, Search, Trash2, Upload } from 'lucide-react';
import { useState } from 'react';
import { Alert, Badge, Button, Card, EmptyState, Input, Label, Modal } from '../../components/ui';
import { AdminLayout } from '../../layouts/AdminLayout';

interface Participant {
    id: number;
    exam_number: string;
    full_name: string;
    nisn: string | null;
    class_name: string | null;
    is_active: boolean;
    results_count: number;
}

interface Paginator {
    data: Participant[];
    current_page: number;
    last_page: number;
    prev_page_url: string | null;
    next_page_url: string | null;
    total: number;
}

export default function Participants({
    participants,
    filters,
}: {
    participants: Paginator;
    filters: { search: string };
}) {
    const [search, setSearch] = useState(filters.search);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Participant | null>(null);

    const form = useForm({
        exam_number: '',
        full_name: '',
        nisn: '',
        class_name: '',
        is_active: true,
    });

    const importer = useForm<{ file: File | null }>({ file: null });

    const openCreate = () => {
        setEditing(null);
        form.reset();
        form.clearErrors();
        setModalOpen(true);
    };

    const openEdit = (participant: Participant) => {
        setEditing(participant);
        form.setData({
            exam_number: participant.exam_number,
            full_name: participant.full_name,
            nisn: participant.nisn ?? '',
            class_name: participant.class_name ?? '',
            is_active: participant.is_active,
        });
        form.clearErrors();
        setModalOpen(true);
    };

    const submit = (event: React.FormEvent) => {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                setModalOpen(false);
                form.reset();
            },
        };

        if (editing) {
            form.put(`/admin/participants/${editing.id}`, options);
        } else {
            form.post('/admin/participants', options);
        }
    };

    const remove = (participant: Participant) => {
        if (window.confirm(`Hapus peserta ${participant.full_name}?`)) {
            router.delete(`/admin/participants/${participant.id}`, { preserveScroll: true });
        }
    };

    const runSearch = (event: React.FormEvent) => {
        event.preventDefault();
        router.get('/admin/participants', { search }, { preserveState: true, replace: true });
    };

    const importCsv = (event: React.FormEvent) => {
        event.preventDefault();
        importer.post('/admin/participants/import', {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => importer.reset(),
        });
    };

    return (
        <AdminLayout
            title="Manajemen Peserta"
            subtitle={`${participants.total} peserta terdaftar.`}
            actions={
                <>
                    <a
                        href="/admin/participants/template"
                        className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                        <Download size={16} /> Template CSV
                    </a>
                    <Button onClick={openCreate}>
                        <Plus size={16} /> Tambah Peserta
                    </Button>
                </>
            }
        >
            <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
                <Card>
                    <form onSubmit={runSearch} className="mb-4 flex gap-2">
                        <div className="relative flex-1">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                            <Input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Cari nama, nomor peserta, atau NISN..."
                                className="pl-9"
                            />
                        </div>
                        <Button type="submit" variant="secondary">
                            Cari
                        </Button>
                    </form>

                    {participants.data.length === 0 ? (
                        <EmptyState>Belum ada peserta. Tambahkan manual atau import CSV.</EmptyState>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                        <th className="pb-2">No Peserta</th>
                                        <th className="pb-2">Nama</th>
                                        <th className="pb-2">Kelas</th>
                                        <th className="pb-2">Status</th>
                                        <th className="pb-2 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {participants.data.map((participant) => (
                                        <tr key={participant.id}>
                                            <td className="py-2 font-mono text-xs text-slate-700 dark:text-slate-300">{participant.exam_number}</td>
                                            <td className="py-2">
                                                <p className="font-medium text-slate-900 dark:text-white">{participant.full_name}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">{participant.nisn ?? '-'}</p>
                                            </td>
                                            <td className="py-2 text-slate-700 dark:text-slate-300">{participant.class_name ?? '-'}</td>
                                            <td className="py-2">
                                                <Badge tone={participant.is_active ? 'green' : 'slate'}>
                                                    {participant.is_active ? 'Aktif' : 'Nonaktif'}
                                                </Badge>
                                            </td>
                                            <td className="py-2">
                                                <div className="flex justify-end gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => openEdit(participant)}
                                                        className="rounded-md p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                                                        aria-label="Edit"
                                                    >
                                                        <Pencil size={15} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => remove(participant)}
                                                        className="rounded-md p-2 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-rose-500/10 dark:hover:text-rose-300"
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
                            Halaman {participants.current_page} dari {participants.last_page}
                        </span>
                        <div className="flex gap-2">
                            {participants.prev_page_url && (
                                <Link href={participants.prev_page_url} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
                                    Sebelumnya
                                </Link>
                            )}
                            {participants.next_page_url && (
                                <Link href={participants.next_page_url} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
                                    Berikutnya
                                </Link>
                            )}
                        </div>
                    </div>
                </Card>

                <Card className="h-fit">
                    <h2 className="mb-1 text-sm font-semibold text-slate-900 dark:text-white">Import Massal</h2>
                    <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
                        Unggah file CSV dengan header: exam_number, full_name, nisn, class_name.
                    </p>
                    <form onSubmit={importCsv} className="space-y-3">
                        <input
                            type="file"
                            accept=".csv,text/csv"
                            onChange={(event) => importer.setData('file', event.target.files?.[0] ?? null)}
                            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:text-slate-700 dark:text-slate-400 dark:file:bg-slate-800 dark:file:text-slate-200"
                        />
                        {importer.errors.file && <Alert tone="error">{importer.errors.file}</Alert>}
                        <Button type="submit" className="w-full" disabled={importer.processing || !importer.data.file}>
                            <Upload size={16} /> {importer.processing ? 'Mengunggah...' : 'Import CSV'}
                        </Button>
                    </form>
                </Card>
            </div>

            <Modal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editing ? 'Edit Peserta' : 'Tambah Peserta'}
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setModalOpen(false)} type="button">
                            Batal
                        </Button>
                        <Button type="submit" form="participant-form" disabled={form.processing}>
                            Simpan
                        </Button>
                    </>
                }
            >
                <form id="participant-form" onSubmit={submit} className="space-y-3">
                    <div>
                        <Label htmlFor="exam_number">Nomor Peserta</Label>
                        <Input
                            id="exam_number"
                            value={form.data.exam_number}
                            onChange={(event) => form.setData('exam_number', event.target.value)}
                            required
                        />
                        {form.errors.exam_number && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{form.errors.exam_number}</p>}
                    </div>
                    <div>
                        <Label htmlFor="full_name">Nama Lengkap</Label>
                        <Input
                            id="full_name"
                            value={form.data.full_name}
                            onChange={(event) => form.setData('full_name', event.target.value)}
                            required
                        />
                        {form.errors.full_name && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{form.errors.full_name}</p>}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                            <Label htmlFor="nisn">NISN / ID</Label>
                            <Input
                                id="nisn"
                                value={form.data.nisn}
                                onChange={(event) => form.setData('nisn', event.target.value)}
                            />
                        </div>
                        <div>
                            <Label htmlFor="class_name">Kelas</Label>
                            <Input
                                id="class_name"
                                value={form.data.class_name}
                                onChange={(event) => form.setData('class_name', event.target.value)}
                            />
                        </div>
                    </div>
                    <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                        <input
                            type="checkbox"
                            checked={form.data.is_active}
                            onChange={(event) => form.setData('is_active', event.target.checked)}
                            className="h-4 w-4 rounded border-slate-300 bg-white text-brand-600 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-950"
                        />
                        Peserta aktif
                    </label>
                </form>
            </Modal>
        </AdminLayout>
    );
}
