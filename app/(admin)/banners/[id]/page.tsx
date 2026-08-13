import BannerForm from '@/components/admin/banners/BannerForm';
import PermissionGate from '@/components/auth/PermissionGate';

interface Props {
    params: Promise<{ id: string }>;
}

export const metadata = {
    title: 'Editar Banner | Galaxia Admin',
};

export default async function EditBannerPage({ params }: Props) {
    const { id } = await params;
    return (
        <PermissionGate permission="edit_banners">
            <BannerForm bannerId={id} />
        </PermissionGate>
    );
}