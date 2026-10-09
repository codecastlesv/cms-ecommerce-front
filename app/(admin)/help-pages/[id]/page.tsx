import HelpPageForm from '@/components/admin/help-pages/HelpPageForm';

export const metadata = {
    title: 'Editar Página de Ayuda | Castella Admin',
};

export default async function EditHelpPagePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return <HelpPageForm mode="edit" pageId={Number(id)} />;
}
