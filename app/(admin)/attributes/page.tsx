import AttributeList from '@/components/admin/attributes/AttributeList';
import PermissionGate from '@/components/auth/PermissionGate';
export default function AttributesPage() {
    return (
        <PermissionGate permission="view_attributes">
            <AttributeList />
        </PermissionGate>
    );
}