'use client';

import { Suspense, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CanceledError } from 'axios';
import api from '@/lib/axios';
import { clearCart } from '@/lib/cart';
import { isUuidString, isValidSuccessPayload } from '@/lib/payment-confirm';
import {
  clearPendingCheckoutOrderUuid,
  readPendingCheckoutOrderUuid,
  saveCheckoutSuccessSnapshot,
  type CheckoutSuccessOrderSnapshot,
} from '@/lib/checkout-success-cache';
import { SHOP_PUBLIC_ORIGIN } from '@/lib/shopPublicOrigin';

function goToSuccess(orderId: string) {
  clearPendingCheckoutOrderUuid();
  window.location.replace(
    `${SHOP_PUBLIC_ORIGIN}/checkout/success?order_id=${encodeURIComponent(orderId)}`
  );
}

function goToError() {
  window.location.replace(`${SHOP_PUBLIC_ORIGIN}/checkout/error`);
}

function VerifyContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const startedRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!window.location.hostname.includes('ngrok')) return;
    const dest = token
      ? `${SHOP_PUBLIC_ORIGIN}/checkout/verify?token=${encodeURIComponent(token)}`
      : `${SHOP_PUBLIC_ORIGIN}/checkout/error`;
    window.location.replace(dest);
  }, [token]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hostname.includes('ngrok')) {
      return;
    }
    if (!token || startedRef.current) {
      return;
    }
    startedRef.current = true;

    const pendingUuid = readPendingCheckoutOrderUuid();

    (async () => {
      try {
        const res = await api.post<{ data?: unknown }>(
          '/shop/payments/confirm',
          {
            spi_token: token,
            ...(pendingUuid ? { order_id: pendingUuid } : {}),
          },
          { timeout: 90000 }
        );

        const payload = res.data?.data;
        if (isValidSuccessPayload(payload)) {
          clearCart();
          if (payload.order && typeof payload.order === 'object') {
            saveCheckoutSuccessSnapshot(payload.order_id, payload.order as CheckoutSuccessOrderSnapshot);
          }
          goToSuccess(payload.order_id);
          return;
        }

        if (pendingUuid && isUuidString(pendingUuid)) {
          goToSuccess(pendingUuid);
          return;
        }

        goToError();
      } catch (err: unknown) {
        if (err instanceof CanceledError) {
          return;
        }
        if (pendingUuid && isUuidString(pendingUuid)) {
          try {
            const orderRes = await api.get<{ data?: { uuid?: string; status?: string } }>(
              `/shop/orders/${pendingUuid}`
            );
            const status = orderRes.data?.data?.status;
            if (
              status === 'paid' ||
              status === 'approved' ||
              status === 'processing'
            ) {
              clearCart();
              goToSuccess(pendingUuid);
              return;
            }
          } catch {
            // fall through to error
          }
        }
        goToError();
      }
    })();
  }, [token]);

  if (!token) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 font-sans text-center">
        <p className="text-gray-800 mb-4">No se recibió el token de pago en la URL.</p>
        <Link href="/cart" className="text-sm underline font-medium">
          Volver al carrito
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-20 font-sans text-center">
      <div className="inline-flex items-center gap-3 text-gray-800">
        <span
          className="inline-block h-5 w-5 border-2 border-gray-300 border-t-black rounded-full animate-spin"
          aria-hidden
        />
        <span className="font-medium">Procesando pago…</span>
      </div>
      <p className="text-sm text-gray-500 mt-4">Confirmando la transacción con el banco emisor.</p>
    </div>
  );
}

export default function CheckoutVerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-lg mx-auto px-4 py-20 font-sans text-center text-gray-700">Cargando…</div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
