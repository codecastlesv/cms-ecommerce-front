'use client';

import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { getStatusConfig } from '@/utils/statusOrder';
import { formatDateDMY } from '@/utils/date';
import type { Order } from '@/types/order';

type OrderListProps = {
  title: string;
  orders: Order[];
  emptyMessage: string;
};

function deliveryMethodLabel(order: Order): string {
  const method = (
    order.delivery_method
    ?? order.shipping_address_json?.delivery_method
    ?? ''
  )
    .toString()
    .trim()
    .toLowerCase();

  if (method === 'pickup') return 'Pickup';
  if (method === 'shipping' || method === 'delivery' || method === 'domicilio') {
    return 'Domicilio';
  }
  return method ? method : '—';
}

function productNamesSummary(order: Order): string {
  const names = (order.items ?? [])
    .map((item) => item.name?.trim())
    .filter((name): name is string => Boolean(name));

  if (names.length === 0) return 'Sin productos';
  if (names.length <= 3) return names.join(', ');
  return `${names.slice(0, 3).join(', ')} +${names.length - 3} más`;
}

export default function OrderList({
  title,
  orders,
  emptyMessage,
}: OrderListProps) {
  return (
    <div className="space-y-6">

      {orders.length === 0 && (
        <div className="text-center py-10 text-slate-400 border-2 border-dashed rounded-xl">
          {emptyMessage}
        </div>
      )}

      <div className="space-y-4">
        {orders.map((order) => {
          const { textColor, label } = getStatusConfig(order.status);
          const detailHref = `/order/${order.uuid ?? order.id}`;
          const total = Number(order.grand_total ?? order.total ?? 0);

          return (
            <article
              key={order.uuid ?? order.id}
              className="w-full p-5 rounded-xl border bg-white border-slate-200 hover:border-slate-300 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                <div className="flex gap-3 items-start min-w-0">
                  <div className="mt-0.5 p-1.5 rounded-lg bg-slate-100 border border-slate-200 shrink-0">
                    <ShoppingBag className="w-4 h-4 text-slate-500" aria-hidden />
                  </div>

                  <div className="min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-semibold text-slate-900">
                        Pedido #{order.number}
                      </h4>
                      <span className={`text-xs font-medium ${textColor}`}>
                        {label}
                      </span>
                    </div>

                    <p className="text-sm text-slate-500">
                      {formatDateDMY(order.created_at)}
                    </p>

                    <p className="text-sm text-slate-600">
                      <span className="text-slate-400">Entrega:</span>{' '}
                      {deliveryMethodLabel(order)}
                    </p>

                    <p className="text-sm text-slate-600 leading-snug">
                      <span className="text-slate-400">Productos:</span>{' '}
                      <span className="text-slate-700">{productNamesSummary(order)}</span>
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-stretch sm:items-end gap-3 shrink-0">
                  <div className="text-left sm:text-right">
                    <p className="text-xs text-slate-500">Total</p>
                    <p className="font-semibold text-lg text-slate-900">
                      ${total.toFixed(2)}
                    </p>
                  </div>

                  <Link
                    href={detailHref}
                    className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors"
                  >
                    Ver detalle de la orden
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
