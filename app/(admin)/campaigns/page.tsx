import CampaignList from '@/components/admin/campaigns/CampaignList';

export const metadata = {
    title: 'Campañas | Castella Admin',
    description: 'Promociones con landing, enlaces de canal y seguimiento en GA.',
};

export default function CampaignsPage() {
    return <CampaignList />;
}
