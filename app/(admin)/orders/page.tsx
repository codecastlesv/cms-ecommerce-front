import OrderList from "@/components/admin/orders/OrderList";

export const metadata = {
    title: 'Pedidos | Castella Admin',
    description: 'Gestión y seguimiento de órdenes de compra.',
};

export default function OrdersPage() {
    return <OrderList />;
}