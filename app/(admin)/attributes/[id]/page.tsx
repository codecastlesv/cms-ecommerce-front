import AttributeForm from '@/components/admin/attributes/AttributeForm';
import PermissionGate from '@/components/auth/PermissionGate';

interface Props {
    params: Promise<{ id: string }>;
}

export const metadata = {
    title: 'Editar Atributo | Galaxia Admin',
};

export default async function EditAttributePage({ params }: Props) {
    const { id } = await params;
    return (
        <PermissionGate permission="edit_attributes">
            <AttributeForm attributeId={id} />
        </PermissionGate>
    );
}