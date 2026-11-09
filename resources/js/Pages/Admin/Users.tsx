import { router, useForm } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { AdminLayout } from '../../layouts/AdminLayout';
import { Badge, Button, Card, EmptyState, Input, Label, Modal, Select } from '../../components/ui';
import type { UserRole } from '../../types/shared';

interface UserItem {
    id: number;
    name: string;
    email: string;
    role: UserRole;
    role_label: string;
    is_active: boolean;
    is_self: boolean;
    last_login_at: string | null;
    created_at: string | null;
}

interface RoleOption {
    value: UserRole;
    label: string;
}

interface UserForm {
    name: string;
    email: string;
    role: UserRole;
    password: string;
    is_active: boolean;
}

const emptyForm: UserForm = {
    name: '',
    email: '',
    role: 'dosen',
    password: '',
    is_active: true,
};

export default function Users({ users, roles }: { users: UserItem[]; roles: RoleOption[] }) {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<UserItem | null>(null);
    const form = useForm<UserForm>(emptyForm);

    const openCreate = () => {
        setEditing(null);
        form.setData(emptyForm);
        form.clearErrors();
        setOpen(true);
    };

    const openEdit = (user: UserItem) => {
        setEditing(user);
        form.setData({
            name: user.name,
            email: user.email,
            role: user.role,
            password: '',
            is_active: user.is_active,
        });
        form.clearErrors();
        setOpen(true);
    };

    const close = () => {
        setOpen(false);
        setEditing(null);
    };

    const submit = (event: React.FormEvent) => {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => close(),
        };

        if (editing) {
            form.put(`/admin/users/${editing.id}`, options);
        } else {
            form.post('/admin/users', options);
        }
    };

    const remove = (user: UserItem) => {
        if (window.confirm(`Hapus user ${user.name}? Tindakan ini tidak dapat dibatalkan.`)) {
            router.delete(`/admin/users/${user.id}`, { preserveScroll: true });
        }
    };

    return (
        <AdminLayout
            title="Manajemen User"
            subtitle="Kelola akun admin, dosen, dan pengawas beserta hak aksesnya"
            actions={
                <Button onClick={openCreate}>
                    <Plus size={16} /> Tambah User
                </Button>
            }
        >
            <Card>
                {users.length === 0 ? (
                    <EmptyState>Belum ada user. Klik &quot;Tambah User&quot; untuk memulai.</EmptyState>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                    <th className="pb-2">User</th>
                                    <th className="pb-2">Role</th>
                                    <th className="pb-2">Status</th>
                                    <th className="pb-2">Login Terakhir</th>
                                    <th className="pb-2 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {users.map((user) => (
                                    <tr key={user.id}>
                                        <td className="py-2">
                                            <p className="font-medium text-slate-900 dark:text-white">
                                                {user.name}
                                                {user.is_self && (
                                                    <span className="ml-2 text-xs font-normal text-slate-500 dark:text-slate-400">
                                                        (Anda)
                                                    </span>
                                                )}
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                                        </td>
                                        <td className="py-2">
                                            <Badge tone={user.role === 'admin' ? 'indigo' : 'blue'}>
                                                {user.role_label}
                                            </Badge>
                                        </td>
                                        <td className="py-2">
                                            <Badge tone={user.is_active ? 'green' : 'slate'}>
                                                {user.is_active ? 'Aktif' : 'Nonaktif'}
                                            </Badge>
                                        </td>
                                        <td className="py-2 text-slate-700 dark:text-slate-300">
                                            {user.last_login_at
                                                ? new Date(user.last_login_at).toLocaleString('id-ID')
                                                : 'Belum pernah'}
                                        </td>
                                        <td className="py-2">
                                            <div className="flex justify-end gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => openEdit(user)}
                                                    className="rounded-md p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                                                    aria-label="Edit"
                                                >
                                                    <Pencil size={15} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => remove(user)}
                                                    disabled={user.is_self}
                                                    className="rounded-md p-2 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-400 dark:hover:bg-rose-500/10 dark:hover:text-rose-300"
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
            </Card>

            <Modal
                open={open}
                onClose={close}
                title={editing ? 'Edit User' : 'Tambah User'}
                footer={
                    <>
                        <Button type="button" variant="secondary" onClick={close}>
                            Batal
                        </Button>
                        <Button type="submit" form="user-form" disabled={form.processing}>
                            {form.processing ? 'Menyimpan...' : 'Simpan'}
                        </Button>
                    </>
                }
            >
                <form id="user-form" onSubmit={submit} className="space-y-4">
                    <div>
                        <Label htmlFor="user-name">Nama</Label>
                        <Input
                            id="user-name"
                            value={form.data.name}
                            onChange={(event) => form.setData('name', event.target.value)}
                            required
                        />
                        {form.errors.name && (
                            <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{form.errors.name}</p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="user-email">Email</Label>
                        <Input
                            id="user-email"
                            type="email"
                            value={form.data.email}
                            onChange={(event) => form.setData('email', event.target.value)}
                            required
                        />
                        {form.errors.email && (
                            <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{form.errors.email}</p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="user-role">Role</Label>
                        <Select
                            id="user-role"
                            value={form.data.role}
                            onChange={(event) => form.setData('role', event.target.value as UserRole)}
                            disabled={editing?.is_self}
                        >
                            {roles.map((role) => (
                                <option key={role.value} value={role.value}>
                                    {role.label}
                                </option>
                            ))}
                        </Select>
                        {form.errors.role && (
                            <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{form.errors.role}</p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="user-password">
                            Password {editing ? <span className="font-normal text-slate-400">(kosongkan jika tidak diubah)</span> : null}
                        </Label>
                        <Input
                            id="user-password"
                            type="password"
                            value={form.data.password}
                            onChange={(event) => form.setData('password', event.target.value)}
                            required={!editing}
                            autoComplete="new-password"
                        />
                        {form.errors.password && (
                            <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{form.errors.password}</p>
                        )}
                    </div>

                    <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                        <input
                            type="checkbox"
                            checked={form.data.is_active}
                            onChange={(event) => form.setData('is_active', event.target.checked)}
                            disabled={editing?.is_self}
                            className="h-4 w-4 rounded border-slate-300 bg-white text-brand-600 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-950"
                        />
                        Akun aktif dan boleh login
                    </label>
                </form>
            </Modal>
        </AdminLayout>
    );
}
