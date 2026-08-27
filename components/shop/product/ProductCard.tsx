'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  handleShopProductImageError,
  resolveShopProductImageSrc,
} from '@/lib/shopProductImage';
import { getProductUrl, type ProductUrlInput } from '@/lib/urls';
import { formatCategoryBreadcrumb } from '@/lib/categoryUrls';

interface ColorVariation {
  color_id: number;
  color_name: string;
  thumbnail_url: string;
  price: number;
  sale_price?: number | null;
  on_sale?: boolean;
  variant_sku?: string | null;
  seo_url?: string | null;
}

export interface Product {
  id: string | number;
  name: string;
  brand_name?: string;
  brand?: string;
  description?: string;
  price_regular?: number;
  base_price?: number;
  price?: number;
  sale_price?: number | null;
  on_sale?: boolean;
  stock_quantity?: number;
  images?: string[];
  is_new?: boolean;
  colors_count?: number;
  total_colors_count?: number;
  slug: string;
  seo_url?: string | null;
  sku?: string | null;
  variant_sku?: string | null;
  main_image_url?: string;
  external_image_url?: string | null;
  color_variations?: ColorVariation[];
  category_name?: string;
  created_at?: string;
}

interface ProductCardProps {
  product: Product;
  /** Etiqueta de listado virtual (ej. &quot;Lo nuevo&quot;, &quot;Promociones&quot;) */
  catalogBadge?: string | null;
}

function buildCardProductUrl(product: Product): string {
  const payload: ProductUrlInput = {
    name: product.name,
    brand_name: product.brand_name ?? product.brand,
    seo_url: product.seo_url,
    variant_sku: product.sku ?? product.variant_sku,
    sku: product.sku ?? undefined,
  };

  return getProductUrl(payload);
}

/** Precio: Poppins 700, 16px / 24px, tracking 0.18px, negro, alineado a la derecha */
function PriceBlock({
  isOnSale,
  currentPrice,
  currentSalePrice,
}: {
  isOnSale: boolean;
  currentPrice: number;
  currentSalePrice: number | null;
}) {
  if (isOnSale && currentSalePrice != null) {
    return (
      <span className="inline-flex shrink-0 items-baseline gap-1.5 tabular-nums">
        <span className="font-helvetica text-[11px] font-normal leading-[18px] tracking-[0.18px] text-[#54585AAB] line-through">
          ${currentPrice.toFixed(2)}
        </span>
        <span className="font-helvetica text-base font-bold leading-6 tracking-[0.18px] text-black">
          ${Number(currentSalePrice).toFixed(2)}
        </span>
      </span>
    );
  }

  return (
    <span className="shrink-0 whitespace-nowrap text-right font-helvetica text-base font-bold leading-6 tracking-[0.18px] text-black tabular-nums">
      ${currentPrice.toFixed(2)}
    </span>
  );
}

const brandTextClass =
  'font-helvetica font-normal uppercase text-[10px] leading-[11px] tracking-[0.18px] text-[#54585AAB]';

const productNameTextClass =
  'font-helvetica font-normal text-[12px] leading-[18px] tracking-[0.2px] text-black';

const categoryTextClass =
  'font-helvetica font-normal text-[12px] leading-[18px] tracking-[0.2px] text-[#54585AAB]';

const NEW_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

/** Precio de lista > 0; evita 0/NaN y strings inválidos (el list API mezcla `price` regular y `base_price` efectivo). */
function validPositiveAmount(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }
  const n = typeof value === 'number' ? value : parseFloat(String(value));
  if (!Number.isFinite(n) || n <= 0) {
    return undefined;
  }
  return n;
}

/** Solo front: promoción exige on_sale del grid; "Lo nuevo" usa is_new, fecha created_at (30 días), o el alcance del listado virtual. */
function qualifiesVirtualListTag(
  catalogBadge: string | null | undefined,
  product: Product,
): 'Promociones' | 'Lo nuevo' | null {
  if (catalogBadge === 'Promociones') {
    return product.on_sale ? 'Promociones' : null;
  }

  if (catalogBadge === 'Lo nuevo') {
    if (product.is_new === false) {
      return null;
    }
    if (product.is_new === true) {
      return 'Lo nuevo';
    }

    const raw = (product as Product & { created_at?: string }).created_at;
    if (raw) {
      const t = Date.parse(raw);
      if (!Number.isNaN(t) && Date.now() - t <= NEW_WINDOW_MS) {
        return 'Lo nuevo';
      }
      return null;
    }

    // Sin is_new ni fecha en el payload: el EP /lo-nuevo ya acota; la petición desde [slug] mantiene ese segmento.
    return 'Lo nuevo';
  }

  return null;
}

