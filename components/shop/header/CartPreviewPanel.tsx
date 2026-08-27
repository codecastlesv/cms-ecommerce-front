'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { X, ShoppingBag } from 'lucide-react';
import {
  handleShopProductImageError,
  resolveShopProductImageSrc,
} from '@/lib/shopProductImage';

type StoredCartItem = {
  cart_key?: string;
  id: string | number;
  name?: string;
  price?: number;
  quantity?: number;
  size?: string;
  sku?: string;
  image?: string;
  category?: string;
  color?: string | { value?: string; color_hex?: string; swatch_image_url?: string };
  variant_label?: string | { value?: string; color_hex?: string; swatch_image_url?: string };
};

const getCartItemKey = (item: StoredCartItem): string =>
  item.cart_key || `${item.id}-${item.sku ?? item.size ?? ''}`;

function getVariantLabel(item: StoredCartItem): string {
  if (typeof item.variant_label === 'string' && item.variant_label.trim()) {
    return item.variant_label;
  }
  if (item.variant_label && typeof item.variant_label === 'object') {
    return item.variant_label.value || item.variant_label.color_hex || 'Estándar';
  }
  if (typeof item.color === 'string' && item.color.trim()) {
    return item.color;
  }
  if (item.color && typeof item.color === 'object') {
    return item.color.value || item.color.color_hex || 'Estándar';
  }
  return 'Estándar';
}

function normalizeItem(item: StoredCartItem): StoredCartItem {
  return { ...item, variant_label: getVariantLabel(item) };
}

function readCart(): StoredCartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = JSON.parse(localStorage.getItem('cart') || '[]') as StoredCartItem[];
    return Array.isArray(raw) ? raw.map(normalizeItem) : [];
  } catch {
    return [];
  }
}

interface CartPreviewPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartPreviewPanel({ isOpen, onClose }: CartPreviewPanelProps) {
  const [mounted, setMounted] = useState(false);
  const [cartItems, setCartItems] = useState<StoredCartItem[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const sync = () => setCartItems(readCart());
    sync();

    window.addEventListener('cartUpdated', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('cartUpdated', sync);
      window.removeEventListener('storage', sync);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!mounted) return null;

  const subtotal = cartItems.reduce(
    (acc, item) => acc + Number(item.price || 0) * (item.quantity || 1),
    0,
  );
  const lineCount = cartItems.reduce((acc, item) => acc + (item.quantity || 1), 0);
  const checkoutDisabled = cartItems.length === 0;

  const panel = (
    <div
      className={`fixed inset-0 z-[74] transition-[opacity,visibility] duration-500 ease-[cubic-bezier(0.33,1,0.36,1)] ${
        isOpen ? 'pointer-events-auto visible opacity-100' : 'pointer-events-none invisible opacity-0'
      }`}
      aria-hidden={!isOpen}
    >
      <div
        className={`absolute inset-0 bg-black/45 transition-opacity duration-500 ease-out ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
        aria-hidden
      />

      <aside
        className={`pointer-events-auto fixed inset-y-0 right-0 z-[75] flex w-full max-w-[min(100vw,420px)] flex-col bg-white shadow-[0_0_72px_-16px_rgba(0,0,0,0.35)] transition-transform duration-500 ease-[cubic-bezier(0.33,1,0.36,1)] ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-label="Resumen del carrito"
      >
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-neutral-100 px-6 py-5 sm:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-white">
              <ShoppingBag className="h-5 w-5 stroke-[1.5]" />
            </div>
            <div className="min-w-0">
              <p className="font-oswald text-[22px] font-medium uppercase tracking-[0.06em] text-neutral-950">
                Tu carrito
              </p>
              <p className="truncate font-inter text-[12px] leading-tight tracking-wide text-neutral-500">
                {lineCount === 0
                  ? 'Aún no hay productos'
                  : `${lineCount} ${lineCount === 1 ? 'artículo' : 'artículos'} · vista rápida`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-2.5 text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5 stroke-[2]" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4 sm:px-8">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
              <p className="font-poppins text-[15px] font-medium text-neutral-900">
                Tu bolsa está vacía
              </p>
              <p className="mt-2 max-w-[260px] font-inter text-[13px] leading-relaxed text-neutral-500">
                Explora la tienda y agrega tus favoritos para verlos aquí.
              </p>
            </div>
          ) : (
            <ul className="space-y-5">
              {cartItems.map((item) => {
                const qty = item.quantity || 1;
                const unit = Number(item.price || 0);
                const lineTotal = unit * qty;
                const variant = getVariantLabel(item);

                return (
                  <li
                    key={getCartItemKey(item)}
                    className="flex gap-3 border-b border-neutral-100 pb-5 last:border-0 last:pb-0"
                  >
                    <div className="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-md bg-neutral-100">
                      <img
                        src={resolveShopProductImageSrc(item.image)}
                        alt={item.name || 'Producto'}
                        className="h-full w-full object-cover"
                        onError={handleShopProductImageError}
                      />
                    </div>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <p className="font-poppins text-[14px] font-semibold leading-snug text-neutral-950 line-clamp-2">
                        {item.name}
                      </p>
                      <div className="mt-1.5 font-inter text-[12px] text-neutral-500">
                        <p>
                          <span className="text-neutral-600">{variant}</span>
                          {item.size ? (
                            <>
                              {' '}
                              <span aria-hidden className="text-neutral-300">
                                ·
                              </span>{' '}
                              Talla {item.size}
                            </>
                          ) : null}
                        </p>
                        <p className="mt-1 tabular-nums text-neutral-700">
                          {qty} × ${unit.toFixed(2)}{' '}
                          <span className="font-medium text-neutral-900">→ ${lineTotal.toFixed(2)}</span>
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <footer className="shrink-0 border-t border-neutral-100 bg-white px-6 py-6 sm:px-8">
          <div className="mb-6 flex items-end justify-between gap-4 border-b border-neutral-100 pb-5">
            <span className="font-inter text-[13px] font-medium uppercase tracking-wide text-neutral-500">
              Subtotal
            </span>
            <span className="font-poppins text-[22px] font-semibold tabular-nums text-neutral-950">
              ${subtotal.toFixed(2)}
            </span>
          </div>

          <div className="flex flex-col gap-3">
            <Link
              href="/cart"
              onClick={onClose}
              className="flex w-full items-center justify-center rounded-sm border border-neutral-900 bg-black text-white py-3.5 text-center font-inter text-[13px] font-semibold uppercase tracking-[0.12em] text-neutral-900 transition"
            >
              Ver carrito
            </Link>
  
          </div>
          <p className="mt-4 text-center font-inter text-[11px] leading-relaxed text-neutral-400">
            Cambia cantidades o elimina ítems en la página del carrito.
          </p>
        </footer>
      </aside>
    </div>
  );

  return createPortal(panel, document.body);
}
