'use client';

import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import api from '@/lib/axios';
import OrderList from '@/components/shop/OderList';
import { handleError } from '@/lib/errorHandler';
import type { Order } from '@/types/order';

function orderDayKey(dateStr?: string | null): string | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return null;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const res = await api.get<{ active?: Order[]; cancelled?: Order[] }>('/shop/orders');
        const active = res.data.active ?? [];
        const cancelled = res.data.cancelled ?? [];
        // Un solo listado: sin sección separada de cancelados.
        setOrders([...active, ...cancelled]);
      } catch (err: unknown) {
        toast.error(handleError(err, 'No se pudieron cargar los pedidos'));
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const day = orderDayKey(order.created_at);
      if (dateFrom && (!day || day < dateFrom)) return false;
      if (dateTo && (!day || day > dateTo)) return false;
      return true;
    });
  }, [orders, dateFrom, dateTo]);

  if (loading) {
    return <div className="p-10 text-center">Cargando pedidos...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Mis Pedidos</h1>
        <p className="text-sm text-slate-500 mt-1">
          Consulta y filtra el historial de tus órdenes.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-slate-700">Fecha desde</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-slate-700">Fecha hasta</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </label>
        </div>
      </div>

      <OrderList
        title="Pedidos"
        orders={filteredOrders}
        emptyMessage="No se encontraron pedidos con los filtros seleccionados."
      />
    </div>
  );
}
