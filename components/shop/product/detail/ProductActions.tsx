"use client";

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { AiFillHeart, AiOutlineHeart } from 'react-icons/ai';
import { useShopFavorites } from '@/hooks/useShopFavorites';
import { parsePositiveSalePrice } from '@/utils/shopPricing';
import { resolveShopProductImageSrc } from '@/lib/shopProductImage';

interface DetailProduct {
  id: number;
  sku?: string;
  name: string;
  sale_price?: number | null;
  price?: number;
  price_regular?: number;
  gallery?: string[];
  main_image?: string;
  external_image_url?: string | null;
  in_stock?: boolean;
  stock_quantity?: number;
  categories?: Array<{ name: string }>;
}

function resolvePriceForCart(product: DetailProduct): number {
  const regularNum = Number(product.price_regular ?? product.price ?? 0) || 0;
  const saleNum = parsePositiveSalePrice(product.sale_price);
  const onSale = saleNum !== null && regularNum > 0 && saleNum < regularNum;
  return onSale ? saleNum : regularNum;
}

interface CartItem {
  cart_key?: string;
  id: number;
  sku?: string;
  variant_sku?: string;
  size?: string;
  variant_label?: string;
  color?: string;
  image?: string;
  quantity?: number;
  price: number;
  name?: string;
  category?: string;
  stock_quantity?: number;
}

interface ProductActionsProps {
  product: DetailProduct;
  presentacion?: string | null;
}

function readCart(): CartItem[] {
  try {
    return JSON.parse(localStorage.getItem('cart') || '[]') as CartItem[];
  } catch {
    return [];
  }
}

function getCartQtyForProduct(productId: number, sku?: string): number {
  const cart = readCart();
  const item = cart.find((i) => {
    if (sku) {
      return Number(i.id) === productId && (i.sku === sku || i.variant_sku === sku);
    }
    return Number(i.id) === productId;
  });
  return Math.max(0, Number(item?.quantity ?? 0));
}

