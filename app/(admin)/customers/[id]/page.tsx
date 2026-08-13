import CustomerDetail from "@/components/admin/customers/CustomerDetail";

interface Props {
    params: Promise<{ id: string }>;
}

export const metadata = {
    title: 'Editar Cliente | Galaxia Admin',
};

export default async function EditCustomerPage({ params }: Props) {
    const { id } = await params;

    return <CustomerDetail customerId={id} />;
}