'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
  base_price?: number;
  price?: number;
    sale_price?: number | null;
    on_sale?: boolean;
  images?: string[];
  is_new?: boolean;
  colors_count?: number;
  total_colors_count?: number;
  slug: string;
  seo_url?: string | null;
  product_color?: string | null;
  variant_sku?: string | null;
  // Nuevas props del nuevo endpoint
  main_image_url?: string;
  color_variations?: ColorVariation[];
  category_name?: string;
  /** Opcional si algún payload lo incluye (sin cambios de API en grid). */
  created_at?: string;
}

interface ProductCardProps {
  product: Product;
  /** Etiqueta de listado virtual (ej. &quot;Lo nuevo&quot;, &quot;Promociones&quot;) */
  catalogBadge?: string | null;
}

function buildCardProductUrl(product: Product, color?: ColorVariation): string {
  const payload: ProductUrlInput = {
    name: product.name,
    brand_name: product.brand_name ?? product.brand,
    seo_url: color?.seo_url ?? product.seo_url,
    color_name: color?.color_name ?? product.product_color,
    variant_sku: color?.variant_sku ?? product.variant_sku,
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
        <span className="font-inter text-[11px] font-normal leading-[18px] tracking-[0.18px] text-[#54585AAB] line-through">
          ${currentPrice.toFixed(2)}
        </span>
        <span className="font-poppins text-base font-bold leading-6 tracking-[0.18px] text-black">
          ${Number(currentSalePrice).toFixed(2)}
        </span>
      </span>
    );
  }

  return (
    <span className="shrink-0 whitespace-nowrap text-right font-poppins text-base font-bold leading-6 tracking-[0.18px] text-black tabular-nums">
      ${currentPrice.toFixed(2)}
    </span>
  );
}

const brandTextClass =
  'font-inter font-normal uppercase text-[10px] leading-[11px] tracking-[0.18px] text-[#54585AAB]';

const productNameTextClass =
  'font-inter font-normal text-[12px] leading-[18px] tracking-[0.2px] text-black';

