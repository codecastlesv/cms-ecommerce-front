import RoleForm from '@/components/admin/roles/RoleForm';
import PermissionGate from '@/components/auth/PermissionGate';

interface Props {
    params: Promise<{ id: string }>;
}

export const metadata = {
    title: 'Editar Rol | Galaxia Admin',
};

export default async function EditRolePage({ params }: Props) {
    const { id } = await params;
    return (
        <PermissionGate permission="edit_roles">
            <RoleForm roleId={id} />
        </PermissionGate>
    );
}