import SportList from '@/components/admin/sports/SportList';
import PermissionGate from '@/components/auth/PermissionGate';
export default function SportsPage() {
    return (
        <PermissionGate permission="view_sports">
            <SportList />
        </PermissionGate>
    );
}