import StoreForm from "@/components/admin/stores/StoreForm";

interface Props {
    params: Promise<{ id: string }>;
}

export const metadata = {
    title: 'Editar Sucursal | Galaxia Admin',
};

export default async function EditStorePage({ params }: Props) {

    const { id } = await params;


    return <StoreForm storeId={id} />;
}