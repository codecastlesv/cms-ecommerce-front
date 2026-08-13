"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";
import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useShopFavorites } from "@/hooks/useShopFavorites";
import type { Swiper as SwiperType } from "swiper";

import "swiper/css";
import "swiper/css/navigation";
import {
  handleShopProductImageError,
  resolveShopProductImageSrc,
} from '@/lib/shopProductImage';
import { getProductUrl } from '@/lib/urls';
import { formatCategoryBreadcrumb } from '@/lib/categoryUrls';

/** Respuesta de GET /api/shop/home (ShopHomeController) */
export type HomeProductItem = {
  id: string | number;
  sku?: string;
  name: string;
  slug: string;
  seo_url?: string | null;
  brand?: string | null;
  product_color?: string | null;
  variant_sku?: string | null;
  price: number;
  sale_price?: number | null;
  discount?: number | null;
  image?: string | null;
  category_name?: string | null;
  tag?: string;
  is_featured?: boolean;
  total_colors_count?: number;
};

type ProductCollections = {
  best_sellers?: HomeProductItem[];
  new_arrivals?: HomeProductItem[];
  on_sale?: HomeProductItem[];
};

function normalizeCollections(
  raw: ProductCollections | null | undefined | unknown
): ProductCollections | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  return raw as ProductCollections;
}

