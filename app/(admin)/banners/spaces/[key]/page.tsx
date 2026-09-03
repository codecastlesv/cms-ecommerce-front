import PermissionGate from '@/components/auth/PermissionGate';
import ManageSpaceClient from '@/components/admin/banners/ManageSpaceClient';

interface Props {
    params: Promise<{ key: string }>;
}

export const metadata = {
    title: 'Gestionar Espacio | Castella Admin',
};

export default async function ManageSpacePage({ params }: Props) {
    const { key } = await params;

    return (
        <PermissionGate permission="edit_banners">
            <ManageSpaceClient groupKey={key} />
        </PermissionGate>
    );
}