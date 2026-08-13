import BrandForm from '@/components/admin/brands/BrandForm';
import PermissionGate from '@/components/auth/PermissionGate';

interface Props {
    params: Promise<{ id: string }>;
}

export const metadata = {
    title: 'Editar Marca | Galaxia Admin',
};

export default async function EditBrandPage({ params }: Props) {
    const { id } = await params;
    return (
        <PermissionGate permission="edit_brands">
            <BrandForm brandId={id} />
        </PermissionGate>
    );
}