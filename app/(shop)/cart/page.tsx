"use client";

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { AiFillHeart, AiOutlineHeart } from 'react-icons/ai';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'sonner';
import { useShopFavorites } from '@/hooks/useShopFavorites';
import {
  handleShopProductImageError,
  resolveShopProductImageSrc,
} from '@/lib/shopProductImage';
import { toSentenceCase } from '@/lib/categoryUrls';

type StoredCartItem = {
  cart_key?: string;
  id: string | number;
  name?: string;
  price?: number;
  quantity?: number;
  size?: string;
  image?: string;
  sku?: string;
  category?: string;
  color?: string | { value?: string; color_hex?: string; swatch_image_url?: string };
  variant_label?: string | { value?: string; color_hex?: string; swatch_image_url?: string };
  variant_sku?: string;
  /** Máximo permitido (desde detalle de producto); ausente = sin tope en carrito */
  stock_quantity?: number;
};

const getCartItemKey = (item: StoredCartItem): string =>
  item.cart_key || `${item.id}-${item.sku ?? item.variant_sku ?? item.size ?? ''}`;

const getVariantLabel = (item: StoredCartItem): string => {
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
};

const normalizeStoredCartItem = (item: StoredCartItem): StoredCartItem => ({
  ...item,
  variant_label: getVariantLabel(item),
  color: getVariantLabel(item),
});

