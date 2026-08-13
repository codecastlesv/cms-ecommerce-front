import BrandList from '@/components/admin/brands/BrandList';
import PermissionGate from '@/components/auth/PermissionGate';
export default function BrandsPage() {
    return (
        <PermissionGate permission="view_brands">
            <BrandList />
        </PermissionGate>
    );
}