import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { toast } from 'sonner';

export interface Permission { id: number; name: string; guard_name: string; }
export interface Role { id: number; name: string; is_system: boolean; permissions: Permission[]; }

export function useSecurity() {
    const queryClient = useQueryClient();

    const rolesQuery = useQuery({
        queryKey: ['roles'],
        queryFn: async () => {
            const { data } = await api.get('/admin/roles');
            return data.roles || data;
        }
    });

    const permissionsQuery = useQuery({
        queryKey: ['permissions'],
        queryFn: async () => (await api.get('/admin/permissions')).data
    });


    const saveRoleMutation = useMutation({
        mutationFn: async (data: { id?: number; name: string; permissions: string[] }) => {
            if (data.id) return api.put(`/admin/roles/${data.id}`, data);
            return api.post('/admin/roles', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['roles'] });
            toast.success('Rol guardado exitosamente');
        },
        onError: (err: any) => toast.error(err.response?.data?.message || 'Error al guardar rol')
    });

    const deleteRoleMutation = useMutation({
        mutationFn: async (id: number) => api.delete(`/admin/roles/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['roles'] });
            toast.success('Rol eliminado');
        },
        onError: () => toast.error('No se pudo eliminar el rol')
    });

    const savePermissionMutation = useMutation({
        mutationFn: async (data: { id?: number; name: string }) => {
            if (data.id) return api.put(`/admin/permissions/${data.id}`, data);
            return api.post('/admin/permissions', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['permissions'] });
            queryClient.invalidateQueries({ queryKey: ['roles'] });
            toast.success('Permiso guardado');
        },
        onError: () => toast.error('Error al guardar permiso')
    });

    const deletePermissionMutation = useMutation({
        mutationFn: async (id: number) => api.delete(`/admin/permissions/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['permissions'] });
            toast.success('Permiso eliminado');
        }
    });

    return {
        roles: rolesQuery.data as Role[] || [],
        permissions: permissionsQuery.data as Permission[] || [],
        isLoading: rolesQuery.isLoading || permissionsQuery.isLoading,
        saveRole: saveRoleMutation.mutateAsync,
        deleteRole: deleteRoleMutation.mutateAsync,
        savePermission: savePermissionMutation.mutateAsync,
        deletePermission: deletePermissionMutation.mutateAsync
    };
}