export default function ProductSlider({
  products,
}: {
  products: ProductCollections | null | undefined;
}) {
  const collections = normalizeCollections(products);
  const [activeFilter, setActiveFilter] = useState<
    "masVendidos" | "nuevo" | "rebajas"
  >("masVendidos");
  const [visibleFilter, setVisibleFilter] = useState<
    "masVendidos" | "nuevo" | "rebajas"
  >("masVendidos");
  const [isSwitchingFilter, setIsSwitchingFilter] = useState(false);

  const { favoriteIds, requireAuthForFavorites, toggleFavorite } = useShopFavorites();
  const [processingId, setProcessingId] = useState<string | number | null>(null);

  const [swiperInstance, setSwiperInstance] = useState<SwiperType | null>(null);
  const [isBeginning, setIsBeginning] = useState(true);
  const [isEnd, setIsEnd] = useState(false);
  const [navEnabled, setNavEnabled] = useState(false);
  const filterTimeoutRef = useRef<number | null>(null);

  const isLoading = !collections;

  const syncSwiperNav = useCallback((swiper: SwiperType) => {
    swiper.update();
    setIsBeginning(swiper.isBeginning);
    setIsEnd(swiper.isEnd);
    // Swiper 9+: bloquea movimiento si todo entra en viewport
    const locked = Boolean(
      (swiper as SwiperType & { isLocked?: boolean }).isLocked
    );
    setNavEnabled(!locked && swiper.slides.length > 1);
  }, []);

  const handleFavoriteClick = async (productId: string | number) => {
    if (!requireAuthForFavorites()) return;

    setProcessingId(productId);
    try {
      const added = await toggleFavorite(productId);
      toast.success(
        added ? "Producto agregado a favoritos" : "Producto eliminado de favoritos"
      );
    } catch (error: unknown) {
      const responseMessage =
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof (error as { response?: { data?: { message?: unknown } } }).response
          ?.data?.message === "string"
          ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : null;

      toast.error(responseMessage || "No se pudo actualizar favoritos");
    } finally {
      setProcessingId(null);
    }
  };

  const filteredProducts = (() => {
    if (!collections) return [];
    if (visibleFilter === "masVendidos")
      return collections.best_sellers || [];
    if (visibleFilter === "nuevo") return collections.new_arrivals || [];
    if (visibleFilter === "rebajas") return collections.on_sale || [];
    return [];
  })();

  const switchFilter = (nextFilter: "masVendidos" | "nuevo" | "rebajas") => {
    if (nextFilter === activeFilter) return;

    setActiveFilter(nextFilter);
    setIsSwitchingFilter(true);

    if (filterTimeoutRef.current) {
      window.clearTimeout(filterTimeoutRef.current);
    }

    filterTimeoutRef.current = window.setTimeout(() => {
      setVisibleFilter(nextFilter);
      requestAnimationFrame(() => {
        setIsSwitchingFilter(false);
      });
    }, 160);
  };

  useEffect(() => {
    return () => {
      if (filterTimeoutRef.current) {
        window.clearTimeout(filterTimeoutRef.current);
      }
    };
  }, []);

  // Al cambiar lista de slides (filtro ya aplicado), re-sincroniza nav (evita flechas muertas en móvil)
  useEffect(() => {
    if (!swiperInstance) return;
    const id = window.setTimeout(() => {
      syncSwiperNav(swiperInstance);
    }, 60);
    return () => window.clearTimeout(id);
  }, [filteredProducts.length, swiperInstance, syncSwiperNav]);

  if (isLoading) {
    return (
      <div className="grid animate-pulse grid-cols-2 gap-6 px-4 md:grid-cols-4 md:px-0">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-100 rounded-sm bg-gray-100" />
        ))}
      </div>
    );
  }

  return (
    <div className="group relative px-4 md:px-0">
      <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-bebas text-[clamp(28px,5vw,36px)] font-normal uppercase leading-tight tracking-[2px] text-black md:leading-[1.05]">
            Nuestros productos
          </h2>
          <p className="font-inter mt-2 max-w-xl text-[14px] leading-snug text-slate-600 md:text-[16px]">
            Descubre lo último en deporte, recién llegado a nuestra tienda.
          </p>
        </div>
      </div>

      <div className="mb-8 grid w-full max-w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-2 font-inter sm:gap-3">
        <div
          className="flex min-h-0 min-w-0 gap-1.5 overflow-x-auto overflow-y-hidden overscroll-x-contain pr-2 pb-1 [-ms-overflow-style:none] [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:gap-3"
          role="group"
          aria-label="Filtrar productos"
        >
          {(["masVendidos", "nuevo", "rebajas"] as const).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => switchFilter(filter)}
              className={`shrink-0 whitespace-nowrap rounded-full px-2 py-2 text-[11px] font-semibold tracking-wide transition-all duration-300 sm:px-4 lg:px-6 lg:text-[12px] cursor-pointer ${
                activeFilter === filter
                  ? "scale-[1.02] bg-black text-white shadow-md"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {filter === "masVendidos" && "Más vendidos"}
              {filter === "nuevo" && "Nuevo ingreso"}
              {filter === "rebajas" && "Rebajas"}
            </button>
          ))}
        </div>
        <Link
          href="/lo-nuevo"
          className="shrink-0 self-center font-inter text-[12px] font-semibold text-black underline decoration-2 underline-offset-4 transition hover:text-zinc-600 md:text-[15px]"
        >
          Ver todos
        </Link>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="flex min-h-100 items-center justify-center rounded-xl border-2 border-dashed border-slate-100">
          <p className="font-inter text-center text-[16px] text-slate-500">
            No hay productos disponibles por el momento.
          </p>
        </div>
      ) : (
        <div className="relative overflow-visible">
          <div
            className={`transition-all duration-300 ease-out ${
              isSwitchingFilter
                ? "translate-y-3 scale-[0.99] opacity-0"
                : "translate-y-0 scale-100 opacity-100"
            }`}
          >
            <Swiper
              key={visibleFilter}
              watchOverflow
              observer
              observeParents
              onSwiper={(swiper) => {
                setSwiperInstance(swiper);
                syncSwiperNav(swiper);
              }}
              onSlideChange={(swiper) => {
                setIsBeginning(swiper.isBeginning);
                setIsEnd(swiper.isEnd);
              }}
              onResize={(swiper) => syncSwiperNav(swiper)}
              spaceBetween={12}
              slidesPerView={2}
              breakpoints={{
                768: { slidesPerView: 3, spaceBetween: 20 },
                1024: { slidesPerView: 4, spaceBetween: 24 },
              }}
              className="!pb-6 overflow-x-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            >
              {filteredProducts.map((product) => {
                const detailHref = getProductUrl({
                  name: product.name,
                  brand: product.brand,
                  seo_url: product.seo_url,
                  product_color: product.product_color,
                  variant_sku: product.variant_sku,
                });
                const hasSale =
                  product.sale_price != null &&
                  product.sale_price > 0 &&
                  product.sale_price < product.price;
                const displayPrice = hasSale
                  ? product.sale_price!
                  : product.price;
                const colors = Math.max(
                  0,
                  Number(product.total_colors_count) || 0
                );

                return (
                  <SwiperSlide key={product.id} className="!h-auto pt-1">
                    <article className="group/card flex h-full flex-col overflow-hidden rounded-lg border border-slate-200/90 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.05)] transition-all duration-500 ease-out hover:-translate-y-1 hover:border-black hover:shadow-[0_20px_44px_-12px_rgba(15,23,42,0.12)]">
                      <div className="relative mb-3 aspect-square shrink-0 overflow-hidden bg-[#F6F6F6]">
                        <Link
                          href={detailHref}
                          className="relative block h-full w-full"
                          aria-label={`Ver ${product.name}`}
                        >
                          <Image
                            src={resolveShopProductImageSrc(product.image)}
                            alt={product.name}
                            width={480}
                            height={480}
                            unoptimized
                            onError={handleShopProductImageError}
                            className="h-full w-full object-cover transition-transform duration-[650ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/card:scale-105"
                          />
                        </Link>
                        {product.tag ? (
                          <span className="pointer-events-none absolute left-0 top-0 z-10 rounded-br-sm bg-black px-2.5 py-1 font-inter text-[9px] font-bold uppercase tracking-wider text-white sm:text-[10px]">
                            {product.tag}
                          </span>
                        ) : null}

                        <button
                          type="button"
                          onClick={() => handleFavoriteClick(product.id)}
                          className="absolute right-2 top-2 z-20 rounded-full border border-slate-200/90 bg-white/95 p-2 shadow-sm backdrop-blur-sm transition hover:scale-105 hover:border-slate-300 hover:bg-white sm:right-3 sm:top-3"
                          disabled={processingId === product.id}
                          aria-label="Favoritos"
                        >
                          {processingId === product.id ? (
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-black" />
                          ) : favoriteIds.includes(Number(product.id)) ? (
                            <AiFillHeart size={18} className="text-red-500" />
                          ) : (
                            <AiOutlineHeart size={18} className="text-slate-600" />
                          )}
                        </button>
                      </div>

                      <div className="flex min-h-0 flex-1 flex-col px-2.5 pb-2 pt-0 sm:px-3">
                        <p className="font-inter text-[10px] font-semibold uppercase leading-tight tracking-wide text-slate-400">
                          {product.brand || "Marca"}
                        </p>
                        <div className="mt-1.5 flex min-h-[44px] items-start justify-between gap-2">
                          <h3 className="font-inter line-clamp-2 min-w-0 flex-1 text-left text-[12px] font-bold uppercase leading-snug tracking-wide text-black sm:text-[13px]">
                            {product.name}
                          </h3>
                          <div className="shrink-0 text-right leading-none">
                            {hasSale && (
                              <span className="font-inter mr-1 text-[11px] text-slate-400 line-through">
                                ${Number(product.price).toFixed(2)}
                              </span>
                            )}
                            <span className="font-poppins text-[15px] font-black text-black sm:text-[16px]">
                              ${Number(displayPrice).toFixed(2)}
                            </span>
                          </div>
                        </div>
                        <p className="font-inter mt-1 line-clamp-2 text-[11px] leading-snug text-slate-500 sm:text-[12px]">
                          {formatCategoryBreadcrumb(product.category_name) || ""}
                        </p>
                        {colors > 0 ? (
                          <p className="font-inter mt-1.5 text-[11px] font-medium text-slate-500">
                            {colors}{" "}
                            {colors === 1 ? "color" : "colores"}
                          </p>
                        ) : null}
                      </div>

                      <div className="mt-auto px-2.5 pb-3 sm:px-3">
                        <Link
                          href={detailHref}
                          className="font-inter flex w-full items-center justify-center rounded-lg border border-slate-300 bg-white py-3 text-[13px] font-bold text-black transition duration-300 hover:border-black hover:bg-black hover:text-white active:scale-[0.98] sm:py-3.5 sm:text-[14px]"
                        >
                          Agregar
                        </Link>
                      </div>
                    </article>
                  </SwiperSlide>
                );
              })}
            </Swiper>
          </div>

          {filteredProducts.length > 1 && navEnabled && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  swiperInstance?.slidePrev();
                }}
                disabled={isBeginning}
                aria-label="Anterior"
                className={`absolute left-0 top-[32%] z-10 flex h-10 w-10 -translate-x-1 items-center justify-center rounded-md border border-slate-300 bg-white text-black shadow-md transition sm:-left-3 sm:h-11 sm:w-11 md:-left-5 ${
                  isBeginning
                    ? "pointer-events-none cursor-default opacity-35"
                    : "cursor-pointer opacity-100 hover:border-black hover:bg-slate-50 active:scale-95"
                }`}
              >
                <ChevronLeft size={20} strokeWidth={2} />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  swiperInstance?.slideNext();
                }}
                disabled={isEnd}
                aria-label="Siguiente"
                className={`absolute right-0 top-[32%] z-10 flex h-10 w-10 translate-x-1 items-center justify-center rounded-md border border-slate-300 bg-white text-black shadow-md transition sm:-right-3 sm:h-11 sm:w-11 md:-right-5 ${
                  isEnd
                    ? "pointer-events-none cursor-default opacity-35"
                    : "cursor-pointer opacity-100 hover:border-black hover:bg-slate-50 active:scale-95"
                }`}
              >
                <ChevronRight size={20} strokeWidth={2} />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
