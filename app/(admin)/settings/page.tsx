import SettingsForm from "@/components/admin/settings/SettingsForm";
import PermissionGate from "@/components/auth/PermissionGate";

export const metadata = {
    title: 'Configuración General | Galaxia Admin',
};

export default function SettingsPage() {
    return (
        <PermissionGate permission="view_settings">
            <SettingsForm />
        </PermissionGate>
    );
}