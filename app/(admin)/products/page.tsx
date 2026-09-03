import { Metadata } from 'next';
import ProductList from '@/components/admin/products/ProductList';

export const metadata: Metadata = {
    title: 'Gestión de Productos | Castella Admin',
    description: 'Administra el catálogo de productos, inventario y precios.',
};

export default function ProductsPage() {
    return <ProductList />;
}