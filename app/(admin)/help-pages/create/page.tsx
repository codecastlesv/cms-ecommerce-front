import HelpPageForm from '@/components/admin/help-pages/HelpPageForm';

export const metadata = {
    title: 'Nueva Página de Ayuda | Castella Admin',
};

export default function CreateHelpPagePage() {
    return <HelpPageForm mode="create" />;
}
