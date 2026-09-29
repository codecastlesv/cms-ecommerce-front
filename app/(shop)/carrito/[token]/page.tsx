'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, AlertTriangle } from 'lucide-react';
import api from '@/lib/axios';

interface AdminCartItem {
  id: number | string;
  name: string;
  sku?: string;
  price: number;
  quantity: number;
  image?: string | null;
  category?: string | null;
  stock_quantity?: number;
}

type PageStatus = 'loading' | 'error' | 'redirecting';

export default function AdminCartLinkPage() {
  const params = useParams();
  const router = useRouter();
  const token = typeof params.token === 'string' ? params.token : '';

  const [status, setStatus] = useState<PageStatus>('loading');
  const [errorMessage, setErrorMessage] = useState('Este enlace no está disponible.');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const { data } = await api.get<{ data: AdminCartItem[] }>(`/shop/carts/${token}`);
        if (cancelled) return;

        const items = Array.isArray(data?.data) ? data.data : [];

        const cart = items.map((item) => ({
          id: item.id,
          name: item.name,
          sku: item.sku,
          price: item.price,
          quantity: item.quantity,
          image: item.image ?? undefined,
          category: item.category ?? undefined,
          stock_quantity: item.stock_quantity,
        }));

        localStorage.setItem('cart', JSON.stringify(cart));
        window.dispatchEvent(new Event('cartUpdated'));

        setStatus('redirecting');
        router.replace('/cart');
      } catch (error: unknown) {
        if (cancelled) return;

        let message = 'Este enlace no está disponible.';
        if (error && typeof error === 'object' && 'response' in error) {
          const response = (error as { response?: { status?: number; data?: { message?: string } } }).response;
          if (response?.status === 410) {
            message = 'Este enlace ya expiró. Pide uno nuevo.';
          } else if (response?.status === 404) {
            message = 'Este enlace no existe.';
          } else if (response?.data?.message) {
            message = response.data.message;
          }
        }

        setErrorMessage(message);
        setStatus('error');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, router]);

  if (status === 'error') {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
          <AlertTriangle className="h-7 w-7 text-red-500" />
        </div>
        <h1 className="font-helvetica text-[20px] font-bold text-slate-900">{errorMessage}</h1>
        <p className="max-w-md font-helvetica text-sm text-slate-500">
          Contacta a quien te lo compartió para que te envíe un enlace nuevo, o visita nuestra tienda para seguir comprando.
        </p>
        <a
          href="/tienda"
          className="mt-2 inline-flex items-center rounded-full bg-[#08204E] px-6 py-3 font-helvetica text-sm font-semibold text-white transition hover:opacity-90"
        >
          Ir a la tienda
        </a>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4 text-center">
      <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      <p className="font-helvetica text-sm text-slate-500">Preparando tu carrito…</p>
    </div>
  );
}
