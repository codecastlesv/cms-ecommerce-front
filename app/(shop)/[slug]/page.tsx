"use client";

import { useEffect, useState, use, useTransition, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { normalizeCategoryPublicSlug } from '@/lib/categoryUrls';
import ProductCard from '@/components/shop/product/ProductCard';
import CategoryFilterSidebar from '@/components/shop/category/CategoryFilterSidebar';
import CategoryBreadcrumbs from '@/components/shop/category/CategoryBreadcrumbs';
import { AlertCircle, SlidersHorizontal, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CategoryPageProps {
  params: Promise<{
    slug: string;
  }>;
}

interface CategoryFiltersResponse {
  current_category: { id: number | string; name: string; slug: string };
  category_breadcrumb?: { name: string; slug: string }[];
  category_navigation: CategoryNavItem[];
  brands: Brand[];
  sports: Brand[];
  dynamic_filters: DynamicFilter[];
  price_range: { min: number; max: number };
}

interface CategoryNavItem {
  id: number;
  name: string;
  slug: string;
  products_count: number;
  sub_categories?: CategoryNavItem[];
}

interface Brand {
  id: number;
  name: string;
  slug: string;
  products_count: number;
}

interface FilterOption {
  id: number;
  label: string;
  slug: string;
  color_hex?: string;
}

interface DynamicFilter {
  name: string;
  slug: string;
  style: 'COLOR' | 'BUTTON' | 'SELECT';
  options: FilterOption[];
}

interface Product {
  id: number | string;
  name: string;
  slug: string;
  main_image_url: string;
  /** Precio de lista del producto base ( segun el EP delcatálogo). */
  base_price: number;
  sale_price?: number | null;
  brand_name: string;
  category_name: string;
  color_variations: ColorVariation[];
  total_colors_count: number;
  tallas_totales?: string[];
  on_sale?: boolean;
}

interface ColorVariation {
  color_id: number;
  color_name: string;
  thumbnail_url: string;
  price: number;
  sale_price?: number | null;
  tallas_disponibles?: string[];
}

/** Replica la lógica de precio efectivo del catálogo (COALESCE rebajado válido sobre regular). */
const storefrontDisplayUnit = (regular: unknown, sale: unknown): number => {
  const reg = Number(regular);
  if (!Number.isFinite(reg) || reg <= 0) return NaN;
  const sal = sale !== null && sale !== undefined && sale !== '' ? Number(sale) : NaN;
  if (Number.isFinite(sal) && sal > 0 && sal < reg) return sal;

  return reg;
};

const normalizeComparableSize = (raw: string): string =>
  String(raw)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

const getTallaFilterOptions = (filtersData: CategoryFiltersResponse | null) =>
  filtersData?.dynamic_filters?.find((f) => f.slug.toLowerCase() === 'talla')?.options;

/**
 * Sinónimos para comparar con tallas_totales / tallas_disponibles (valores como "5", "10").
 * La URL puede llevar attribute_values.id (p. ej. "39")
 */
const buildSynonymsForSizeSlug = (
  rawSlug: string,
  filtersData: CategoryFiltersResponse | null
): Set<string> => {
  const synonyms = new Set<string>();
  const add = (s: unknown) => {
    const cmp = normalizeComparableSize(String(s ?? ''));
    if (cmp) synonyms.add(cmp);
  };

  add(rawSlug);

  const tallaOpts = getTallaFilterOptions(filtersData);
  const trimmed = String(rawSlug).trim();

  if (tallaOpts && /^\d+$/.test(trimmed)) {
    const byId = tallaOpts.find((opt) => String(opt.id) === trimmed);
    if (byId) {
      add(byId.id);
      add(byId.slug);
      add(byId.label);
      return synonyms;
    }
  }

  const slugCmp = normalizeComparableSize(trimmed);
  const bySlug = tallaOpts?.find((opt) => normalizeComparableSize(opt.slug) === slugCmp);
  const byLabel = tallaOpts?.find((opt) => normalizeComparableSize(opt.label) === slugCmp);
  const matched = bySlug ?? byLabel;

  if (matched) {
    add(matched.id);
    add(matched.slug);
    add(matched.label);
  }

  return synonyms;
};

/** Convierte tokens de `size` en la URL a ids que el backend interpreta bien. */
const mapSizeUrlTokenToAttributeValueId = (
  token: string,
  filtersData: CategoryFiltersResponse | null
): string => {
  const tallaOpts = getTallaFilterOptions(filtersData);
  if (!tallaOpts) {
    return token;
  }

  const part = token.trim();
  if (!part) {
    return token;
  }

  if (/^\d+$/.test(part)) {
    const byId = tallaOpts.find((opt) => String(opt.id) === part);
    if (byId) {
      return String(byId.id);
    }
  }

  const bySlug = tallaOpts.find((opt) => normalizeComparableSize(opt.slug) === normalizeComparableSize(part));
  if (bySlug) {
    return String(bySlug.id);
  }

  const byLabel = tallaOpts.find((opt) => normalizeComparableSize(opt.label) === normalizeComparableSize(part));
  if (byLabel) {
    return String(byLabel.id);
  }

  return part;
};

const remapSizeQueryForBackend = (apiParams: URLSearchParams, filtersData: CategoryFiltersResponse | null): void => {
  if (!filtersData || !getTallaFilterOptions(filtersData)?.length) {
    return;
  }

  const raw = apiParams.get('size');
  if (!raw?.trim()) {
    return;
  }

  const mapped = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((token) => mapSizeUrlTokenToAttributeValueId(token, filtersData));

  apiParams.delete('size');
  const joined = mapped.join(',');
  if (joined) {
    apiParams.set('size', joined);
  }
};

const collectComparableSizesOnProduct = (product: Product): Set<string> => {
  const out = new Set<string>();
  const add = (s: unknown) => {
    const cmp = normalizeComparableSize(String(s ?? ''));
    if (cmp) out.add(cmp);
  };

  for (const t of product.tallas_totales ?? []) add(t);
  for (const v of product.color_variations ?? []) {
    for (const t of v.tallas_disponibles ?? []) add(t);
  }

  return out;
};

/** true si el producto tiene al menos una de las tallas seleccionadas (OR). */
const productMatchesSizeFilters = (
  product: Product,
  selectedSlugs: string[],
  filtersData: CategoryFiltersResponse | null
): boolean => {
  if (selectedSlugs.length === 0) {
    return true;
  }

  const onProduct = collectComparableSizesOnProduct(product);

  return selectedSlugs.some((slug) => {
    const synonyms = buildSynonymsForSizeSlug(slug, filtersData);
    for (const syn of synonyms) {
      if (onProduct.has(syn)) return true;
    }
    return false;
  });
};

/** Lectura estable desde la URL (antes de pasar tallas a size[] para la API). */
const parseSizeSlugsFromSearchParams = (sp: URLSearchParams): string[] => {
  const raw = sp.get('size') ?? sp.get('talla');
  if (raw?.trim()) {
    return raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  const bracket = sp.getAll('size[]');
  if (bracket.length > 0) {
    return bracket.map((s) => s.trim()).filter(Boolean);
  }

  return [];
};

/** Slugs de catálogo  (API: `/shop/store/catalog/{slug}`) */
const SPECIAL_CATALOG_PAGE_BADGE: Record<string, string> = {
  'lo-nuevo': 'Lo nuevo',
  promociones: 'Promociones',
};

const productMatchesPrice = (product: Product, minPrice?: number, maxPrice?: number): boolean => {
  const candidatePrices = [
    storefrontDisplayUnit(product.base_price, product.sale_price),
    ...(product.color_variations ?? []).map((variation) =>
      storefrontDisplayUnit(variation.price, variation.sale_price)
    ),
  ].filter((price) => Number.isFinite(price) && price > 0);

  if (candidatePrices.length === 0) {
    return true;
  }

  return candidatePrices.some((price) => {
    if (typeof minPrice === 'number' && price < minPrice) {
      return false;
    }

    if (typeof maxPrice === 'number' && price > maxPrice) {
      return false;
    }

    return true;
  });
};

export default function CategoryPage({ params }: CategoryPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { slug } = use(params);
  const [, startTransition] = useTransition();

  // Estados de datos
  const [products, setProducts] = useState<Product[]>([]);
  const [filtersData, setFiltersData] = useState<CategoryFiltersResponse | null>(null);
  
  // Estados de control de UI
  const [filtersLoading, setFiltersLoading] = useState(true);
  const [filtersRevealed, setFiltersRevealed] = useState(false);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsRevealed, setProductsRevealed] = useState(false);
  const [pageReady, setPageReady] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [categoryNotFound, setCategoryNotFound] = useState(false);

  // Derivados de la URL
  const currentFilters = Object.fromEntries(searchParams.entries());
  const selectedCategorySlug = normalizeCategoryPublicSlug(currentFilters.category || String(slug ?? ''));
  const catalogRouteSlug = normalizeCategoryPublicSlug(
    String(slug ?? '')
      .trim()
      .toLowerCase()
      .replace(/_/g, '-'),
  );
  const catalogPageBadge = SPECIAL_CATALOG_PAGE_BADGE[catalogRouteSlug] ?? null;
  const isVirtualCatalogRoute =
    catalogRouteSlug === 'lo-nuevo' || catalogRouteSlug === 'promociones';
  const catalogApiSlug = isVirtualCatalogRoute ? catalogRouteSlug : selectedCategorySlug;

  /**
   * 1. CARGA INICIAL DE FILTROS
   * Solo se ejecuta cuando el slug principal cambia
   */
  useEffect(() => {
    const fetchFilters = async () => {
      setFiltersLoading(true);
      try {
        const response = await api.get(`/shop/store/filters/${catalogRouteSlug}`);
        if (response.data?.status === 'success') {
          setFiltersData(response.data.data);
          setCategoryNotFound(false);
        }
      } catch (error) {
        const err = error as { response?: { status: number } };
        if (err.response?.status === 404) setCategoryNotFound(true);
        console.error('Error cargando filtros sidebar:', error);
      } finally {
        setFiltersLoading(false);
      }
    };
    fetchFilters();
  }, [catalogRouteSlug]);

  /**
   * 2. CARGA DE PRODUCTOS (CATÁLOGO)
   * Se ejecuta cada vez que cambian los filtros o la categoría seleccionada
   */
  const fetchProducts = useCallback(async () => {
    setProductsLoading(true);
    try {
      // En catálogo normal el segmento de categoría va en la URL; en virtual (lo-nuevo / promociones)
      // el segmento se mantiene y el filtro por categoría va como query `category`.
      const apiParams = new URLSearchParams(searchParams.toString());
      if (!isVirtualCatalogRoute) {
        apiParams.delete('category');
      }

      const reservedSingleValueParams = new Set([
        'category',
        'page',
        'price_min',
        'price_max',
        'min_price',
        'max_price',
      ]);

      const normalizeMultiValueParams = (): void => {
        Array.from(new Set(apiParams.keys())).forEach((paramKey) => {
          if (reservedSingleValueParams.has(paramKey)) {
            return;
          }

          const rawValue = apiParams.get(paramKey);

          if (!rawValue || !rawValue.includes(',')) {
            return;
          }

          apiParams.delete(paramKey);
          rawValue
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean)
            .forEach((value) => {
              apiParams.append(`${paramKey}[]`, value);
            });
        });
      };

      // si llega talla en URL, la mapeamos a size.
      if (!apiParams.get('size') && apiParams.get('talla')) {
        apiParams.set('size', apiParams.get('talla') as string);
      }
      apiParams.delete('talla');

      remapSizeQueryForBackend(apiParams, filtersData);

      normalizeMultiValueParams();

      // Compatibilidad de llaves de precio para distintos contratos de API.
      const nextPriceMin = apiParams.get('price_min') ?? apiParams.get('min_price');
      const nextPriceMax = apiParams.get('price_max') ?? apiParams.get('max_price');

      if (nextPriceMin) {
        apiParams.set('price_min', nextPriceMin);
        apiParams.set('min_price', nextPriceMin);
      }

      if (nextPriceMax) {
        apiParams.set('price_max', nextPriceMax);
        apiParams.set('max_price', nextPriceMax);
      }

    
      const catalogRange = filtersData?.price_range;
      if (catalogRange) {
        const aminRaw = apiParams.get('price_min') ?? apiParams.get('min_price');
        const amaxRaw = apiParams.get('price_max') ?? apiParams.get('max_price');

        if (aminRaw !== null && amaxRaw !== null) {
          const amin = Math.round(Number(aminRaw));
          const amax = Math.round(Number(amaxRaw));
          const cmin = Math.round(Number(catalogRange.min));
          const cmax = Math.round(Number(catalogRange.max));

          if (Number.isFinite(amin) && Number.isFinite(amax) && amin === cmin && amax === cmax) {
            ['price_min', 'price_max', 'min_price', 'max_price'].forEach((pk) =>
              apiParams.delete(pk)
            );
          }
        }
      }

      // Convertir URLSearchParams a objeto, preservando arrays
      const paramsObj: Record<string, string | string[]> = {};
      Array.from(new Set(apiParams.keys())).forEach((key) => {
        const values = apiParams.getAll(key);
        if (values.length === 1) {
          paramsObj[key] = values[0];
        } else {
          paramsObj[key] = values;
        }
      });

      const response = await api.get(`/shop/store/catalog/${catalogApiSlug}`, {
        params: paramsObj
      });

      if (response.data?.status === 'success') {
        const apiProducts: Product[] = response.data.data || [];
        const selectedSizeSlugs = parseSizeSlugsFromSearchParams(searchParams);
        const selectedPriceMin = apiParams.get('price_min') ?? apiParams.get('min_price');
        const selectedPriceMax = apiParams.get('price_max') ?? apiParams.get('max_price');

        const minPrice = selectedPriceMin !== null ? Number(selectedPriceMin) : undefined;
        const maxPrice = selectedPriceMax !== null ? Number(selectedPriceMax) : undefined;

        const hasMinPrice = Number.isFinite(minPrice);
        const hasMaxPrice = Number.isFinite(maxPrice);

        const filteredProducts = apiProducts.filter((product) => {
          const matchesSize = productMatchesSizeFilters(product, selectedSizeSlugs, filtersData);
          const matchesPrice = hasMinPrice || hasMaxPrice
            ? productMatchesPrice(
              product,
              hasMinPrice ? minPrice : undefined,
              hasMaxPrice ? maxPrice : undefined
            )
            : true;

          return matchesSize && matchesPrice;
        });

        setProducts(filteredProducts);
        setCategoryNotFound(false);
      }
    } catch (error) {
      const err = error as { response?: { status: number } };
      if (err.response?.status === 404) setCategoryNotFound(true);
      console.error('Error cargando productos catálogo:', error);
    } finally {
      setProductsLoading(false);
    }
  }, [catalogApiSlug, isVirtualCatalogRoute, searchParams, filtersData]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    if (!mobileFiltersOpen) {
      return undefined;
    }
    const closeOnEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileFiltersOpen(false);
      }
    };
    window.addEventListener('keydown', closeOnEscape);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', closeOnEscape);
      document.body.style.overflow = prevOverflow;
    };
  }, [mobileFiltersOpen]);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setPageReady(true);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [slug]);

  useEffect(() => {
    if (filtersLoading) {
      setFiltersRevealed(false);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setFiltersRevealed(true);
    }, 80);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [filtersLoading]);

  useEffect(() => {
    if (productsLoading) {
      setProductsRevealed(false);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setProductsRevealed(true);
    }, 80);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [productsLoading, products]);

  /**
   * 3. MANEJADORES DE EVENTOS
   */
  const handleFilterChange = (key: string, value: string | null) => {
    const newParams = new URLSearchParams(searchParams.toString());
    
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    
    // Al filtrar, siempre regresamos a la página 1
    newParams.delete('page');

    startTransition(() => {
      router.push(`?${newParams.toString()}`, { scroll: false });
    });
  };

  const handleShopPriceRangeCommit = useCallback(
    (draftMin: number, draftMax: number) => {
      const ranges = filtersData?.price_range;
      const newParams = new URLSearchParams(searchParams.toString());

      if (!ranges) {
        newParams.set('price_min', String(Math.round(draftMin)));
        newParams.set('price_max', String(Math.round(draftMax)));
        newParams.delete('min_price');
        newParams.delete('max_price');
        newParams.delete('page');

        startTransition(() => {
          router.push(`?${newParams.toString()}`, { scroll: false });
        });
        return;
      }

      const amin = Math.round(draftMin);
      const amax = Math.round(draftMax);
      const cmin = Math.round(Number(ranges.min));
      const cmax = Math.round(Number(ranges.max));

      if (amin === cmin && amax === cmax) {
        ['price_min', 'price_max', 'min_price', 'max_price'].forEach((key) =>
          newParams.delete(key)
        );
      } else {
        newParams.set('price_min', String(amin));
        newParams.set('price_max', String(amax));
        newParams.delete('min_price');
        newParams.delete('max_price');
      }

      newParams.delete('page');

      startTransition(() => {
        router.push(`?${newParams.toString()}`, { scroll: false });
      });
    },
    [filtersData, searchParams, router, startTransition]
  );

  const handleCategoryNavigate = (nextSlug: string | null) => {
    const newParams = new URLSearchParams(searchParams.toString());

    if (nextSlug === null) {
      newParams.delete('category');
    } else {
      newParams.set('category', nextSlug);
    }

    newParams.delete('page');

    startTransition(() => {
      router.push(`?${newParams.toString()}`, { scroll: false });
    });
  };

  // Pantalla de error 404
  if (categoryNotFound) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-6">
        <AlertCircle className="w-16 h-16 text-zinc-200 mb-4" />
        <h2 className="text-2xl font-black uppercase tracking-tighter mb-2">Categoría no disponible</h2>
        <p className="text-zinc-500 mb-8 text-center max-w-xs">Lo sentimos, no pudimos encontrar lo que buscabas.</p>
        <button onClick={() => router.push('/')} className="bg-black text-white px-10 py-4 font-black uppercase text-xs tracking-widest hover:bg-zinc-800 transition">
          Ir a la tienda
        </button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-white transition-[opacity,transform] duration-300 ease-out ${pageReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'}`}>
      {/* --- CONTENIDO PRINCIPAL --- */}
      <div className="container mx-auto px-4 relative bg-white">
        {!filtersLoading && filtersData?.current_category ? (
          <div className="pt-4 pb-2 md:px-20 xl:px-40">
            <CategoryBreadcrumbs
              currentCategory={filtersData.current_category}
              categoryBreadcrumb={filtersData.category_breadcrumb}
              categoryNavigation={filtersData.category_navigation}
              selectedCategorySlug={selectedCategorySlug}
            />
          </div>
        ) : null}

        <div className="flex w-full min-w-0 flex-col items-stretch gap-8 py-6 lg:px-20 xl:px-40 md:flex-row md:items-start">
          <div className="flex w-full items-start justify-between gap-3 pb-4 md:hidden">
            <div className="min-w-0 flex-1">
              {filtersLoading || productsLoading ? (
                <div aria-hidden className={catalogPageBadge ? 'space-y-1.5' : ''}>
                  {catalogPageBadge ? (
                    <div className="h-3 w-28 max-w-[50%] rounded bg-amber-100/80 animate-pulse" />
                  ) : null}
                  <div className="h-[18px] w-full max-w-[15rem] rounded bg-gray-200 animate-pulse sm:max-w-[18rem]" />
                </div>
              ) : (
                <>
                  {catalogPageBadge && (
                    <p className="mb-1 font-inter text-[11px] font-bold tracking-wide text-[#D29F13]">
                      {catalogPageBadge}
                    </p>
                  )}
                  <h1 className="text-[14px] font-black uppercase tracking-tight">
                    RESULTADOS ({products.length})
                  </h1>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => setMobileFiltersOpen((current) => !current)}
              className={`shrink-0 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest transition hover:text-gray-600 ${
                filtersLoading || productsLoading ? 'pointer-events-none opacity-40' : ''
              }`}
            >
              filtro
              <SlidersHorizontal size={14} aria-hidden />
            </button>
          </div>

          <AnimatePresence>
            {mobileFiltersOpen ? (
              <motion.div
                key="shop-mobile-filter-sheet"
                className="fixed inset-0 z-50 md:hidden"
                role="presentation"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
              >
                <button
                  type="button"
                  aria-label="Cerrar filtros"
                  onClick={() => setMobileFiltersOpen(false)}
                  className="absolute inset-0 z-0 bg-black/45 backdrop-blur-[4px]"
                />

                <motion.div
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="shop-mobile-filters-title"
                  tabIndex={-1}
                  className="absolute inset-x-3 top-[4.75rem] bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-10 mx-auto flex max-h-[calc(100dvh-6rem)] w-full max-w-lg flex-col overflow-hidden rounded-[1.35rem] border border-zinc-200/90 bg-white shadow-[0_-8px_60px_-12px_rgba(15,23,42,0.45)]"
                  initial={{ y: 72, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 56, opacity: 0 }}
                  transition={{
                    type: 'spring',
                    stiffness: 420,
                    damping: 36,
                    mass: 0.65,
                  }}
                >
                  <div className="flex shrink-0 items-start justify-between gap-3 border-b border-zinc-100 bg-gradient-to-b from-zinc-50/85 to-white px-4 py-3.5">
                    <div className="min-w-0 pr-3">
                      <p className="font-inter text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-400">
                        Refinar búsqueda
                      </p>
                      <h2 id="shop-mobile-filters-title" className="mt-1 text-[15px] font-black uppercase tracking-tight text-zinc-900">
                        Filtros
                      </h2>
                    </div>
                    <button
                      type="button"
                      aria-label="Cerrar panel de filtros"
                      onClick={() => setMobileFiltersOpen(false)}
                      className="shrink-0 rounded-full p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                    >
                      <X size={16} aria-hidden />
                    </button>
                  </div>

                  <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-4">
                    {filtersLoading ? (
                      <div className="space-y-3" aria-busy="true" aria-label="Cargando filtros">
                        {[...Array(5)].map((_, idx) => (
                          <div
                            key={idx}
                            className="flex animate-pulse items-center justify-between gap-3 rounded-2xl border border-zinc-200/75 bg-white px-4 py-3.5 shadow-[0_10px_40px_-24px_rgba(15,23,42,0.35)]"
                          >
                            <div className="h-4 max-w-[14rem] flex-1 rounded bg-zinc-200" />
                            <div className="h-[18px] w-[18px] shrink-0 rounded-sm bg-zinc-100" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      filtersData && (
                        <CategoryFilterSidebar
                          filtersData={filtersData}
                          activeFilters={currentFilters}
                          onFilterChange={handleFilterChange}
                          onShopPriceRangeCommit={handleShopPriceRangeCommit}
                          selectedCategorySlug={selectedCategorySlug}
                          onCategoryNavigate={handleCategoryNavigate}
                          mobileMode
                          onMobileSheetClose={() => setMobileFiltersOpen(false)}
                        />
                      )
                    )}
                  </div>
                </motion.div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          {/* SIDEBAR FILTROS - STICKY */}
          <aside className="hidden md:block w-64 shrink-0 sticky top-24 self-start">
            <div className="pb-5 mb-5 relative h-7">
              <div
                className={`absolute inset-0 transition-[opacity,transform] duration-300 ease-out ${
                  filtersLoading
                    ? 'opacity-100 translate-y-0'
                    : 'pointer-events-none opacity-0 -translate-y-1'
                }`}
              >
                <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
              </div>
              <div
                className={`transition-[opacity,transform] duration-300 ease-out ${
                  filtersLoading
                    ? 'pointer-events-none opacity-0 translate-y-1'
                    : 'opacity-100 translate-y-0'
                }`}
              >
                {catalogPageBadge && (
                  <p className="mb-1 font-inter text-[12px] font-bold tracking-[0.2px] text-[#D29F13]">
                    {catalogPageBadge}
                  </p>
                )}
                <h1 className="text-black font-bebas text-[20px] leading-5.75 tracking-[1px] font-normal">
                  TIENDA PRODUCTOS ({products.length})
                </h1>
              </div>
            </div>
            <div className="relative">
              <div
                className={`absolute inset-0 transition-[opacity,transform] duration-300 ease-out ${
                  filtersLoading || !filtersRevealed
                    ? 'opacity-100 translate-y-0'
                    : 'pointer-events-none opacity-0 -translate-y-1'
                }`}
              >
                <div className="animate-pulse space-y-4 py-2">
                  <div className="h-4 w-24 bg-gray-200 rounded" />
                  {[...Array(7)].map((_, index) => (
                    <div key={index} className="space-y-2 border-t border-gray-100 pt-3">
                      <div className="h-3 w-20 bg-gray-200 rounded" />
                      <div className="space-y-1.5">
                        <div className="h-2.5 w-full bg-gray-100 rounded" />
                        <div className="h-2.5 w-5/6 bg-gray-100 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div
                className={`transition-[opacity,transform] duration-300 ease-out ${
                  filtersLoading || !filtersRevealed
                    ? 'pointer-events-none opacity-0 translate-y-1'
                    : 'opacity-100 translate-y-0'
                }`}
              >
                {filtersData && (
                  <CategoryFilterSidebar
                    filtersData={filtersData}
                    activeFilters={currentFilters}
                    onFilterChange={handleFilterChange}
                    onShopPriceRangeCommit={handleShopPriceRangeCommit}
                    selectedCategorySlug={selectedCategorySlug}
                    onCategoryNavigate={handleCategoryNavigate}
                  />
                )}
              </div>
            </div>
          </aside>

          {/* GRID DE PRODUCTOS */}
          <main className="w-full min-w-0 flex-1 py-2 md:py-10 md:pr-2">
            <div className="relative min-h-112">
              <div
                className={`absolute inset-0 transition-[opacity,transform] duration-300 ease-out ${
                  productsLoading || !productsRevealed
                    ? 'opacity-100 translate-y-0'
                    : 'pointer-events-none opacity-0 -translate-y-1'
                }`}
              >
                <div className="grid w-full min-w-0 grid-cols-2 items-start gap-2 sm:gap-4 lg:grid-cols-3 lg:gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="min-w-0 w-full animate-pulse">
                      {/* Estructura alineada a ProductCard en móvil */}
                      <div className="rounded-2xl border border-zinc-200/70 bg-gradient-to-b from-white via-white to-zinc-50/90 p-[1px] shadow-[0_4px_28px_-8px_rgba(15,23,42,0.12)]">
                        <div className="overflow-hidden rounded-[0.9rem] bg-white/95">
                          <div className="relative aspect-square bg-gradient-to-br from-zinc-100 to-zinc-200 ring-1 ring-inset ring-zinc-900/[0.06]" />
                          <div className="space-y-2 px-3 py-3">
                            <div className="h-2.5 w-[42%] max-w-[6rem] rounded bg-zinc-100" />
                            <div className="flex min-h-[20px] items-baseline gap-2">
                              <div className="min-h-[16px] min-w-0 flex-1 rounded bg-zinc-100" />
                              <div className="h-6 w-[3.75rem] shrink-0 rounded bg-zinc-100" />
                            </div>
                            <div className="space-y-1.5 pt-0.5">
                              <div className="h-2 w-full rounded bg-gray-50" />
                              <div className="h-2 w-[82%] max-w-none rounded bg-gray-50" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div
                className={`grid w-full min-w-0 grid-cols-2 items-start gap-2 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 lg:gap-4 pb-20 transition-[opacity,transform] duration-300 ease-out ${
                  productsLoading || !productsRevealed
                    ? 'pointer-events-none opacity-0 translate-y-1'
                    : 'opacity-100 translate-y-0'
                }`}
              >
                {products.length === 0 ? (
                  <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
                    <AlertCircle size={40} className="text-gray-200 mb-4" />
                    <h3 className="text-lg font-bold uppercase">Sin resultados</h3>
                    <p className="text-gray-500 text-sm mt-2">
                      Intenta con otros filtros
                    </p>
                  </div>
                ) : (
                  products.map((product) => (
                    <div key={product.id} className="min-w-0">
                      <ProductCard
                        product={product}
                        catalogBadge={catalogPageBadge}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}