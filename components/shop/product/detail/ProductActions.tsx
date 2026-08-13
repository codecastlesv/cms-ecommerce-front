"use client";

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { AiFillHeart, AiOutlineHeart } from 'react-icons/ai';
import { useShopFavorites } from '@/hooks/useShopFavorites';
import { parsePositiveSalePrice } from '@/utils/shopPricing';
import { resolveShopProductImageSrc } from '@/lib/shopProductImage';

interface DetailVariant {
  id?: number;
  sku?: string;
  sale_price?: number | null;
  price?: number;
  stock_quantity?: number;
  images?: Array<{ url: string }>;
}

interface DetailProduct {
  id: number;
  name: string;
  sale_price?: number | null;
  price?: number;
  price_regular?: number;
  gallery?: string[];
  main_image?: string;
  in_stock?: boolean;
  categories?: Array<{ name: string }>;
  product_color?: string | { value?: string; color_hex?: string; swatch_image_url?: string } | null;
}

/** Precio que se guarda en carrito - oferta si hay; regular; si no, precio regular/lista. */
function resolvePriceForCart(
  variant: DetailVariant | null | undefined,
  product: DetailProduct,
): number {
  const priceRegular = variant?.price ?? product.price_regular ?? product.price ?? 0;
  const regularNum = typeof priceRegular === 'number' && !Number.isNaN(priceRegular) ? priceRegular : 0;
  const saleNum = parsePositiveSalePrice(variant?.sale_price ?? product.sale_price);
  const onSale = saleNum !== null && regularNum > 0 && saleNum < regularNum;
  return onSale ? saleNum : regularNum;
}

interface CartItem {
  cart_key?: string;
  id: number;
  variant_id?: number;
  variant_sku?: string;
  size: string;
  variant_label?: string;
  color?: string;
  image?: string;
  quantity?: number;
  price: number;
  /** Inventario al añadir. El carrito valida el máximo con este valor */
  stock_quantity?: number;
}

interface ProductActionsProps {
  product: DetailProduct;
  sizes: string[];
  selectedSize: string;
  selectedVariant: DetailVariant | null;
  selectedVariantLabel?: string;
  onSelectSize: (size: string) => void;
  sizeStatusByValue?: Record<string, { exists: boolean; hasStock: boolean }>;
  /** Variante actual por talla (mismo color) para stock y carrito */
  variantsBySize?: Record<string, DetailVariant | undefined>;
}

const resolveVariantLabel = (
  label?: string | { value?: string; color_hex?: string; swatch_image_url?: string } | null,
): string => {
  if (typeof label === 'string' && label.trim()) {
    const trimmed = label.trim();
    if (trimmed.toLowerCase().includes('variante')) {
      return '';
    }
    return trimmed;
  }

  if (label && typeof label === 'object') {
    return label.value || label.color_hex || '';
  }

  return '';
};

function readCart(): CartItem[] {
  try {
    return JSON.parse(localStorage.getItem('cart') || '[]') as CartItem[];
  } catch {
    return [];
  }
}

function getCartQtyForVariant(variantId: number | undefined): number {
  if (!variantId) return 0;
  const cart = readCart();
  const item = cart.find((i) => i.variant_id === variantId);
  return Math.max(0, Number(item?.quantity ?? 0));
}