export default function ProductActions({ product, presentacion }: ProductActionsProps) {
  const [isAdded, setIsAdded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cartTick, setCartTick] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const { favoriteIds, loadingFavorites, requireAuthForFavorites, toggleFavorite } = useShopFavorites();

  const price = resolvePriceForCart(product);
  const image = resolveShopProductImageSrc(
    product.gallery?.[0] || product.main_image || product.external_image_url,
  );
  const sku = (product.sku || '').trim();
  const stockQty = Math.max(0, Number(product.stock_quantity ?? 0));
  const inCart = getCartQtyForProduct(product.id, sku);
  const remaining = stockQty - inCart;
  const isOutOfStock = stockQty <= 0 && product.in_stock === false ? true : stockQty <= 0;
  const atCartLimit = remaining <= 0 && stockQty > 0;
  const cannotAddMore = isOutOfStock || atCartLimit;
  const cartKey = sku ? `product-${product.id}-${sku}` : `product-${product.id}`;
  const isFavorite = favoriteIds.includes(Number(product.id));
  const maxQuantity = Math.max(1, remaining);

  const bumpCart = useCallback(() => setCartTick((t) => t + 1), []);

  useEffect(() => {
    const onCart = () => bumpCart();
    window.addEventListener('cartUpdated', onCart);
    window.addEventListener('storage', onCart);
    return () => {
      window.removeEventListener('cartUpdated', onCart);
      window.removeEventListener('storage', onCart);
    };
  }, [bumpCart]);

  useEffect(() => {
    setQuantity((q) => Math.min(Math.max(q, 1), maxQuantity));
  }, [maxQuantity]);

  const handleAddToCart = () => {
    if (!sku) {
      toast.error('Este producto no tiene código de barras (SKU).');
      return;
    }

    const already = getCartQtyForProduct(product.id, sku);

    if (stockQty <= 0) {
      toast.error('Este producto está agotado.');
      return;
    }

    if (already >= stockQty) {
      toast.warning('Ya no hay más unidades en stock.', {
        description: `Inventario: ${stockQty}. Ya tienes ${already} en el carrito.`,
      });
      return;
    }

    const currentCart = readCart();
    const existingItem = currentCart.find((item) => item.cart_key === cartKey);
    const nextQty = (existingItem?.quantity ?? 0) + quantity;

    if (nextQty > stockQty) {
      toast.warning('Ya no hay más unidades en stock.', {
        description: `Solo puedes añadir hasta ${stockQty} unidad(es).`,
      });
      return;
    }

    if (existingItem) {
      const updatedCart = currentCart.map((item) =>
        item.cart_key === cartKey
          ? {
              ...item,
              quantity: nextQty,
              price,
              sku,
              variant_sku: sku,
              variant_label: presentacion || '',
              image,
              stock_quantity: stockQty,
            }
          : item,
      );

      localStorage.setItem('cart', JSON.stringify(updatedCart));
      window.dispatchEvent(new Event('cartUpdated'));
      setIsAdded(true);
      setQuantity(1);
      setTimeout(() => setIsAdded(false), 2000);
      bumpCart();
      return;
    }

    const newItem: CartItem = {
      cart_key: cartKey,
      id: product.id,
      sku,
      variant_sku: sku,
      name: product.name,
      price,
      image,
      category: product.categories?.[0]?.name || 'Producto',
      variant_label: presentacion || '',
      quantity,
      stock_quantity: stockQty,
    };

    localStorage.setItem('cart', JSON.stringify([...currentCart, newItem]));
    window.dispatchEvent(new Event('cartUpdated'));
    setIsAdded(true);
    setQuantity(1);
    setTimeout(() => setIsAdded(false), 2000);
    bumpCart();
  };

  const handleToggleFavorite = async () => {
    if (!requireAuthForFavorites()) return;

    setIsProcessing(true);
    try {
      const added = await toggleFavorite(product.id);
      toast.success(added ? 'Producto agregado a favoritos' : 'Producto eliminado de favoritos');
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      const message = err?.response?.data?.message || 'No se pudo actualizar favoritos';
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  };

  void cartTick;

  return (
    <div className="space-y-4">
      {presentacion ? (
        <p className="text-sm text-gray-600">
          <span className="font-semibold text-gray-900">Presentación: </span>
          {presentacion}
        </p>
      ) : null}

      <div className="space-y-3 pt-2">
        {!cannotAddMore && (
          <div className="flex w-fit items-center rounded-sm border border-gray-300">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              aria-label="Disminuir cantidad"
              className="flex h-11 w-11 items-center justify-center text-lg font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300"
            >
              -
            </button>
            <span className="flex h-11 w-12 items-center justify-center border-x border-gray-300 text-[16px] font-medium tabular-nums">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
              disabled={quantity >= maxQuantity}
              aria-label="Aumentar cantidad"
              className="flex h-11 w-11 items-center justify-center text-lg font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300"
            >
              +
            </button>
          </div>
        )}

        <button
          type="button"
          disabled={cannotAddMore}
          onClick={handleAddToCart}
          className={`w-full py-4 rounded-sm font-medium text-[16px] transition active:scale-95 cursor-pointer ${
            isAdded
              ? 'bg-green-600 text-white'
              : cannotAddMore
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-[#E30613] text-white hover:brightness-95'
          }`}
        >
          {isAdded
            ? '¡Añadido al carrito!'
            : isOutOfStock
            ? 'Agotado'
            : atCartLimit
            ? 'No hay mas disponibles'
            : 'Añadir al carrito'}
        </button>

        <button
          type="button"
          onClick={handleToggleFavorite}
          disabled={loadingFavorites || isProcessing}
          className="w-full border border-black py-4 rounded-sm cursor-pointer font-medium flex items-center justify-center hover:bg-slate-50 transition active:scale-95"
        >
          {loadingFavorites || isProcessing ? (
            <div className="w-5 h-5 border-2 border-gray-300 border-t-red-500 rounded-full animate-spin" />
          ) : isFavorite ? (
            <AiFillHeart size={18} className="text-red-500" />
          ) : (
            <AiOutlineHeart size={18} className="text-slate-900" />
          )}
        </button>
      </div>
    </div>
  );
}
