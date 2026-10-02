import PartnerApplicationList from '@/components/admin/partnerApplications/PartnerApplicationList';

export const metadata = {
    title: 'Distribuidores e Instaladores | Castella Admin',
    description: 'Solicitudes de alianza recibidas desde el sitio web.',
};

export default function PartnerApplicationsPage() {
    return <PartnerApplicationList />;
}