export default function ProductActions({
  product,
  sizes,
  selectedSize,
  selectedVariant,
  selectedVariantLabel,
  onSelectSize,
  sizeStatusByValue,
  variantsBySize = {},
}: ProductActionsProps) {
  const [isAdded, setIsAdded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cartTick, setCartTick] = useState(0);

  const { favoriteIds, loadingFavorites, requireAuthForFavorites, toggleFavorite } = useShopFavorites();

  const activeVariant = selectedVariant;
  const price = resolvePriceForCart(activeVariant, product);
  const image = resolveShopProductImageSrc(
    activeVariant?.images?.[0]?.url || product.gallery?.[0] || product.main_image,
  );
  const stockQty = Math.max(0, Number(activeVariant?.stock_quantity ?? 0));
  const inCartForVariant = getCartQtyForVariant(activeVariant?.id);
  const remainingForSelected = stockQty - inCartForVariant;
  const isOutOfStock = activeVariant ? stockQty <= 0 : !product.in_stock;
  const atCartLimit = Boolean(activeVariant && remainingForSelected <= 0 && stockQty > 0);
  const cannotAddMore = !activeVariant || isOutOfStock || atCartLimit;

  const cartKey = activeVariant?.id ? `${product.id}-${activeVariant.id}` : `${product.id}-${selectedSize}`;
  const variantLabel = resolveVariantLabel(selectedVariantLabel ?? product.product_color);

  const isFavorite = favoriteIds.includes(Number(product.id));

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

  const handleAddToCart = () => {
    if (!selectedSize || !activeVariant?.id) return;

    const stock = Math.max(0, Number(activeVariant.stock_quantity ?? 0));
    const already = getCartQtyForVariant(activeVariant.id);

    if (stock <= 0) {
      toast.error('Esta variante está agotada.');
      return;
    }

    if (already >= stock) {
      toast.warning('Ya no hay más unidades en stock para esta talla y color.', {
        description: `Inventario: ${stock}. Ya tienes ${already} en el carrito.`,
      });
      return;
    }

    const currentCart = readCart();
    const existingItem = currentCart.find((item) => item.cart_key === cartKey);
    const nextQty = (existingItem?.quantity ?? 0) + 1;

    if (nextQty > stock) {
      toast.warning('Ya no hay más unidades en stock para esta variante.', {
        description: `Solo puedes añadir hasta ${stock} unidad(es).`,
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
              variant_id: activeVariant.id,
              variant_sku: activeVariant.sku,
              variant_label: variantLabel,
              color: variantLabel,
              image,
              size: selectedSize,
              stock_quantity: stock,
            }
          : item,
      );

      localStorage.setItem('cart', JSON.stringify(updatedCart));
      window.dispatchEvent(new Event('cartUpdated'));
      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 2000);
      bumpCart();
      return;
    }

    const newItem = {
      cart_key: cartKey,
      id: product.id,
      variant_id: activeVariant.id,
      variant_sku: activeVariant.sku,
      name: product.name,
      price,
      size: selectedSize,
      image,
      category: product.categories?.[0]?.name || 'Producto',
      variant_label: variantLabel,
      color: variantLabel,
      quantity: 1,
      stock_quantity: stock,
    };

    localStorage.setItem('cart', JSON.stringify([...currentCart, newItem]));
    window.dispatchEvent(new Event('cartUpdated'));
    setIsAdded(true);
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

  // cartTick fuerza recomputo al leer carrito
  void cartTick;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center text-sm">
        <span className="font-inter font-bold text-[12px] leading-[30px] tracking-[0.18px]">Selecciona tu talla</span>
        <span className="font-inter underline font-bold text-[12px] leading-[20px] tracking-[0.18px] cursor-pointer hover:text-black transition">
          Guía de tallas
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {sizes.map((size) => {
          const sizeState = sizeStatusByValue?.[size] ?? { exists: true, hasStock: true };
          const variantForSize = variantsBySize[size];
          const vStock = Math.max(0, Number(variantForSize?.stock_quantity ?? 0));
          const vInCart = getCartQtyForVariant(variantForSize?.id);
          const vRemaining = vStock - vInCart;
          const noWarehouseOrApi =
            !sizeState.exists || !sizeState.hasStock || (variantForSize && vStock <= 0);
          const consumedByCart = Boolean(variantForSize && vStock > 0 && vRemaining <= 0);
          const isUnavailableForVariant = noWarehouseOrApi || consumedByCart;

          return (
            <button
              key={size}
              type="button"
              disabled={isUnavailableForVariant}
              onClick={() => {
                if (isUnavailableForVariant) {
                  if (consumedByCart && variantForSize) {
                    toast.warning('Ya agregaste el máximo disponible para esta talla.', {
                      description: `Stock: ${vStock} unidad(es) para talla ${size}.`,
                    });
                  }
                  return;
                }
                onSelectSize(size);
              }}
              className={`
                w-12 h-10 flex items-center justify-center cursor-pointer
                border rounded-[4px] text-sm transition-all
                ${selectedSize === size
                  ? 'bg-black text-white border-black'
                  : isUnavailableForVariant
                  ? 'bg-white text-gray-400 border-gray-200 line-through cursor-not-allowed'
                  : 'bg-white text-gray-900 border-gray-200 hover:border-black'}
              `}
            >
              {size}
            </button>
          );
        })}
      </div>

      <div className="space-y-3 pt-4">
        <button
          type="button"
          disabled={!selectedSize || !activeVariant || cannotAddMore}
          onClick={handleAddToCart}
          className={`w-full py-4 rounded-sm font-medium text-[16px] transition active:scale-95 cursor-pointer ${
            isAdded
              ? 'bg-green-600 text-white'
              : !selectedSize || !activeVariant || cannotAddMore
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-black text-white hover:bg-zinc-800'
          }`}
        >
          {isAdded
            ? '¡Añadido al carrito!'
            : !activeVariant
            ? 'Selecciona una talla disponible'
            : isOutOfStock
            ? 'Agotado'
            : atCartLimit
            ? 'No hay mas disponibles'
            : selectedSize
            ? 'Añadir al carrito'
            : 'Selecciona una talla'}
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
