import AttributeForm from '@/components/admin/attributes/AttributeForm';
import PermissionGate from '@/components/auth/PermissionGate';

export const metadata = {
    title: 'Crear Atributo | Galaxia Admin',
};

export default function CreateAttributePage() {
    return (
        <PermissionGate permission="create_attributes">
            <AttributeForm />
        </PermissionGate>
    );
}