'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import api from '@/lib/axios';
import { toast } from 'sonner';
import {
    Edit, Trash2, UserPlus, Search, Shield, Phone, Clock,
    Filter, AlertCircle, Lock, ArrowUp, ArrowDown, Mail
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Pagination from '@/components/ui/Pagination';
import { useConfirm } from '@/components/providers/ConfirmDialogProvider';
import { useRoles } from '@/hooks/useRoles';
import { useDebounce } from '@/hooks/useDebounce';
import Can from '@/components/auth/Can';
import { User, Role, PaginatedResponse } from '@/types';
import { formatDate } from '@/utils/date';
import { formatTime } from '@/utils/time';

interface AxiosErrorType {
    response?: { data?: { message?: string } };
    message?: string;
}

export default function UserList() {
    const [page, setPage] = useState<number>(1);
    const [search, setSearch] = useState<string>('');
    const debouncedSearch = useDebounce(search, 500);

    const [roleFilter, setRoleFilter] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('');

    const [sortField, setSortField] = useState<string>('created_at');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    const confirm = useConfirm();
    const { data: roles } = useRoles();

    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, roleFilter, statusFilter]);

    const { data, isLoading, isError, error, refetch } = useQuery<PaginatedResponse<User>, AxiosErrorType>({
        queryKey: ['users', page, debouncedSearch, roleFilter, statusFilter, sortField, sortDirection],
        queryFn: async () => {
            const params = new URLSearchParams();
            params.append('page', page.toString());
            params.append('sort_by', sortField);
            params.append('sort_dir', sortDirection);

            if (debouncedSearch) params.append('search', debouncedSearch);
            if (roleFilter) params.append('role', roleFilter);
            if (statusFilter) params.append('status', statusFilter);

            const res = await api.get<PaginatedResponse<User>>(`/admin/users?${params.toString()}`);
            return res.data;
        },
        retry: 1,
        placeholderData: (prev) => prev
    });

    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const handleDelete = (id: number) => {
        confirm({
            title: '¿Eliminar Usuario?',
            message: 'Esta acción es irreversible y podría afectar registros de auditoría.',
            variant: 'danger',
            confirmText: 'Sí, Eliminar',
            onConfirm: async () => {
                try {
                    await api.delete(`/admin/users/${id}`);
                    toast.success('Usuario eliminado correctamente');
                    refetch();
                } catch (error) {
                    const err = error as AxiosErrorType;
                    toast.error(err.response?.data?.message || 'Error al eliminar usuario');
                }
            }
        });
    };

    const SortIcon = ({ field }: { field: string }) => {
        if (sortField !== field) return <div className="w-3 h-3" />;
        return sortDirection === 'asc'
            ? <ArrowUp className="w-3 h-3 text-blue-500" />
            : <ArrowDown className="w-3 h-3 text-blue-500" />;
    };

    if (isLoading && !data) return (
        <div className="flex justify-center items-center h-64 text-slate-400 animate-pulse">
            Cargando usuarios...
        </div>
    );

    if (isError) return (
        <div className="p-8 text-center text-red-500 bg-red-50 rounded-xl border border-red-100 m-6">
            <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="font-bold">Error al cargar el listado</p>
            <p className="text-sm opacity-80">{error?.response?.data?.message || error?.message}</p>
            <button onClick={() => refetch()} className="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 rounded-lg text-sm font-bold transition">
                Reintentar
            </button>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6">

            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Directorio de Usuarios</h1>
                    <p className="text-sm text-slate-500 mt-1">Gestiona el personal, roles y permisos de acceso.</p>
                </div>

                <div className="flex flex-wrap gap-3 w-full xl:w-auto items-center bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">

                    <div className="relative flex-1 min-w-[220px]">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o email..."
                            className="w-full pl-9 pr-4 py-2 border-0 bg-transparent text-sm outline-none focus:ring-0 placeholder:text-slate-400"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="w-px h-6 bg-slate-200 hidden sm:block"></div>

                    <div className="relative min-w-[140px]">
                        <Filter className="absolute left-3 top-2.5 w-3 h-3 text-slate-400" />
                        <select
                            className="w-full pl-8 pr-4 py-2 text-xs font-medium bg-transparent border-0 outline-none cursor-pointer text-slate-600 focus:text-slate-900"
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                        >
                            <option value="">Todos los Roles</option>
                            {roles?.map((r: Role) => (
                                <option key={r.id} value={r.name}>{r.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="relative min-w-[130px]">
                        <div className={`absolute left-3 top-3.5 w-2 h-2 rounded-full ${statusFilter === 'active' ? 'bg-green-500' : statusFilter === 'disabled' ? 'bg-red-500' : 'bg-slate-300'}`}></div>
                        <select
                            className="w-full pl-7 pr-4 py-2 text-xs font-medium bg-transparent border-0 outline-none cursor-pointer text-slate-600 focus:text-slate-900"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="">Estado: Todos</option>
                            <option value="active">Activos</option>
                            <option value="disabled">Inactivos</option>
                        </select>
                    </div>

                    <Can permission="create_users">
                        <Link
                            href="/users/create"
                            className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center hover:bg-slate-800 shadow-lg shadow-slate-900/10 transition active:scale-95 ml-auto sm:ml-0"
                        >
                            <UserPlus className="w-4 h-4 mr-2" /> Nuevo
                        </Link>
                    </Can>
                </div>
            </div>

            <Card className="overflow-hidden border border-slate-200 shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition select-none" onClick={() => handleSort('name')}>
                                    <div className="flex items-center gap-2">Usuario <SortIcon field="name" /></div>
                                </th>
                                <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition select-none" onClick={() => handleSort('role')}>
                                    <div className="flex items-center gap-2">Rol <SortIcon field="role" /></div>
                                </th>
                                <th className="px-6 py-4">Contacto</th>
                                <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition select-none" onClick={() => handleSort('last_login_at')}>
                                    <div className="flex items-center gap-2">Último Acceso <SortIcon field="last_login_at" /></div>
                                </th>
                                <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition select-none" onClick={() => handleSort('status')}>
                                    <div className="flex items-center gap-2">Estado <SortIcon field="status" /></div>
                                </th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 bg-white">
                            {data?.data && data.data.length > 0 ? (
                                data.data.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-50/80 transition duration-150 group">

                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    {user.image_url || user.avatar ? (
                                                        <img
                                                            src={user.image_url || user.avatar}
                                                            alt={user.name}
                                                            className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-sm"
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold border border-blue-100">
                                                            {user.name?.charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                    {user.status === 'active' && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900">{user.name}</div>
                                                    <div className="text-xs text-slate-500 flex items-center gap-1">
                                                        <Mail className="w-3 h-3" /> {user.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5">
                                                <Shield className="w-3.5 h-3.5 text-slate-400" />
                                                <span className="capitalize font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-xs border border-slate-200">
                                                    {user.role || 'Usuario'}
                                                </span>
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            {user.phone ? (
                                                <div className="flex items-center gap-1.5 text-slate-600 font-mono text-xs bg-slate-50 w-fit px-2 py-1 rounded border border-slate-100">
                                                    <Phone className="w-3 h-3 text-slate-400" />
                                                    {user.phone.toString().replace(/^503/, '').replace(/(\d{4})(\d{4})/, '$1-$2')}
                                                </div>
                                            ) : <span className="text-slate-300 italic text-xs">--</span>}
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                                {user.last_login_at ? (
                                                    <span className="font-medium">
                                                        {new Date(user.last_login_at).toLocaleDateString()}
                                                        <span className="text-slate-400 ml-1">
                                                            a las {new Date(user.last_login_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </span>
                                                ) : <span className="text-slate-400 italic">Nunca</span>}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            {user.status === 'active' ?
                                                <Badge variant="success">Activo</Badge> :
                                                <Badge variant="danger">Inactivo</Badge>
                                            }
                                        </td>

                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Can permission="edit_users" fallback={<Lock className="w-4 h-4 text-slate-200" />}>
                                                    <Link href={`/users/${user.id}`} className="p-2 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition border border-transparent hover:border-blue-100">
                                                        <Edit className="w-4 h-4" />
                                                    </Link>
                                                </Can>

                                                <Can permission="delete_users">
                                                    <button onClick={() => handleDelete(user.id)} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition border border-transparent hover:border-red-100">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </Can>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="text-center py-20 text-slate-400">
                                        <div className="flex flex-col items-center justify-center">
                                            <Search className="w-10 h-10 mb-3 opacity-20" />
                                            <p>No se encontraron usuarios con estos filtros.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {data && <Pagination meta={data} onPageChange={setPage} />}
            </Card>
        </div>
    );
}