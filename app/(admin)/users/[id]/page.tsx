import UserForm from "@/components/admin/users/UserForm";
import PermissionGate from "@/components/auth/PermissionGate";

interface Props {
    params: Promise<{ id: string }>;
}

export const metadata = {
    title: 'Editar Usuario | Galaxia Admin',
};

export default async function EditUserPage({ params }: Props) {
    const { id } = await params;
    return (
        <PermissionGate permission="edit_users">
            <UserForm userId={id} />
        </PermissionGate>
    );
}