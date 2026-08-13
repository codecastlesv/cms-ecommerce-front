'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import api from '@/lib/axios';
import OrderList from '@/components/shop/OderList';
import { handleError } from '@/lib/errorHandler';
import type { Order } from '@/types/order';

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const res = await api.get<{ data: Order[] }>('/shop/orders/history');
        setOrders(res.data.data ?? []);
      } catch (err: unknown) {
        toast.error(handleError(err, 'No se pudieron cargar las compras'));
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, []);

  if (loading) return <div className="p-10 text-center">Cargando compras...</div>;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
        <OrderList
                title="Compras Realizadas"
                orders={orders}
                emptyMessage="No tienes compras realizadas."
              />
    </div>
  );
}
