import { Metadata } from 'next';
import { Suspense } from 'react';
import ProductForm from '@/components/admin/products/ProductForm';

export const metadata: Metadata = {
    title: 'Editar Producto | Galaxia Admin',
};

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: PageProps) {
    const { id } = await params;

    return (
        <Suspense fallback={null}>
            <ProductForm productId={id} />
        </Suspense>
    );
}
