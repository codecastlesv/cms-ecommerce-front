import CampaignForm from '@/components/admin/campaigns/CampaignForm';

export const metadata = {
    title: 'Editar Campaña | Castella Admin',
};

export default async function EditCampaignPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return <CampaignForm mode="edit" campaignId={Number(id)} />;
}
