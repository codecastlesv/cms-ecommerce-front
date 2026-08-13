import RoleForm from '@/components/admin/roles/RoleForm';
import PermissionGate from '@/components/auth/PermissionGate';

export const metadata = {
    title: 'Crear Rol | Galaxia Admin',
};

export default function CreateRolePage() {
    return (
        <PermissionGate permission="create_roles">
            <RoleForm />
        </PermissionGate>
    );
}