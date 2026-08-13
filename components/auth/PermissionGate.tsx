'use client';

import { usePermission } from '@/hooks/usePermission';
import { ShieldAlert } from 'lucide-react';
import Link from 'next/link';

interface Props {
    children: React.ReactNode;
    permission: string;
    showError?: boolean;
}

export default function PermissionGate({ children, permission, showError = true }: Props) {
    const { can } = usePermission();

    if (can(permission)) {
        return <>{children}</>;
    }

    if (!showError) return null;

    return (
        <div className="flex flex-col items-center justify-center h-[50vh] text-center p-6">
            <div className="bg-red-50 p-4 rounded-full mb-4">
                <ShieldAlert className="w-12 h-12 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Acceso Restringido</h2>
            <p className="text-slate-500 mt-2">No tienes permiso para ver esta sección.</p>
            <Link href="/dashboard" className="mt-4 text-blue-600 hover:underline">
                Volver al Dashboard
            </Link>
        </div>
    );
}