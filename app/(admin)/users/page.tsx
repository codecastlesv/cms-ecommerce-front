import UserList from "@/components/admin/users/UserList";
import PermissionGate from "@/components/auth/PermissionGate";

export default function UsersPage() {
    return (
        <PermissionGate permission="view_users">
            <UserList />
        </PermissionGate>
    );
}