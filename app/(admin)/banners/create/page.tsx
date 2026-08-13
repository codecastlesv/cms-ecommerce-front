import BannerForm from '@/components/admin/banners/BannerForm';
import PermissionGate from '@/components/auth/PermissionGate';

export const metadata = {
    title: 'Nuevo Banner | Galaxia Admin',
};

export default function CreateBannerPage() {
    return (
        <PermissionGate permission="create_banners">
            <BannerForm />
        </PermissionGate>
    );
}