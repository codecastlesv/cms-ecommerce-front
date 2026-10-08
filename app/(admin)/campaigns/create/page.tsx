import CampaignForm from '@/components/admin/campaigns/CampaignForm';

export const metadata = {
    title: 'Nueva Campaña | Castella Admin',
};

export default function CreateCampaignPage() {
    return <CampaignForm mode="create" />;
}
