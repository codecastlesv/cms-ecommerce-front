'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import {
    ShieldCheck, Key, Plus, Trash2, Crown, CheckCircle2,
    Search, Lock, Edit, AlertCircle
} from 'lucide-react';
import { useConfirm } from '@/components/providers/ConfirmDialogProvider';
import { toast } from 'sonner';
import PermissionGate from '@/components/auth/PermissionGate';
import Can from '@/components/auth/Can';
import Badge from '@/components/ui/Badge';
import Pagination from '@/components/ui/Pagination';

export default function RolesAndPermissionsPage() {
    const [activeTab, setActiveTab] = useState<'roles' | 'permissions'>('roles');
    const confirm = useConfirm();


    const [permSearch, setPermSearch] = useState('');
    const [permPage, setPermPage] = useState(1);
    const [permModuleFilter, setPermModuleFilter] = useState('all');
    const ITEMS_PER_PAGE = 10;


    const { data: rolesData, isLoading: loadingRoles, refetch: refetchRoles } = useQuery({
        queryKey: ['roles'],
        queryFn: async () => {
            const { data } = await api.get('/admin/roles');
            return data.data;
        }
    });


    const { data: permissionsData, isLoading: loadingPerms, refetch: refetchPerms } = useQuery({
        queryKey: ['permissions'],
        queryFn: async () => {
            const { data } = await api.get('/admin/permissions');
            return data.map((p: any) => {
                const parts = p.name.split('_');
                return {
                    ...p,
                    group: parts.length > 1 ? parts.slice(1).join('_') : 'sistema'
                };
            });
        },
        enabled: activeTab === 'permissions'
    });

    const { paginatedPerms, totalPages, modulesList, meta } = useMemo(() => {
        if (!permissionsData) return { paginatedPerms: [], totalPages: 0, modulesList: [], meta: null };

        const modules = Array.from(new Set(permissionsData.map((p: any) => p.group))).sort() as string[];

        let filtered = permissionsData.filter((p: any) =>
            p.name.toLowerCase().includes(permSearch.toLowerCase())
        );

        if (permModuleFilter !== 'all') {
            filtered = filtered.filter((p: any) => p.group === permModuleFilter);
        }

        const total = filtered.length;
        const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
        const from = (permPage - 1) * ITEMS_PER_PAGE;
        const to = Math.min(from + ITEMS_PER_PAGE, total);
        const slice = filtered.slice(from, to);

        const metaObj = {
            data: slice,
            current_page: permPage,
            last_page: totalPages,
            per_page: ITEMS_PER_PAGE,
            from: from + 1,
            to: to,
            total: total
        };

        return { paginatedPerms: slice, totalPages, modulesList: modules, meta: metaObj };
    }, [permissionsData, permSearch, permModuleFilter, permPage]);


    const handleDeleteRole = (roleId: number, roleName: string) => {
        confirm({
            title: '¿Eliminar Rol?',
            message: `Al eliminar "${roleName}", los usuarios asociados perderán estos permisos.`,
            confirmText: 'Sí, eliminar',
            variant: 'danger',
            onConfirm: async () => {
                try {
                    await api.delete(`/admin/roles/${roleId}`);
                    toast.success('Rol eliminado');
                    refetchRoles();
                } catch (error: any) {
                    toast.error(error.response?.data?.message || 'Error');
                }
            }
        });
    };

    const handleDeletePermission = (id: number) => {
        confirm({
            title: '¿Eliminar Permiso?',
            message: 'Si el código usa este permiso, podría haber errores.',
            variant: 'danger',
            onConfirm: async () => {
                try {
                    await api.delete(`/admin/permissions/${id}`);
                    toast.success('Permiso eliminado');
                    refetchPerms();
                } catch (e) { toast.error('Error al eliminar'); }
            }
        });
    };

    const [newPermName, setNewPermName] = useState('');
    const handleCreatePermission = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPermName.trim()) return;
        try {
            await api.post('/admin/permissions', { name: newPermName });
            toast.success('Permiso creado');
            setNewPermName('');
            refetchPerms();
        } catch (error: any) {
            toast.error('Error al crear permiso');
        }
    };

    return (
        <PermissionGate permission="view_roles">
            <div className="max-w-7xl mx-auto pb-20 p-6">

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Acceso y Seguridad</h1>
                        <p className="text-sm text-slate-500">Gestión de Roles y Permisos del sistema.</p>
                    </div>
                    <div className="bg-slate-100 p-1 rounded-xl inline-flex">
                        <button onClick={() => setActiveTab('roles')} className={`flex items-center px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'roles' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                            <ShieldCheck className="w-4 h-4 mr-2" /> Roles
                        </button>
                        <button onClick={() => setActiveTab('permissions')} className={`flex items-center px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'permissions' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                            <Key className="w-4 h-4 mr-2" /> Permisos
                        </button>
                    </div>
                </div>

                {activeTab === 'roles' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex justify-end mb-6">
                            <Can permission="create_roles">
                                <Link href="/roles/create" className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center shadow-lg hover:bg-slate-800 transition">
                                    <Plus className="w-4 h-4 mr-2" /> Nuevo Rol
                                </Link>
                            </Can>
                        </div>

                        {loadingRoles ? <div className="text-center py-20 text-slate-400">Cargando...</div> : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {rolesData?.map((role: any) => {
                                    const isRoot = role.name === 'Admin';
                                    return (
                                        <div key={role.id} className={`relative group rounded-2xl p-6 border transition-all hover:shadow-lg ${isRoot ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-200 hover:border-blue-200'}`}>
                                            {isRoot && <Crown className="absolute top-4 right-4 w-5 h-5 text-purple-300" />}
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className={`p-3 rounded-xl ${isRoot ? 'bg-purple-600 text-white' : 'bg-blue-50 text-blue-600'}`}>
                                                    {isRoot ? <Crown className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-lg text-slate-900">{role.name}</h3>
                                                    <span className="text-xs font-medium text-slate-400">{role.users_count || 0} Usuarios</span>
                                                </div>
                                            </div>
                                            <div className="h-16 mb-4 overflow-hidden">
                                                {isRoot ? (
                                                    <div className="flex items-center gap-2 text-purple-700 text-xs font-bold bg-purple-50 p-2 rounded-lg border border-purple-100">
                                                        <CheckCircle2 className="w-4 h-4" /> Acceso Total
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-wrap gap-1">
                                                        {role.permissions?.slice(0, 5).map((p: any) => (
                                                            <span key={p.id} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200">{p.name.split('_')[0]}</span>
                                                        ))}
                                                        {role.permissions?.length > 5 && <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-1 rounded font-bold">+{role.permissions.length - 5}</span>}
                                                        {(!role.permissions?.length) && <span className="text-xs text-slate-400 italic">Sin permisos</span>}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                                                <Can permission="edit_roles" fallback={<span className="p-2 text-slate-300"><Lock className="w-4 h-4" /></span>}>
                                                    <Link href={`/roles/${role.id}`} className="flex items-center px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition">
                                                        <Edit className="w-3.5 h-3.5 mr-1.5" /> {isRoot ? 'Ver' : 'Configurar'}
                                                    </Link>
                                                </Can>
                                                {!isRoot && (
                                                    <Can permission="delete_roles">
                                                        <button onClick={() => handleDeleteRole(role.id, role.name)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 className="w-4 h-4" /></button>
                                                    </Can>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'permissions' && (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">

                        <div className="p-4 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl space-y-4">
                            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                                <div className="relative w-full md:w-64">
                                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text" placeholder="Buscar permiso..."
                                        className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 bg-white"
                                        value={permSearch}
                                        onChange={(e) => { setPermSearch(e.target.value); setPermPage(1); }}
                                    />
                                </div>
                                <Can permission="manage_settings">
                                    <form onSubmit={handleCreatePermission} className="flex w-full md:w-auto gap-2">
                                        <input
                                            type="text" placeholder="ej: export_data"
                                            className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none font-mono"
                                            value={newPermName} onChange={(e) => setNewPermName(e.target.value)}
                                        />
                                        <button type="submit" disabled={!newPermName} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-800 disabled:opacity-50">
                                            <Plus className="w-4 h-4 inline mr-1" /> Add
                                        </button>
                                    </form>
                                </Can>
                            </div>

                            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                                <button
                                    onClick={() => { setPermModuleFilter('all'); setPermPage(1); }}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition
                                        ${permModuleFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                                >
                                    Todos
                                </button>
                                {modulesList.map(mod => (
                                    <button
                                        key={mod}
                                        onClick={() => { setPermModuleFilter(mod); setPermPage(1); }}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap capitalize transition
                                            ${permModuleFilter === mod ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                                    >
                                        {mod}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="min-h-[300px]">
                            {loadingPerms ? <div className="p-10 text-center text-slate-400">Cargando...</div> : (
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                                        <tr>
                                            <th className="px-6 py-3">Módulo</th>
                                            <th className="px-6 py-3">Clave del Permiso</th>
                                            <th className="px-6 py-3 text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {paginatedPerms.length > 0 ? (
                                            paginatedPerms.map((perm: any) => (
                                                <tr key={perm.id} className="group hover:bg-slate-50/50">
                                                    <td className="px-6 py-3">
                                                        <Badge variant="neutral" className="capitalize">{perm.group}</Badge>
                                                    </td>
                                                    <td className="px-6 py-3 font-mono font-medium text-slate-700">{perm.name}</td>
                                                    <td className="px-6 py-3 text-right">
                                                        <Can permission="manage_settings">
                                                            <button onClick={() => handleDeletePermission(perm.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </Can>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={3} className="text-center py-10 text-slate-400">
                                                    No se encontraron permisos.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        <Pagination
                            meta={meta}
                            onPageChange={(page) => setPermPage(page)}
                        />
                    </div>
                )}
            </div>
        </PermissionGate>
    );
}