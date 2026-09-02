'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import axios from 'axios';
import api from '@/lib/axios';
import { clearCart } from '@/lib/cart';
import {
  readCheckoutSuccessSnapshot,
} from '@/lib/checkout-success-cache';
import { isUuidString } from '@/lib/payment-confirm';

const fallbackMock = {
  customerName: 'JUAN CARLOS MOREIRA GAMEZ',
  date: '23/11/2026 09:23:42',
  cardMasked: '—',
  amount: '$120',
  email: 'cliente@ejemplo.com',
  deliveryType: 'Domicilio',
  shippingAddress:
    'Residencial Valterra, Pol E,#25, A la par del Encuentro Valle Dulce Apopa, San Salvador 1123, El Salvador',
} as const;

function isValidOrderIdParam(raw: string | null): raw is string {
  return raw != null && raw !== '' && isUuidString(raw);
}

type StoreRef = {
  id?: number;
  name?: string;
  alias?: string | null;
  code?: string;
  address?: string;
  city?: string;
  display_name?: string;
};

type OrderPayload = {
  uuid?: string;
  number?: string;
  status?: string;
  total?: string | number;
  created_at?: string;
  delivery_method?: string | null;
  shipping_address_json?: Record<string, unknown> | null;
  pickup_store?: StoreRef | null;
  dispatch_store?: StoreRef | null;
  /** Mensaje legible de la última respuesta del gateway (p. ej. declinado). */
  last_payment_message?: string | null;
};

type PaymentUi =
  | { kind: 'auth_hold' }
  | { kind: 'paid_complete' }
  | { kind: 'declined'; detail: string };

const APPROVED_FLOW_STATUSES = new Set([
  'approved',
  'shipped',
  'delivered',
  // legacy hasta migrar BD
  'paid',
  'processing',
  'completed',
  'captured',
]);

function resolvePaymentUi(order: OrderPayload | null): PaymentUi {
  const status = order?.status;
  if (status === 'authorized_pending_capture') {
    return { kind: 'auth_hold' };
  }
  if (status && APPROVED_FLOW_STATUSES.has(status)) {
    return { kind: 'paid_complete' };
  }
  if (
    status &&
    ['rejected_payment', 'rejected_stock', 'rejected_damage', 'failed', 'declined', 'expired', 'cancelled'].includes(
      status
    )
  ) {
    const detail =
      typeof order?.last_payment_message === 'string' && order.last_payment_message.trim() !== ''
        ? order.last_payment_message.trim()
        : 'La transacción no fue aprobada o el pedido no pudo continuar.';
    return { kind: 'declined', detail };
  }
  const detail =
    typeof order?.last_payment_message === 'string' && order.last_payment_message.trim() !== ''
      ? order.last_payment_message.trim()
      : 'La transacción no fue aprobada o quedó incompleta.';
  return { kind: 'declined', detail };
}

function PaymentStatusSection({ paymentUi }: { paymentUi: PaymentUi }) {
  return (
    <div className="flex flex-col gap-2 text-center">
      <span className="text-[1em] text-gray-500">Estado del pago</span>

      {paymentUi.kind === 'auth_hold' ? (
        <>
          <span className="mx-auto inline-flex max-w-full items-center gap-1.5 rounded-full border border-stone-200/90 bg-stone-50/90 px-3 py-1 text-[16px] font-medium tracking-wide text-stone-700 shadow-[0_1px_0_rgba(0,0,0,0.03)]">
            <span aria-hidden className="opacity-90">
              ⏳
            </span>
            Autorizado / Fondos retenidos
          </span>
          <p className="mx-auto max-w-sm text-left text-[16px] leading-relaxed text-gray-500 sm:text-center">
            Tu pago ha sido autorizado de forma segura. Estamos verificando las existencias físicas de tus productos en
            tienda; el cargo final a tu tarjeta se ejecutará únicamente cuando el pedido esté listo para despacho.
          </p>
        </>
      ) : null}

      {paymentUi.kind === 'paid_complete' ? (
        <span className="mx-auto inline-flex max-w-full items-center gap-1.5 rounded-full border border-emerald-200/70 bg-emerald-50/80 px-3 py-1 text-[16px] font-medium tracking-wide text-emerald-900/80 shadow-[0_1px_0_rgba(0,0,0,0.03)]">
          <span aria-hidden className="opacity-90">
            ✓
          </span>
          Pago confirmado
        </span>
      ) : null}

      {paymentUi.kind === 'declined' ? (
        <>
          <span className="mx-auto inline-flex max-w-full items-center gap-1.5 rounded-full border border-red-200/80 bg-red-50/70 px-3 py-1 text-[16px] font-medium tracking-wide text-red-900/85 shadow-[0_1px_0_rgba(0,0,0,0.03)]">
            <span aria-hidden className="opacity-90">
              ❌
            </span>
            Declinado
          </span>
          <p className="mx-auto max-w-sm text-left text-[16px] leading-relaxed text-gray-500 sm:text-center">{paymentUi.detail}</p>
        </>
      ) : null}
    </div>
  );
}

