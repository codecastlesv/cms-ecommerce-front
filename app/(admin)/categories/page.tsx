import CategoryList from '@/components/admin/categories/CategoryList';
import PermissionGate from '@/components/auth/PermissionGate';
export const metadata = {
    title: 'Crear Categorías | Castella Admin',
};
export default function CategoriesPage() {
    return (
        <PermissionGate permission="view_categories">
            <CategoryList />
        </PermissionGate>
    );
}