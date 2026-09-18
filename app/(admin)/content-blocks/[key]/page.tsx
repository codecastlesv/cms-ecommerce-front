import PermissionGate from '@/components/auth/PermissionGate';
import ManageContentBlockClient from '@/components/admin/content-blocks/ManageContentBlockClient';

interface Props {
    params: Promise<{ key: string }>;
}

export const metadata = {
    title: 'Gestionar Bloque de Contenido | Castella Admin',
};

export default async function ManageContentBlockPage({ params }: Props) {
    const { key } = await params;

    return (
        <PermissionGate permission="view_content_blocks">
            <ManageContentBlockClient groupKey={key} />
        </PermissionGate>
    );
}
