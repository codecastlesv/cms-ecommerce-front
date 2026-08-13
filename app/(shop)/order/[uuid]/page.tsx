'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/axios';
import {
  handleShopProductImageError,
  resolveShopProductImageSrc,
} from '@/lib/shopProductImage';
import { Order } from '@/types/order';
import { toast } from 'sonner';
import {
  Package,
  CheckCircle,
  Clock,
  XCircle,
  CircleDollarSign,
  Receipt
} from 'lucide-react';

import { formatDate } from '@/utils/date';
import BillingInfoCard from '@/components/order/BillingInfoCard';
import ShippingInfoCard from '@/components/order/ShippingInfoCard';
import { getStatusConfig } from '@/utils/statusOrder';
import { formatTime } from '@/utils/time';
import { handleError } from '@/lib/errorHandler';

export default function OrderDetailPage() {
  const params = useParams();
  const uuid = typeof params.uuid === 'string' ? params.uuid : Array.isArray(params.uuid) ? params.uuid[0] : '';

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uuid) {
      setLoading(false);
      return;
    }
    const loadOrder = async () => {
      try {
        const res = await api.get(`/shop/orders/${uuid}`);
        setOrder(res.data.data);
      } catch (error) {
        toast.error(handleError(error, 'Error al cargar el pedido'));
      } finally {
        setLoading(false);
      }
    };
    loadOrder();
  }, [uuid]);

  const formatMoney = (value: unknown) => Number(value ?? 0).toFixed(2);

  if (loading)
    return <div className="p-10 text-center">Cargando pedido...</div>;

  if (!order)
    return (
      <div className="p-10 text-center text-slate-500">
        Pedido no encontrado
      </div>
    );

  const { icon: StatusIcon, textColor: color, label } = getStatusConfig(order.status);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Pedido #{order.number}
          </h1>
          <p className="font-medium text-slate-600 text-md">
            <strong>Nombre:</strong> {order.user?.name ?? '—'}
          </p>
          <p className="text-slate-500 text-sm">
            <strong>Realizado: </strong> {formatDate(order.created_at)} a las {formatTime(order.created_at)}
          </p>
        </div>

        <div className={`flex items-center gap-2 font-semibold text-xl ${color}`}>
          <StatusIcon className="w-5 h-5" />
          {label}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-4">
            <h2 className="font-bold text-lg mb-4">
              Productos
            </h2>

            <div className="space-y-4">
              {order.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-4 border rounded-xl p-4 border-slate-200 hover:border-slate-300 transition"
                >
                  <img
                    src={resolveShopProductImageSrc(item.image)}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded-lg"
                    onError={handleShopProductImageError}
                  />

                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">
                      {item.name}
                    </p>
                    <p className="font-semibold text-slate-600">
                      {item.brand}
                    </p>
                    <p className="text-sm text-slate-500">
                      {item.sku}
                    </p>
                    <p className="text-sm text-slate-500">
                      Talla {item.variant_attributes_json?.size} - Color {item.variant_attributes_json?.product_color}
                    </p>
                    <p className="text-sm text-slate-500">
                      Cantidad: {item.quantity}
                    </p>
                  </div>

                  <div className="text-right">
                    {Number(item.discount_percentage) > 0 ? (
                      <>
                        <p className="text-sm text-slate-500 line-through">
                          ${formatMoney(item.price_regular)}
                        </p>

                        <p className="text-sm text-green-600 font-medium">
                          -{formatMoney(item.discount_percentage)}%
                        </p>

                        <p className="font-bold text-slate-900">
                          ${formatMoney(item.price_sale)}
                        </p>
                      </>
                    ) : (
                      <p className="font-bold text-slate-900">
                        ${formatMoney(item.total)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-300 shadow-sm">
            <h2 className="font-bold text-lg mb-4">
              Resumen
            </h2>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Subtotal</span>
                <span>${formatMoney(order.subtotal)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">Costo de envío</span>
                <span>${formatMoney(order.tax)}</span>
              </div>

              <div className="flex justify-between font-bold text-lg border-t pt-3">
                <span>Total</span>
                <span>${formatMoney(order.total)}</span>
              </div>
            </div>
          </div>

          <ShippingInfoCard order={order} />

          <BillingInfoCard order={order} icon={Receipt} title="Dirección de Facturación" />

        </div>
      </div>
    </div>
  );
}
