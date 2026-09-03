import BulkCategoryForm from '@/components/admin/categories/BulkCategoryForm';
import PermissionGate from '@/components/auth/PermissionGate';
export const metadata = {
    title: 'Carga Masiva de Categorías | Castella Admin',
};
export default function BulkPage() {
    return (
        <PermissionGate permission="create_categories">
            <BulkCategoryForm />
        </PermissionGate>
    );
}