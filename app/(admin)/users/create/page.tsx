import UserForm from "@/components/admin/users/UserForm";
import PermissionGate from "@/components/auth/PermissionGate";

export const metadata = {
    title: 'Nuevo Usuario | Castella Admin',
};

export default function CreateUserPage() {
    return (
        <PermissionGate permission="create_users">
            <UserForm />
        </PermissionGate>
    );
}