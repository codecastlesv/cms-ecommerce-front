import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Role, ApiResponse } from '@/types';

export const useRoles = () => {
    return useQuery({
        queryKey: ['roles'],
        queryFn: async () => {
            const { data } = await api.get<ApiResponse<Role[]> | Role[]>('/admin/roles');

            if (Array.isArray(data)) {
                return data;
            }

            return (data as ApiResponse<Role[]>).data || [];
        },
        staleTime: 1000 * 60 * 10,
    });
};