const categoryTextClass =
  'font-inter font-normal text-[12px] leading-[18px] tracking-[0.2px] text-[#54585AAB]';

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
  const initialImage = resolveShopProductImageSrc(product.main_image_url || product.images?.[0]);
  const [selectedColor, setSelectedColor] = useState<ColorVariation | null>(
    product.color_variations?.[0] ?? null
  );
  const [isHovered, setIsHovered] = useState(false);
  const [displayedImage, setDisplayedImage] = useState(initialImage);
  const [transitionImage, setTransitionImage] = useState<string | null>(null);
  const [isTransitionVisible, setIsTransitionVisible] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Listado / búsqueda: `price` y variante `price` son el regular; `base_price` suele ser el efectivo (puede ser oferta) — no priorizarlo sobre `price`.
  const currentPrice =
    validPositiveAmount(selectedColor?.price) ??
    validPositiveAmount(product.price) ??
    validPositiveAmount(product.base_price) ??
    0;

  const saleCandidate =
    selectedColor?.sale_price !== undefined && selectedColor?.sale_price !== null
      ? validPositiveAmount(selectedColor.sale_price)
      : validPositiveAmount(product.sale_price);

  const currentSalePrice =
    saleCandidate !== undefined && currentPrice > 0 && saleCandidate + 1e-6 < currentPrice
      ? saleCandidate
      : null;

  const isOnSale = currentSalePrice !== null;
  const displayBrand = product.brand_name || product.brand || '';
  const categoryDisplayLabel = formatCategoryBreadcrumb(product.category_name || product.description);
  const displayColorsCount = product.total_colors_count || product.colors_count || 0;
  const mainImage = resolveShopProductImageSrc(selectedColor?.thumbnail_url || initialImage);

  const colorVariations = product.color_variations ?? [];
  const hasColorVariations = colorVariations.length > 0;
  const showVariantNavArrows = colorVariations.length > 4;

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

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - 100 : scrollLeft + 100;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  const imageHoverOverlay = (rounded: string) => (
    <div
      className={`pointer-events-none absolute inset-0 ${rounded} opacity-0 transition-opacity duration-500 ease-out ${
        isHovered ? 'opacity-100' : ''
      } bg-gradient-to-t from-zinc-900/35 via-transparent to-white/15 mix-blend-multiply`}
      aria-hidden
    />
  );

  const productDetailUrl = buildCardProductUrl(product, colorVariations[0]);

  return (
    <>
      <div className="mx-auto w-full md:hidden">
        <Link
          href={productDetailUrl}
          className="group block transition-transform duration-300 ease-out active:scale-[0.98]"
        >
          <article
            className="relative overflow-hidden rounded-2xl border border-zinc-200/70 bg-gradient-to-b from-white via-white to-zinc-50/90 p-[1px] shadow-[0_4px_28px_-8px_rgba(15,23,42,0.14),0_0_0_1px_rgba(255,255,255,0.08)_inset] transition-[box-shadow,border-color,transform] duration-500 ease-out group-hover:border-amber-200/50 group-hover:shadow-[0_20px_48px_-12px_rgba(15,23,42,0.2),0_0_40px_-12px_rgba(210,159,19,0.14)]"
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
                  <p className="hidden text-[10px] text-zinc-400 tabular-nums group-hover:block">
                    <span className="mr-1 inline-block h-1 w-1 rounded-full bg-amber-400/80 align-middle" />
                    {displayColorsCount} colores
                  </p>
                </div>
              </div>
            </div>
          </article>
        </Link>
      </div>

      <div
        className="relative mx-auto hidden w-full max-w-42.5 self-start sm:max-w-55 lg:block lg:w-64 lg:max-w-none"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setSelectedColor(product.color_variations?.[0] || null);
        }}
      >
        <div
          className={`group relative w-full overflow-hidden rounded-2xl bg-gradient-to-b from-white via-white to-zinc-50/90 p-[1px] shadow-[0_0px_0px_-0px_rgba(15,23,42,0.12),0_0_0_1px_rgba(255,255,255,0.06)_inset] transition-[box-shadow,border-color,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isHovered
              ? 'z-30 -translate-y-1 border-amber-200/45 shadow-[0_0px_0px_-0px_rgba(15,23,42,0.22),0_0_48px_-12px_rgba(210,159,19,0.16),0_0_0_1px_rgba(210,159,19,0.12)]'
              : 'z-0 translate-y-0'
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

            {hasColorVariations && (
              <div
                className={`relative mt-2 max-w-full overflow-hidden transition-[max-height,opacity,transform,margin-top] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  isHovered
                    ? 'max-h-[4.75rem] translate-y-0 opacity-100'
                    : 'pointer-events-none max-h-0 -translate-y-1 opacity-0'
                }`}
              >
                {showVariantNavArrows && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      scroll('left');
                    }}
                    className="absolute left-0 top-1/2 z-40 -translate-y-1/2 rounded-full border border-white/15 bg-zinc-950/88 p-1.5 text-white shadow-[0_4px_16px_rgba(0,0,0,0.35)] backdrop-blur-md transition duration-300 hover:scale-110 hover:border-amber-400/35 hover:shadow-[0_0_20px_-4px_rgba(210,159,19,0.45)]"
                    aria-label="Ver variantes anteriores"
                  >
                    <ChevronLeft size={14} strokeWidth={2.25} />
                  </button>
                )}

                <div
                  ref={scrollRef}
                  className={`no-scrollbar flex max-w-full gap-1 overflow-x-auto overflow-y-hidden scroll-smooth py-0.5 ${
                    showVariantNavArrows ? 'px-7' : 'px-0.5'
                  }`}
                  style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
                >
                  <style jsx>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
                  {colorVariations.map((color) => (
                    <div
                      key={`${product.id}-${color.color_id}`}
                      role="button"
                      tabIndex={0}
                      onMouseEnter={() => {
                        setSelectedColor(color);
                      }}
                      onClick={() => {
                        window.location.href = buildCardProductUrl(product, color);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          window.location.href = buildCardProductUrl(product, color);
                        }
                      }}
                      className={`size-9 shrink-0 cursor-pointer overflow-hidden rounded-sm border bg-white transition-all duration-300 ${
                        selectedColor?.color_id === color.color_id
                          ? 'border-zinc-900 shadow-[0_2px_8px_rgba(0,0,0,0.22)] ring-1 ring-black/35'
                          : 'border-zinc-200/90 shadow-none hover:border-zinc-500 hover:shadow-[0_1px_5px_rgba(0,0,0,0.12)]'
                      }`}
                      title={color.color_name}
                    >
                      <img
                        src={resolveShopProductImageSrc(color.thumbnail_url)}
                        className="size-full object-cover"
                        alt={color.color_name}
                        onError={handleShopProductImageError}
                      />
                    </div>
                  ))}
                </div>

                {showVariantNavArrows && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      scroll('right');
                    }}
                    className="absolute right-0 top-1/2 z-40 -translate-y-1/2 rounded-full border border-white/15 bg-zinc-950/88 p-1.5 text-white shadow-[0_4px_16px_rgba(0,0,0,0.35)] backdrop-blur-md transition duration-300 hover:scale-110 hover:border-amber-400/35 hover:shadow-[0_0_20px_-4px_rgba(210,159,19,0.45)]"
                    aria-label="Ver más variantes"
                  >
                    <ChevronRight size={14} strokeWidth={2.25} />
                  </button>
                )}
              </div>
            )}

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
                  <p className="hidden text-[10px] text-zinc-400 sm:text-[11px] group-hover:block">
                    <span className="mr-1.5 inline-block h-1 w-1 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 align-middle shadow-[0_0_8px_rgba(210,159,19,0.5)]" />
                    <span className="tabular-nums">{displayColorsCount}</span> colores
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
