import SportForm from '@/components/admin/sports/SportForm';
import PermissionGate from '@/components/auth/PermissionGate';

export const metadata = {
    title: 'Crear Deporte | Galaxia Admin',
};

export default function CreateSportPage() {
    return (
        <PermissionGate permission="create_sports">
            <SportForm />
        </PermissionGate>
    );
}