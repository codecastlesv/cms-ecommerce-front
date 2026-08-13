'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { ArrowLeft, Save, Shield, Check, Lock, Search, Crown } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { usePermission } from '@/hooks/usePermission';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Badge from '@/components/ui/Badge';

const roleSchema = z.object({
    name: z.string().min(3, "El nombre del rol es requerido"),
    permissions: z.array(z.string()).optional()
});

type RoleFormData = z.infer<typeof roleSchema>;

export default function RoleForm({ roleId }: { roleId?: string }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [groupedPermissions, setGroupedPermissions] = useState<Record<string, any[]>>({});
    const [moduleFilter, setModuleFilter] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [isAdminRole, setIsAdminRole] = useState(false);

    const { can } = usePermission();
    const userHasPermission = roleId ? can('edit_roles') : can('create_roles');

    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<RoleFormData>({
        resolver: zodResolver(roleSchema),
        defaultValues: { name: '', permissions: [] }
    });

    const selectedPermissions = watch('permissions') || [];

    const isFormEnabled = userHasPermission && !isAdminRole;

    useEffect(() => {
        const loadData = async () => {
            try {
                const { data: groups } = await api.get('/admin/permissions/grouped');
                setGroupedPermissions(groups);

                if (roleId) {
                    const { data: role } = await api.get(`/admin/roles/${roleId}`);
                    setValue('name', role.name);

                    if (role.name === 'Admin') {
                        setIsAdminRole(true);
                        const allSystemPermissions: string[] = [];
                        Object.values(groups).forEach((perms: any) => {
                            perms.forEach((p: any) => allSystemPermissions.push(p.name));
                        });
                        setValue('permissions', allSystemPermissions);
                    } else {
                        setValue('permissions', role.permissions);
                    }
                }
            } catch (error) {
                console.error(error);
                toast.error("Error cargando datos");
            }
        };
        loadData();
    }, [roleId, setValue]);

    const filteredGroups = useMemo(() => {
        let result = { ...groupedPermissions };
        if (moduleFilter !== 'all') {
            result = { [moduleFilter]: groupedPermissions[moduleFilter] };
        }
        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            const newResult: Record<string, any[]> = {};
            Object.entries(result).forEach(([key, perms]) => {
                const filteredPerms = perms.filter((p: any) =>
                    p.name.toLowerCase().includes(lowerSearch)
                );
                if (filteredPerms.length > 0) newResult[key] = filteredPerms;
            });
            result = newResult;
        }
        return result;
    }, [groupedPermissions, moduleFilter, searchTerm]);

    const togglePermission = (permName: string) => {
        if (!isFormEnabled) return;
        const current = selectedPermissions;
        if (current.includes(permName)) {
            setValue('permissions', current.filter(p => p !== permName));
        } else {
            setValue('permissions', [...current, permName]);
        }
    };

    const toggleGroup = (permissionsInGroup: any[]) => {
        if (!isFormEnabled) return;
        const allNames = permissionsInGroup.map(p => p.name);
        const allSelected = allNames.every(name => selectedPermissions.includes(name));
        let newSelection = [...selectedPermissions];
        if (allSelected) {
            newSelection = newSelection.filter(p => !allNames.includes(p));
        } else {
            allNames.forEach(name => {
                if (!newSelection.includes(name)) newSelection.push(name);
            });
        }
        setValue('permissions', newSelection);
    };

    const onSubmit = async (data: RoleFormData) => {
        if (!isFormEnabled) return;
        setLoading(true);
        try {
            if (roleId) {
                await api.put(`/admin/roles/${roleId}`, data);
            } else {
                await api.post('/admin/roles', data);
            }
            toast.success('Rol guardado exitosamente');
            router.push('/roles');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al guardar');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-6xl mx-auto p-6 pb-20">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button type="button" onClick={() => router.back()} className="p-2 hover:bg-white rounded-full transition"><ArrowLeft className="w-5 h-5" /></button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            {roleId ? 'Editar Rol' : 'Nuevo Rol'}
                            {isAdminRole && <Crown className="w-5 h-5 text-purple-600" />}
                        </h1>
                        {!userHasPermission && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 mt-1 text-xs font-bold text-orange-700 bg-orange-100 rounded-md">
                                <Lock className="w-3 h-3" /> Solo Lectura
                            </span>
                        )}
                        {isAdminRole && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 mt-1 text-xs font-bold text-purple-700 bg-purple-100 rounded-md border border-purple-200">
                                <Crown className="w-3 h-3" /> Acceso Total
                            </span>
                        )}
                    </div>
                </div>

                {isFormEnabled && (
                    <button type="submit" disabled={loading} className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-slate-800 flex items-center shadow-lg disabled:opacity-50 text-sm transition">
                        <Save className="w-4 h-4 mr-2" /> {loading ? 'Guardando...' : 'Guardar Rol'}
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-1 space-y-6">
                    <Card className="p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Shield className="w-5 h-5 text-slate-500" />
                            <h3 className="font-bold text-slate-800">Detalles</h3>
                        </div>
                        <Input
                            label="Nombre del Rol"
                            placeholder="Ej: Gerente"
                            registration={register('name')}
                            error={errors.name?.message}
                            disabled={!isFormEnabled}
                        />
                    </Card>

                    <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-sm">
                        <h4 className="text-xs font-bold text-slate-400 uppercase mb-2 px-2 mt-2">Módulos</h4>
                        <div className="space-y-1">
                            <button type="button" onClick={() => setModuleFilter('all')} className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition flex items-center justify-between ${moduleFilter === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
                                <span>Todos</span>
                            </button>
                            {Object.keys(groupedPermissions).map(moduleName => (
                                <button key={moduleName} type="button" onClick={() => setModuleFilter(moduleName)} className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition capitalize flex items-center justify-between ${moduleFilter === moduleName ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
                                    <span>{moduleName}</span>

                                    {groupedPermissions[moduleName].some((p: any) => selectedPermissions.includes(p.name)) && (
                                        <span className={`w-2 h-2 rounded-full ${moduleFilter === moduleName ? 'bg-green-400' : 'bg-green-500'}`} />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>


                <div className="lg:col-span-3">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
                        <div className="relative w-full sm:w-72">
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                            <input
                                type="text" placeholder="Buscar permiso..."
                                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="text-sm text-slate-500 font-medium">
                            <Badge variant="neutral">{selectedPermissions.length} permisos seleccionados</Badge>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {Object.entries(filteredGroups).map(([moduleKey, permissions]) => {
                            const allChecked = permissions.every((p: any) => selectedPermissions.includes(p.name));

                            return (
                                <Card key={moduleKey} className="overflow-hidden flex flex-col h-full">
                                    <div className="bg-slate-50 border-b border-slate-100 p-4 flex justify-between items-center">
                                        <h4 className="font-bold text-slate-700 capitalize flex items-center gap-2">
                                            {moduleKey} <span className="text-xs font-normal text-slate-400">({permissions.length})</span>
                                        </h4>
                                        {isFormEnabled && (
                                            <button type="button" onClick={() => toggleGroup(permissions)} className={`text-[10px] uppercase font-bold px-2 py-1 rounded transition ${allChecked ? 'bg-slate-200 text-slate-600' : 'bg-white border border-slate-200 text-blue-600 hover:bg-blue-50'}`}>
                                                {allChecked ? 'Desmarcar' : 'Marcar'}
                                            </button>
                                        )}
                                        {isAdminRole && <Crown className="w-4 h-4 text-purple-400" />}
                                    </div>
                                    <div className="p-4 space-y-3 flex-1">
                                        {permissions.map((perm: any) => (
                                            <label key={perm.id} className={`flex items-start gap-3 p-2 rounded-lg transition select-none ${!isFormEnabled ? 'cursor-not-allowed opacity-80' : 'cursor-pointer hover:bg-slate-50'}`}>
                                                <div className={`mt-0.5 w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center transition ${selectedPermissions.includes(perm.name) ? 'bg-slate-900 border-slate-900 text-white' : 'border-slate-300 bg-white'}`}>
                                                    {selectedPermissions.includes(perm.name) && <Check className="w-3.5 h-3.5" />}
                                                </div>
                                                <input type="checkbox" className="hidden" checked={selectedPermissions.includes(perm.name)} onChange={() => togglePermission(perm.name)} disabled={!isFormEnabled} />
                                                <span className="text-sm font-medium text-slate-700">{perm.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            </div>
        </form>
    );
}