export default function ProductCard({ product, catalogBadge = null }: ProductCardProps) {
  const initialImage = resolveShopProductImageSrc(
    product.main_image_url || product.external_image_url || product.images?.[0],
  );
  const [isHovered, setIsHovered] = useState(false);
  const [displayedImage, setDisplayedImage] = useState(initialImage);
  const [transitionImage, setTransitionImage] = useState<string | null>(null);
  const [isTransitionVisible, setIsTransitionVisible] = useState(false);

  const currentPrice =
    validPositiveAmount(product.price_regular) ??
    validPositiveAmount(product.price) ??
    validPositiveAmount(product.base_price) ??
    0;

  const saleCandidate = validPositiveAmount(product.sale_price);

  const currentSalePrice =
    saleCandidate !== undefined && currentPrice > 0 && saleCandidate + 1e-6 < currentPrice
      ? saleCandidate
      : null;

  const isOnSale = currentSalePrice !== null;
  const displayBrand = product.brand_name || product.brand || '';
  const categoryDisplayLabel = formatCategoryBreadcrumb(product.category_name || product.description);
  const mainImage = resolveShopProductImageSrc(initialImage);

  const listTagLabel = qualifiesVirtualListTag(catalogBadge, product);

  const virtualListTagClass =
    'text-[9px] font-bold uppercase tracking-[0.12em] text-amber-600 sm:text-[10px]';

  useEffect(() => {
    setDisplayedImage(initialImage);
    setTransitionImage(null);
    setIsTransitionVisible(false);
  }, [initialImage]);

  useEffect(() => {
    if (!mainImage || mainImage === displayedImage) {
      return;
    }

    const nextImage = mainImage;
    let didCancel = false;
    const preloadImage = new Image();

    preloadImage.src = nextImage;
    preloadImage.onload = () => {
      if (didCancel) {
        return;
      }

      setTransitionImage(nextImage);
      setIsTransitionVisible(true);

      window.setTimeout(() => {
        if (didCancel) {
          return;
        }

        setDisplayedImage(nextImage);
        setTransitionImage(null);
        setIsTransitionVisible(false);
      }, 240);
    };

    return () => {
      didCancel = true;
    };
  }, [displayedImage, mainImage]);

  const imageHoverOverlay = (rounded: string) => (
    <div
      className={`pointer-events-none absolute inset-0 ${rounded} opacity-0 transition-opacity duration-500 ease-out ${
        isHovered ? 'opacity-100' : ''
      } bg-gradient-to-t from-zinc-900/35 via-transparent to-white/15 mix-blend-multiply`}
      aria-hidden
    />
  );

  const productDetailUrl = buildCardProductUrl(product);

  return (
    <>
      <div className="mx-auto w-full md:hidden">
        <Link
          href={productDetailUrl}
          className="group block transition-transform duration-300 ease-out active:scale-[0.98]"
        >
          <article
            className="relative overflow-hidden rounded-2xl border border-slate-100 bg-gradient-to-b from-white via-white to-zinc-50/90 p-[1px] shadow-[0_4px_28px_-8px_rgba(15,23,42,0.14),0_0_0_1px_rgba(255,255,255,0.08)_inset] transition-[box-shadow,border-color,transform] duration-500 ease-out group-hover:border-slate-300 group-hover:shadow-[0_20px_48px_-12px_rgba(15,23,42,0.2),0_0_40px_-12px_rgba(8,32,78,0.14)]"
          >
            <div className="overflow-hidden rounded-[0.9rem] bg-white/95 backdrop-blur-[2px]">
              <div className="relative aspect-square overflow-hidden bg-white p-3 sm:p-4">
                <div className="relative h-full w-full">
                  <img
                    src={resolveShopProductImageSrc(displayedImage)}
                    alt={product.name}
                    loading="lazy"
                    decoding="async"
                    onError={handleShopProductImageError}
                    className={`absolute inset-0 h-full w-full object-contain object-center transition-[opacity,transform,filter] duration-500 ease-out ${
                      isTransitionVisible ? 'opacity-0 scale-[1.02]' : 'opacity-100 scale-100'
                    } group-hover:scale-[1.04] group-hover:brightness-[1.02]`}
                  />
                  {transitionImage && (
                    <img
                      src={resolveShopProductImageSrc(transitionImage)}
                      alt={product.name}
                      loading="lazy"
                      decoding="async"
                      onError={handleShopProductImageError}
                      className={`absolute inset-0 h-full w-full object-contain object-center transition-[opacity,transform] duration-500 ease-out ${
                        isTransitionVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-[1.02]'
                      }`}
                    />
                  )}
                </div>
                <div
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 bg-gradient-to-t from-zinc-900/25 via-transparent to-white/20"
                  aria-hidden
                />
              </div>

              {listTagLabel && (
                <div className="px-3 pt-2">
                  <p className={virtualListTagClass}>{listTagLabel}</p>
                </div>
              )}

              <div className="relative px-3 py-3">
                <div className="space-y-1">
                  {!listTagLabel && product.is_new && (
                    <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-amber-600/90">Lo nuevo</p>
                  )}
                  <p className={brandTextClass}>{displayBrand}</p>
                  <div className="flex min-w-0 items-baseline gap-2">
                    <h3 className={`min-w-0 flex-1 truncate ${productNameTextClass}`}>{product.name}</h3>
                    <PriceBlock
                      isOnSale={isOnSale}
                      currentPrice={currentPrice}
                      currentSalePrice={currentSalePrice}
                    />
                  </div>
                  <p className={`line-clamp-2 ${categoryTextClass}`}>
                    {categoryDisplayLabel}
                  </p>
                </div>
              </div>
            </div>
          </article>
        </Link>
      </div>

      <div
        className="relative mx-auto hidden w-full max-w-42.5 self-start sm:max-w-55 md:block lg:max-w-64"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
        }}
      >
        <div
          className={`group relative w-full overflow-hidden rounded-2xl border bg-gradient-to-b from-white via-white to-zinc-50/90 p-[1px] shadow-[0_0px_0px_-0px_rgba(15,23,42,0.12),0_0_0_1px_rgba(255,255,255,0.06)_inset] transition-[box-shadow,border-color,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isHovered
              ? 'z-30 -translate-y-1 border-slate-300 shadow-[0_0px_0px_-0px_rgba(15,23,42,0.22),0_0_48px_-12px_rgba(8,32,78,0.16),0_0_0_1px_rgba(8,32,78,0.12)]'
              : 'z-0 translate-y-0 border-slate-100'
          }`}
        >
          <div className="rounded-[0.9rem] bg-white/95 p-1.5 backdrop-blur-[2px] sm:p-2">
            <Link
              href={productDetailUrl}
              className="block cursor-pointer rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-2"
            >
              <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-white p-3 sm:p-4">
                <div className="relative h-full w-full">
                  <img
                    src={resolveShopProductImageSrc(displayedImage)}
                    alt={product.name}
                    loading="lazy"
                    decoding="async"
                    onError={handleShopProductImageError}
                    className={`absolute inset-0 h-full w-full object-contain object-center transition-[opacity,transform,filter] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                      isTransitionVisible ? 'opacity-0 scale-[1.02]' : 'opacity-100'
                    } ${isHovered ? 'scale-105 brightness-[1.03]' : 'scale-100'}`}
                  />
                  {transitionImage && (
                    <img
                      src={resolveShopProductImageSrc(transitionImage)}
                      alt={product.name}
                      loading="lazy"
                      decoding="async"
                      onError={handleShopProductImageError}
                      className={`absolute inset-0 h-full w-full object-contain object-center transition-[opacity,transform] duration-500 ease-out ${
                        isTransitionVisible ? 'opacity-100 scale-105' : 'opacity-0 scale-[1.02]'
                      }`}
                    />
                  )}
                </div>
                {imageHoverOverlay('rounded-xl')}
              </div>
            </Link>

            {listTagLabel && (
              <div className="mt-2 px-0.5">
                <p className={virtualListTagClass}>{listTagLabel}</p>
              </div>
            )}

            <Link
              href={productDetailUrl}
              className="mt-1 block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-1"
            >
              <div
                className={`bg-transparent transition-[margin-top] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  isHovered ? 'mt-2' : 'mt-3 sm:mt-4'
                } pb-1`}
              >
                <div className="min-w-0 space-y-1">
                  {!listTagLabel && product.is_new && (
                    <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-amber-600/90 sm:text-[10px]">
                      Lo nuevo
                    </p>
                  )}
                  <p className={brandTextClass}>{displayBrand}</p>
                  <div className="flex min-w-0 items-baseline gap-2">
                    <h3 className={`min-w-0 flex-1 uppercase truncate ${productNameTextClass}`}>{product.name}</h3>
                    <PriceBlock
                      isOnSale={isOnSale}
                      currentPrice={currentPrice}
                      currentSalePrice={currentSalePrice}
                    />
                  </div>
                  <p className={`line-clamp-1 ${categoryTextClass}`}>
                    {categoryDisplayLabel}
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
