import { notFound } from 'next/navigation';
import ProductDetailClient from '@/components/shop/product/detail/ProductDetailClient';

interface PageProps {
  params: Promise<{ slug: string }>;
}

function getApiBaseUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api').trim();
  // En SSR (Windows/Node), localhost a veces resuelve a ::1 y falla si artisan escucha en 127.0.0.1.
  return raw.replace(/:\/\/localhost(?=[:/]|$)/i, '://127.0.0.1').replace(/\/$/, '');
}

async function fetchJson(path: string): Promise<unknown | null> {
  const url = `${getApiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`;

  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });

    if (!res.ok) {
      console.error('[PDP] API error', res.status, url);
      return null;
    }

    return await res.json();
  } catch (error) {
    console.error('[PDP] fetch failed', url, error);
    return null;
  }
}

export default async function ProductoDetailPage({ params }: PageProps) {
  const { slug } = await params;

  if (!slug?.trim()) {
    notFound();
  }

  const payload = (await fetchJson(
    `/shop/store/products/${encodeURIComponent(slug.trim())}`,
  )) as { data?: Record<string, unknown> } | null;

  const product = payload?.data ?? null;

  if (!product || typeof product !== 'object' || product.id == null) {
    notFound();
  }

  const relatedPayload = (await fetchJson(`/products/${product.id}/related`)) as
    | { data?: unknown[] }
    | null;

  const relatedProducts = Array.isArray(relatedPayload?.data) ? relatedPayload.data : [];

  return (
    <ProductDetailClient
      product={product as never}
      relatedProducts={relatedProducts as never}
    />
  );
}
