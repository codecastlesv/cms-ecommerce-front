import { Metadata } from 'next';
import ProductForm from '@/components/admin/products/ProductForm';

export const metadata: Metadata = {
    title: 'Nuevo Producto | Galaxia Admin',
};

export default function CreateProductPage() {
    return <ProductForm />;
}