import BrandForm from '@/components/admin/brands/BrandForm';
import PermissionGate from '@/components/auth/PermissionGate';

export const metadata = {
    title: 'Crear Marca | Castella Admin',
};

export default function CreateBrandPage() {
    return (
        <PermissionGate permission="create_brands">
            <BrandForm />
        </PermissionGate>
    );
}