export default function CartPage() {
  // Temporal: ocultar UI de cupón/promoción en carrito (lógica futura intacta).
  const showPromoInput = false;
  const [cartItems, setCartItems] = useState<StoredCartItem[]>(() => {
    if (typeof window === 'undefined') return [];
    const storedItems = JSON.parse(localStorage.getItem('cart') || '[]') as StoredCartItem[];
    return storedItems.map(normalizeStoredCartItem);
  });
  const router = useRouter();
  const {
    favoriteIds,
    loadingFavorites,
    isLoggedIn,
    requireAuthForFavorites,
    toggleFavorite,
  } = useShopFavorites();

  const handleFavoriteClick = async (productId: string | number) => {
    if (!requireAuthForFavorites()) return;

    try {
      const added = await toggleFavorite(productId);
      toast.success(added ? 'Producto agregado a favoritos' : 'Producto eliminado de favoritos');
    } catch (error: unknown) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message || 'No se pudo actualizar favoritos'
        : 'No se pudo actualizar favoritos';
      toast.error(message);
    }
  };

  useEffect(() => {
    const handleCartUpdated = () => {
      const updatedCart = JSON.parse(localStorage.getItem('cart') || '[]') as StoredCartItem[];
      setCartItems(updatedCart.map(normalizeStoredCartItem));
    };

    window.addEventListener('cartUpdated', handleCartUpdated);
    return () => window.removeEventListener('cartUpdated', handleCartUpdated);
  }, []);

  const removeItem = (targetItem: StoredCartItem) => {
    const itemKey = getCartItemKey(targetItem);
    const newCart = cartItems.filter((item) => getCartItemKey(item) !== itemKey);
    setCartItems(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const updateQuantity = (targetItem: StoredCartItem, delta: number) => {
    const itemKey = getCartItemKey(targetItem);
    const item = cartItems.find((cartItem) => getCartItemKey(cartItem) === itemKey);
    if (!item) return;

    const currentQty = item.quantity || 1;
    const maxStock =
      typeof item.stock_quantity === 'number' && item.stock_quantity > 0
        ? item.stock_quantity
        : null;

    if (delta > 0 && maxStock !== null && currentQty >= maxStock) {
      toast.warning('No hay más unidades en stock para este producto.', {
        description: `Máximo ${maxStock} unidad(es).`,
      });
      return;
    }

    const newQuantity = currentQty + delta;
    if (newQuantity < 1) {
      removeItem(targetItem);
      return;
    }

    if (delta > 0 && maxStock !== null && newQuantity > maxStock) {
      toast.warning('No hay más unidades en stock para este producto.', {
        description: `Solo puedes tener hasta ${maxStock} en el carrito.`,
      });
      return;
    }

    const newCart = cartItems.map((cartItem) =>
      getCartItemKey(cartItem) === itemKey
        ? { ...cartItem, quantity: newQuantity }
        : cartItem
    );

    setCartItems(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const subtotal = cartItems.reduce((acc, item) => acc + Number(item.price || 0) * (item.quantity || 1), 0);
  const total = subtotal;

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-20 font-sans ">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-[#f5f5f5] p-4 rounded-md">
            <h2 className="font-bold text-[15px] mb-1">COMPRA MÁS FÁCIL Y RÁPIDO</h2>
            <p className="text-sm text-gray-700 mb-2">Accede a una experiencia de compra más ágil, organizada y hecha para ti.</p>
            {!isLoggedIn() ? (
              <p className="text-sm text-gray-800">
                Tu cuenta Castella se creará automáticamente durante el pago para que puedas rastrear este pedido.
              </p>
            ) : null}
          </div>

          <h1 className="text-2xl font-bold tracking-tight">CARRITO</h1>

          {cartItems.length === 0 ? (
            <p className="text-gray-500 py-10">Tu carrito está vacío.</p>
          ) : (
            <div className="space-y-6">
              {cartItems.map((item) => {
                const qty = item.quantity || 1;
                const unit = Number(item.price || 0);
                const lineTotal = unit * qty;
                const maxStock =
                  typeof item.stock_quantity === 'number' && item.stock_quantity > 0
                    ? item.stock_quantity
                    : null;
                const atStockMax = maxStock !== null && qty >= maxStock;

                const stepperAndFav = (
                  <div className="flex w-full gap-2 min-[495px]:w-auto">
                    <div className="flex flex-1 items-center border border-gray-300 rounded-sm overflow-hidden h-10 min-[495px]:flex-none min-[495px]:w-24">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item, -1)}
                        className="px-3 text-gray-500 hover:bg-gray-100 h-full flex items-center justify-center"
                      >
                        -
                      </button>
                      <span className="flex-1 text-center text-sm font-medium">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item, 1)}
                        disabled={atStockMax}
                        className="px-3 h-full flex items-center justify-center text-lg hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleFavoriteClick(item.id)}
                      disabled={loadingFavorites}
                      className="shrink-0 border border-gray-300 rounded-sm w-10 h-10 flex items-center justify-center hover:bg-gray-100"
                    >
                      {loadingFavorites ? (
                        <div className="w-4 h-4 border-2 border-gray-300 border-t-red-500 rounded-full animate-spin"></div>
                      ) : favoriteIds.includes(Number(item.id)) ? (
                        <AiFillHeart size={18} className="text-red-500" />
                      ) : (
                        <AiOutlineHeart size={18} className="text-gray-500" />
                      )}
                    </button>
                  </div>
                );

                return (
                <div key={getCartItemKey(item)} className="flex flex-col gap-4 border-b pb-6 relative pr-2 min-[495px]:flex-row">
                  <div className="absolute top-0 right-0 flex items-center gap-2">
                    <span className="font-helvetica text-[18px] font-bold tabular-nums">${lineTotal.toFixed(2)}</span>
                    <button
                      type="button"
                      onClick={() => removeItem(item)}
                      className="p-1 hover:bg-gray-100 rounded-full"
                      aria-label="Quitar del carrito"
                    >
                      <X size={20} className="text-gray-500" />
                    </button>
                  </div>

                  <div className="flex flex-col gap-4 min-[495px]:flex-row">
                    <div className="w-[150px] h-[150px] bg-[#f6f6f6] flex-shrink-0">
                      <img
                        src={resolveShopProductImageSrc(item.image)}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={handleShopProductImageError}
                      />
                    </div>

                    <div className="flex flex-col flex-1 justify-between min-w-0 min-[495px]:pr-[7.5rem]">
                      <div>
                        <h3 className="font-inter font-bold text-[16px] pr-2">{item.name}</h3>
                        <p className="text-[13px] text-gray-600 mt-0.5">
                          ${unit.toFixed(2)} c/u
                          {qty > 1 ? (
                            <span className="text-gray-500">
                              {' '}
                              · {qty} unidades
                            </span>
                          ) : null}
                        </p>
                        <p className="text-[14px] text-gray-500 mt-1">{item.category ? toSentenceCase(item.category) : ''}</p>
                        {item.sku ? (
                          <p className="text-[14px] text-gray-500">SKU {item.sku}</p>
                        ) : null}
                        {typeof item.variant_label === 'string' && item.variant_label.trim() ? (
                          <p className="text-[14px] text-gray-500">{item.variant_label}</p>
                        ) : null}
                      </div>

                      <div className="mt-4 hidden min-[495px]:block">{stepperAndFav}</div>
                    </div>
                  </div>

                  <div className="min-[495px]:hidden">{stepperAndFav}</div>
                </div>
                );
              })}
            </div>
          )}

          {showPromoInput ? (
            <div className="pt-4 max-w-sm">
              <p className="text-[13px] mb-2 font-medium">¿Cuentas con un código promocional?</p>
              <div className="flex gap-2">
                <input type="text" placeholder="Promoción" className="border border-gray-300 rounded-sm px-3 py-2 flex-1 outline-none focus:border-black text-sm" />
                <button className="bg-gray-400 text-white px-6 py-2 rounded-sm font-medium hover:bg-gray-500 transition">Aplicar</button>
              </div>
              <p className="text-[11px] text-gray-400 mt-1">Máxima una promoción por pedido*</p>
            </div>
          ) : null}
        </div>

        <div className="lg:col-span-4">
          <div className="sticky top-24 self-start ">
            <h2 className="text-[20px] font-bold mb-6">Resumen</h2>
            <div className="space-y-4 text-[15px] mb-6">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-helvetica text-[18px] font-bold">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-[16px] border-t border-gray-200 pt-4 mt-2">
                <span>Total</span>
                <span className="font-helvetica text-[19px] font-bold">${total.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => router.push('/checkout')}
                disabled={cartItems.length === 0}
                className="w-full bg-[#E30613] text-white py-4 rounded-sm font-medium hover:brightness-95 transition disabled:opacity-50 disabled:pointer-events-none"
              >
                Continuar al Pago
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
