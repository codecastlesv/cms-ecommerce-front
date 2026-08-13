'use client';

import { Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CanceledError } from 'axios';
import api from '@/lib/axios';
import { clearCart } from '@/lib/cart';
import { isValidSuccessPayload } from '@/lib/payment-confirm';
import {
  saveCheckoutSuccessSnapshot,
  type CheckoutSuccessOrderSnapshot,
} from '@/lib/checkout-success-cache';

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      return;
    }

    const ac = new AbortController();

    (async () => {
      try {
        const res = await api.post<{ data?: unknown }>('/shop/payments/confirm', { spi_token: token }, { signal: ac.signal });

        const payload = res.data?.data;
        if (!isValidSuccessPayload(payload)) {
          router.replace('/checkout/error');
          return;
        }

        clearCart();
        const orderId = String(payload.order_id);
        if (payload.order && typeof payload.order === 'object') {
          saveCheckoutSuccessSnapshot(orderId, payload.order as CheckoutSuccessOrderSnapshot);
        }
        const params = new URLSearchParams({ order_id: orderId });
        router.replace(`/checkout/success?${params.toString()}`);
      } catch (err: unknown) {
        if (err instanceof CanceledError) {
          return;
        }
        router.replace('/checkout/error');
      }
    })();

    return () => ac.abort();
  }, [token, router]);

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
