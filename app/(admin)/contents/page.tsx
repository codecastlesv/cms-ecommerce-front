import InformativePageList from '@/components/admin/contents/InformativePageList';
import PermissionGate from '@/components/auth/PermissionGate';

export const metadata = {
    title: 'Contenidos | Galaxia Admin',
};

export default function ContentsPage() {
    return (
        <PermissionGate permission="view_contents">
            <InformativePageList />
        </PermissionGate>
    );
}
