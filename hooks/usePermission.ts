import { useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';

export const usePermission = () => {
    const { user } = useAuth();

    const can = useCallback((permissionName: string): boolean => {
        if (!user) return false;

        if (user.role === 'Admin') return true;

        return user.permissions?.includes(permissionName) || false;
    }, [user]);


    const canAny = useCallback((permissions: string[]): boolean => {
        if (!user) return false;
        if (user.role === 'Admin') return true;
        return permissions.some(p => user.permissions?.includes(p));
    }, [user]);

    return { can, canAny, user };
};