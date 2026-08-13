import SportForm from '@/components/admin/sports/SportForm';
import PermissionGate from '@/components/auth/PermissionGate';

interface Props {
    params: Promise<{ id: string }>;
}

export const metadata = {
    title: 'Editar Deporte | Galaxia Admin',
};

export default async function EditSportPage({ params }: Props) {
    const { id } = await params;
    return (
        <PermissionGate permission="edit_sports">
            <SportForm sportId={id} />
        </PermissionGate>
    );
}