function formatDateSv(iso: string | undefined): string {
  if (!iso) return fallbackMock.date;
  try {
    return new Date(iso).toLocaleString('es-SV', { dateStyle: 'short', timeStyle: 'medium' });
  } catch {
    return iso;
  }
}

function formatMoney(n: string | number | undefined): string {
  if (n === undefined || n === null) return fallbackMock.amount;
  const num = typeof n === 'string' ? parseFloat(n) : n;
  if (Number.isNaN(num)) return fallbackMock.amount;
  return `$${num.toFixed(2)}`;
}

function formatAddress(j: Record<string, unknown> | null | undefined): string {
  if (!j || typeof j !== 'object') return fallbackMock.shippingAddress;
  const line1 = typeof j.address_line1 === 'string' ? j.address_line1 : '';
  const line2 = typeof j.address_line2 === 'string' ? j.address_line2 : '';
  const city = typeof j.city === 'string' ? j.city : '';
  const state = typeof j.state === 'string' ? j.state : '';
  const postal = typeof j.postal_code === 'string' ? j.postal_code : '';
  const country = typeof j.country === 'string' ? j.country : '';
  const parts = [line1, line2, city, state, postal, country].filter((p) => p.length > 0);
  return parts.length > 0 ? parts.join(', ') : fallbackMock.shippingAddress;
}

function storePublicName(store: StoreRef | null | undefined, shipping?: Record<string, unknown> | null): string {
  if (store) {
    const label = (store.display_name || store.alias || store.name || '').trim();
    if (label) return label;
  }
  const fromJson =
    typeof shipping?.pickup_store_name === 'string' ? shipping.pickup_store_name.trim() : '';
  return fromJson || 'Tienda seleccionada';
}

function storeAddressLine(store: StoreRef | null | undefined, shipping?: Record<string, unknown> | null): string {
  if (store?.address?.trim()) {
    return [store.address.trim(), store.city?.trim()].filter(Boolean).join(', ');
  }
  return formatAddress(shipping ?? null);
}

function resolveDeliveryMethod(order: OrderPayload | null): 'pickup' | 'shipping' {
  const fromOrder = (order?.delivery_method || '').toLowerCase().trim();
  if (fromOrder === 'pickup' || fromOrder === 'shipping') return fromOrder;
  const fromJson = String(order?.shipping_address_json?.delivery_method || '')
    .toLowerCase()
    .trim();
  if (fromJson === 'pickup') return 'pickup';
  return 'shipping';
}

type DetailRowProps = { label: string; value: string };

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="flex flex-col gap-0.5 text-left">
      <span className="font-helvetica text-[1em] font-bold text-slate-900">{label}</span>
      <span className="font-helvetica text-[1em] text-gray-500 break-words">{value}</span>
    </div>
  );
}

function CheckoutSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderIdParam = searchParams.get('order_id');
  const validVisit = isValidOrderIdParam(orderIdParam);

  const [order, setOrder] = useState<OrderPayload | null>(() => {
    if (!orderIdParam || !isUuidString(orderIdParam)) return null;
    const cached = readCheckoutSuccessSnapshot(orderIdParam);
    return cached ? (cached as OrderPayload) : null;
  });
  const [loadingOrder, setLoadingOrder] = useState(() => {
    if (!orderIdParam || !isUuidString(orderIdParam)) return false;
    return readCheckoutSuccessSnapshot(orderIdParam) == null;
  });
  /** Si el detalle no carga (403/404/red), no mandamos a /checkout/error: el pago ya pasó por verify. */
  const [detailUnavailable, setDetailUnavailable] = useState(false);

  useEffect(() => {
    if (!validVisit) {
      router.replace('/');
      return;
    }
    // Seguridad: vaciar carrito al aterrizar en éxito (también si se llegó por refresh/bookmark).
    clearCart();
  }, [validVisit, router]);

  useEffect(() => {
    if (!validVisit || !orderIdParam) return;
    let cancelled = false;

    // Snapshot optimista ya en state: no bloquear UI; refrescar en background.
    const hasOptimistic = order != null;
    if (!hasOptimistic) {
      setLoadingOrder(true);
    }
    setDetailUnavailable(false);

    (async () => {
      try {
        // api interceptor adjunta Authorization: Bearer <shop_token> en rutas /shop/*
        const res = await api.get<{ data?: OrderPayload }>(`/shop/orders/${orderIdParam}`);
        const payload = res.data?.data;
        if (!cancelled && payload) {
          setOrder(payload);
        } else if (!cancelled && !hasOptimistic) {
          setDetailUnavailable(true);
        }
      } catch (err) {
        if (cancelled) return;
        // Con snapshot optimista conservamos la UI; sin él, confirmación genérica.
        if (!hasOptimistic) {
          if (axios.isAxiosError(err)) {
            setDetailUnavailable(true);
            return;
          }
          setDetailUnavailable(true);
        }
      } finally {
        if (!cancelled) setLoadingOrder(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // Solo re-fetch al cambiar el id; el snapshot inicial no debe re-disparar el efecto.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- order seed is intentional once
  }, [orderIdParam, validVisit]);

  if (!validVisit) {
    return (
      <div className="flex min-h-[40vh] w-full flex-col items-center justify-center px-4 py-16 font-sans text-center">
        <p className="text-gray-800 font-medium mb-2">No se pudo validar esta página de confirmación.</p>
        <p className="text-sm text-gray-500 mb-6">Falta un identificador de pedido válido. Redirigiendo al inicio…</p>
        <Link href="/" className="text-sm font-semibold underline text-black">
          Ir al inicio ahora
        </Link>
      </div>
    );
  }

  const shipping = order?.shipping_address_json as Record<string, unknown> | undefined;
  const customerName =
    (typeof shipping?.recipient_name === 'string' && shipping.recipient_name) || fallbackMock.customerName;
  const email = (typeof shipping?.email === 'string' && shipping.email) || fallbackMock.email;

  const orderNumberDisplay = order?.number ? `#${order.number}` : `#${orderIdParam}`;
  const showGenericConfirmation = detailUnavailable && !order;

  return (
    <div className="flex w-full flex-col items-center justify-center px-4 py-10 font-sans text-slate-900 antialiased">
      <div className="flex w-full max-w-md flex-col items-center">
        <div className="mb-6 flex items-center justify-center" aria-hidden>
          <CheckCircleIcon className="h-20 w-20 text-green-500" />
        </div>

        <h1 className="mb-10 max-w-sm text-center font-helvetica text-2xl font-bold text-slate-900">
          ¡Su operación fue exitosa!
        </h1>

        {loadingOrder && !order ? (
          <p className="text-[1em] text-gray-500 mb-6">Cargando detalles del pedido…</p>
        ) : null}

        {showGenericConfirmation ? (
          <div className="w-full space-y-6 text-left">
            <div className="flex flex-col gap-0.5">
              <span className="font-helvetica text-[1em] font-bold text-slate-900">Referencia de pedido</span>
              <span className="font-inter text-[1em] font-bold text-gray-500 break-all">{orderIdParam}</span>
            </div>
            <p className="text-[1em] leading-relaxed text-gray-600">
              Tu pago fue procesado. No pudimos cargar el detalle completo del pedido en este momento; conserva esta
              referencia y revisa tu correo o tu cuenta para más información.
            </p>
          </div>
        ) : (
          <div className="w-full space-y-6">
            {order ? <PaymentStatusSection paymentUi={resolvePaymentUi(order)} /> : null}
            {loadingOrder && !order ? (
              <div className="flex flex-col gap-2 text-center">
                <span className="text-[1em] text-gray-500">Estado del pago</span>
                <span className="text-[1em] text-gray-400">Cargando…</span>
              </div>
            ) : null}

            <div className="flex flex-col gap-0.5 text-left">
              <span className="font-helvetica text-[1em] font-bold text-slate-900">Número orden</span>
              <span className="font-inter text-[1em] font-bold text-gray-500 break-words">{orderNumberDisplay}</span>
            </div>

            {order ? (
              <>
                <DetailRow label="Nombre del cliente" value={customerName} />
                <DetailRow label="Fecha" value={formatDateSv(order?.created_at)} />
                <DetailRow label="Tarjeta" value={fallbackMock.cardMasked} />
                <DetailRow label="Monto" value={formatMoney(order?.total)} />
                <DetailRow label="Email" value={email} />
                {(() => {
                  const method = resolveDeliveryMethod(order);
                  const shippingJson = shipping ?? null;
                  const pickupStore = order?.pickup_store ?? null;
                  const eta =
                    (typeof shippingJson?.pickup_time_frame === 'string' &&
                      shippingJson.pickup_time_frame.trim()) ||
                    'Listo en 2 días hábiles';

                  if (method === 'pickup') {
                    return (
                      <>
                        <DetailRow label="Condición de entrega" value="Retiro en Tienda (Pickup)" />
                        <DetailRow
                          label="Punto de Retiro / Sucursal"
                          value={storePublicName(pickupStore, shippingJson)}
                        />
                        <DetailRow
                          label="Dirección de Retiro"
                          value={storeAddressLine(pickupStore, shippingJson)}
                        />
                        <DetailRow label="Tiempo estimado" value={eta} />
                      </>
                    );
                  }

                  return (
                    <>
                      <DetailRow label="Condición de entrega" value="Envío a Domicilio" />
                      <DetailRow label="Dirección de envío" value={formatAddress(shippingJson)} />
                    </>
                  );
                })()}
              </>
            ) : null}
          </div>
        )}

        <Link
          href="/"
          className="mt-12 w-full max-w-md rounded-sm bg-[#E30613] py-4 text-center font-inter text-[1em] font-bold text-white transition hover:brightness-95"
        >
          Continuar comprando
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-12rem)] w-full items-center justify-center px-4 font-sans text-gray-500">
          Cargando…
        </div>
      }
    >
      <div className="flex min-h-[calc(100vh-12rem)] w-full items-center justify-center">
        <CheckoutSuccessContent />
      </div>
    </Suspense>
  );
}
