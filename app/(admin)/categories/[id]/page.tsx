import CategoryForm from '@/components/admin/categories/CategoryForm';
import PermissionGate from '@/components/auth/PermissionGate';

interface Props {
    params: Promise<{ id: string }>;
}
export const metadata = {
    title: 'Editar Categorias | Castella Admin',
};
export default async function EditCategoryPage({ params }: Props) {
    const { id } = await params;
    return (
        <PermissionGate permission="edit_categories">
            <CategoryForm categoryId={id} />
        </PermissionGate>
    );
}