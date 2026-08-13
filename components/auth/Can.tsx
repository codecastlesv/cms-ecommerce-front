'use client';
import { usePermission } from '@/hooks/usePermission';

interface Props {
    permission: string;
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

export default function Can({ permission, children, fallback = null }: Props) {
    const { can } = usePermission();

    return can(permission) ? <>{children}</> : <>{fallback}</>;
}