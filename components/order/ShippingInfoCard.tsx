'use client';

import { Truck } from 'lucide-react';
import type { Order, OrderStoreRef } from '@/types/order';

type Props = {
  order: Order;
  title?: string;
};

function storeLabel(store: OrderStoreRef | null | undefined): string | null {
  if (!store) return null;
  const name = (store.display_name || store.alias || store.name || '').trim();
  if (!name) return null;
  return store.code ? `${name} (${store.code})` : name;
}

function storeAddressLine(store: OrderStoreRef | null | undefined): string | null {
  if (!store) return null;
  const parts = [store.address?.trim(), store.city?.trim()].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : null;
}

export default function ShippingInfoCard({
  order,
  title = 'Información de Envío',
}: Props) {
  const method = (
    order.delivery_method ||
    order.shipping_address_json?.delivery_method ||
    'shipping'
  )
    .toString()
    .toLowerCase()
    .trim();

  const pickupStore = order.pickup_store ?? null;
  const pickupId = order.pickup_store_id ?? pickupStore?.id ?? null;

  const isPickup = method === 'pickup' || pickupId != null;

  const pickupLabel =
    storeLabel(pickupStore) ||
    order.shipping_address_json?.pickup_store_name?.trim() ||
    null;
  const pickupAddress =
    storeAddressLine(pickupStore) ||
    ([
      order.shipping_address_json?.address_line1,
      order.shipping_address_json?.city,
    ]
      .filter(Boolean)
      .join(', ') || null);

  const shipping = order.shipping_address_json;

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-300 shadow-sm space-y-4">
      <h2 className="font-bold text-lg flex items-center gap-2">
        <Truck className="w-5 h-5 text-slate-600" />
        {title}
      </h2>

      {isPickup ? (
        <div className="space-y-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 px-3 py-1 text-xs font-semibold">
            Retiro en Tienda (Pickup)
          </span>

          <div className="rounded-xl p-4 space-y-2 bg-slate-50/80 border border-slate-100">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Punto de Retiro
            </p>
            <p className="text-base font-semibold text-slate-900">
              {pickupLabel || 'Tienda seleccionada'}
            </p>
            {pickupAddress ? (
              <p className="text-sm text-slate-600">{pickupAddress}</p>
            ) : null}
            {shipping?.pickup_time_frame ? (
              <p className="text-sm text-slate-600">
                Estimación: {shipping.pickup_time_frame}
              </p>
            ) : null}

            <div className="pt-2 border-t border-slate-200/80 text-sm text-slate-600 space-y-0.5">
              {shipping?.recipient_name ? (
                <p>
                  <span className="font-medium text-slate-800">Contacto:</span>{' '}
                  {shipping.recipient_name}
                </p>
              ) : null}
              {shipping?.phone ? (
                <p>
                  <span className="font-medium text-slate-800">Teléfono:</span> {shipping.phone}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 text-xs font-semibold">
            Envío a Domicilio
          </span>

          <div className="text-sm text-slate-600 space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
              Dirección de Entrega
            </p>
            {shipping?.recipient_name ? (
              <p className="font-medium text-slate-900">{shipping.recipient_name}</p>
            ) : null}
            {shipping?.phone ? <p>Teléfono: {shipping.phone}</p> : null}
            {shipping?.address_line1 ? <p>{shipping.address_line1}</p> : null}
            {shipping?.address_line2 ? <p>{shipping.address_line2}</p> : null}
            {(shipping?.city || shipping?.state) && (
              <p>{[shipping?.city, shipping?.state].filter(Boolean).join(', ')}</p>
            )}
            
            {shipping?.country ? <p>{shipping.country}</p> : null}
          </div>
        </div>
      )}
    </div>
  );
}
