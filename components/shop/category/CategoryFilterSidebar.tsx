"use client";

import { ChevronDown, ChevronRight } from 'lucide-react';
import { categorySlugsMatch, normalizeCategoryPublicSlug } from '@/lib/categoryUrls';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import type { Dispatch, SetStateAction } from 'react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

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

type DynamicFilterStyle = 'COLOR' | 'BUTTON' | 'SELECT';

interface DynamicFilter {
  name: string;
  slug: string;
  /** Viene del backend (`attribute_type`); define la UI del filtro. */
  style: DynamicFilterStyle | string;
  options: FilterOption[];
}

interface CategoryFilterSidebarProps {
  filtersData: {
    category_navigation: CategoryNavItem[];
    brands: Brand[];
    sports: Brand[];
    dynamic_filters: DynamicFilter[];
    price_range: { min: number; max: number };
  };
  activeFilters: Record<string, string>;
  onFilterChange: (key: string, value: string | null) => void;
  /**
   * Al soltar cualquier mango del slider, confirma min y max en un solo cambio de URL
   * (borra filtros cuando coinciden con el rango sugerido del catálogo).
   */
  onShopPriceRangeCommit: (min: number, max: number) => void;
  /** `null` quita el filtro `category` y vuelve al catálogo de la ruta actual. */
  onCategoryNavigate: (slug: string | null) => void;
  selectedCategorySlug: string;
  mobileMode?: boolean;
  /** Tras seleccionar un filtro en el sheet móvil (cierra el modal). */
  onMobileSheetClose?: () => void;
}

// --- COMPONENTE PARA SECCIONES CON DISEÑO NIKE/ADIDAS ---
const FilterSection = ({ 
  title, 
  isOpen, 
  onClick, 
  mobileMode = false,
  children 
}: {
  title: string;
  isOpen: boolean;
  onClick: () => void;
  mobileMode?: boolean;
  children: React.ReactNode;
}) => (
  <div
    className={
      mobileMode
        ? 'rounded-2xl border border-zinc-200/75 bg-white shadow-[0_10px_40px_-24px_rgba(15,23,42,0.35)] overflow-hidden mb-3 last:mb-0'
        : `border-t border-gray-100 py-3`
    }
  >
    <button
      type="button"
      onClick={onClick}
      aria-expanded={isOpen}
      className={
        mobileMode
          ? 'flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition active:bg-zinc-50 md:rounded-sm md:transition-all md:duration-300'
          : 'flex items-center justify-between w-full group rounded-sm transition-all duration-300'
      }
    >
      <span
        className={`cursor-pointer font-helvetica font-bold leading-[18px] tracking-[0.2px] text-black group-hover:text-[#060520] ${
          mobileMode ? 'text-[16px]' : 'text-[15px]'
        }`}
      >
        {title}
      </span>
      <ChevronDown
        size={mobileMode ? 18 : 16}
        className={`shrink-0 cursor-pointer transition-all duration-300 ease-out ${isOpen ? 'rotate-180 text-black' : `${mobileMode ? 'text-zinc-500' : 'text-gray-500 group-hover:text-black'}`}`}
        aria-hidden
      />
    </button>
    <div
      className={`grid overflow-hidden transition-all duration-300 ease-out ${
        isOpen
          ? `${
              mobileMode ? 'border-t border-zinc-100 grid-rows-[1fr]' : 'grid-rows-[1fr] md:mt-2'
            } mt-0 opacity-100`
          : 'mt-0 grid-rows-[0fr] opacity-0 pointer-events-none'
      }`}
    >
      <div className={`min-h-0 ${mobileMode ? 'px-4 pb-4 pt-2' : ''}`}>{children}</div>
    </div>
  </div>
);

/** Separación mínima entre los dos extremos ($1) para que los thumbs no se superpongan. */
const SHOP_PRICE_SLIDER_GAP = 1;

function clampShopPricePair(
  min: number,
  max: number,
  rangeFloor: number,
  rangeCeil: number,
  gap: number
): { min: number; max: number } {
  let m = Math.round(min);
  let M = Math.round(max);
  const span = rangeCeil - rangeFloor;
  if (span < gap) {
    m = rangeFloor;
    M = rangeCeil;
    return { min: m, max: M };
  }

  m = Math.min(Math.max(m, rangeFloor), rangeCeil);
  M = Math.min(Math.max(M, rangeFloor), rangeCeil);

  if (M - m < gap) {
    M = Math.min(rangeCeil, m + gap);
    if (M - m < gap) {
      m = Math.max(rangeFloor, M - gap);
    }
  }

  return { min: m, max: M };
}

/** SELECT en escritorio: botón cerrado + lista que se despliega (multiselección), fuera del overflow del acordeón. */
function DesktopMultiSelectDropdown({
  filterSlug,
  filterLabel,
  options,
  getParamValue,
  selectedKeys,
  onToggle,
  openSlug,
  setOpenSlug,
}: {
  filterSlug: string;
  filterLabel: string;
  options: FilterOption[];
  getParamValue: (option: FilterOption) => string;
  selectedKeys: string[];
  onToggle: (paramValue: string) => void;
  openSlug: string | null;
  setOpenSlug: Dispatch<SetStateAction<string | null>>;
}) {
  const isOpen = openSlug === filterSlug;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 260 });

  const syncPosition = () => {
    const el = triggerRef.current;
    if (!el) {
      return;
    }
    const r = el.getBoundingClientRect();
    setCoords({
      top: r.bottom + 6,
      left: r.left,
      width: Math.max(r.width, 200),
    });
  };

  useLayoutEffect(() => {
    if (!isOpen) {
      return;
    }
    syncPosition();
    window.addEventListener('scroll', syncPosition, true);
    window.addEventListener('resize', syncPosition);

    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenSlug(null);
      }
    };
    window.addEventListener('keydown', onEscape);

    return () => {
      window.removeEventListener('scroll', syncPosition, true);
      window.removeEventListener('resize', syncPosition);
      window.removeEventListener('keydown', onEscape);
    };
  }, [isOpen, setOpenSlug]);

  const labelFor = (paramValue: string) =>
    options.find((option) => getParamValue(option) === paramValue)?.label ?? paramValue;

  const summary =
    selectedKeys.length === 0
      ? 'Seleccionar…'
      : selectedKeys.map((key) => labelFor(key)).join(', ');

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        id={`desktop-select-trigger-${filterSlug}`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={`${filterLabel}: desplegable de opciones`}
        onClick={() => {
          setOpenSlug((prev) => (prev === filterSlug ? null : filterSlug));
          if (!isOpen) {
            queueMicrotask(() => syncPosition());
          }
        }}
        className="flex w-full items-center justify-between gap-2 rounded border border-gray-200 bg-white px-3 py-2.5 text-left font-helvetica text-[15px] text-gray-900 shadow-sm outline-none transition hover:border-gray-300 focus-visible:border-black focus-visible:ring-1 focus-visible:ring-black"
      >
        <span className="min-w-0 flex-1 truncate">{summary}</span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence mode="sync">
            {isOpen ? (
              <>
                <motion.button
                  key={`select-backdrop-${filterSlug}`}
                  type="button"
                  tabIndex={-1}
                  aria-label="Cerrar lista"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="fixed inset-0 z-[60] cursor-default bg-transparent"
                  onMouseDown={(e) => {
                    e.preventDefault();
                  }}
                  onClick={() => setOpenSlug(null)}
                />
                <motion.ul
                  key={`select-panel-${filterSlug}`}
                  role="listbox"
                  aria-multiselectable
                  aria-labelledby={`desktop-select-trigger-${filterSlug}`}
                  initial={{ opacity: 0, y: -10, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  transition={{
                    type: 'spring',
                    stiffness: 520,
                    damping: 32,
                    mass: 0.55,
                  }}
                  className="fixed z-[70] max-h-60 origin-top overflow-auto rounded-xl border border-gray-200 bg-white py-1 shadow-xl shadow-gray-900/10"
                  style={{
                    top: coords.top,
                    left: coords.left,
                    width: coords.width,
                    maxWidth: `min(${coords.width}px, calc(100vw - 1.5rem))`,
                  }}
                >
                  {options.map((option) => {
                    const paramValue = getParamValue(option);
                    const checked = selectedKeys.includes(paramValue);

                    return (
                      <li key={option.id} role="option" aria-selected={checked}>
                        <label className="flex cursor-pointer items-center gap-2.5 px-3 py-2 text-left font-helvetica text-[15px] text-gray-800 transition-colors hover:bg-black/[0.04]">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => onToggle(paramValue)}
                            className="h-3.5 w-3.5 shrink-0 accent-black"
                          />
                          <span className="min-w-0 flex-1">{option.label}</span>
                        </label>
                      </li>
                    );
                  })}
                </motion.ul>
              </>
            ) : null}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}

export default function CategoryFilterSidebar({
  filtersData,
  activeFilters,
  onFilterChange,
  onShopPriceRangeCommit,
  onCategoryNavigate,
  selectedCategorySlug,
  mobileMode = false,
  onMobileSheetClose,
}: CategoryFilterSidebarProps) {
  type PriceThumb = 'min' | 'max' | null;

  const getSelectedValues = (key: string): string[] => {
    const rawValue = activeFilters[key];

    if (!rawValue) {
      return [];
    }

    return rawValue.split(',').map((value) => value.trim()).filter(Boolean);
  };

  const notifyMobileSheetClose = () => {
    if (mobileMode) {
      onMobileSheetClose?.();
    }
  };

  const toggleSelectedValue = (key: string, value: string): void => {
    const selectedValues = getSelectedValues(key);
    const nextValues = selectedValues.includes(value)
      ? selectedValues.filter((selectedValue) => selectedValue !== value)
      : [...selectedValues, value];

    onFilterChange(key, nextValues.length > 0 ? nextValues.join(',') : null);
    notifyMobileSheetClose();
  };

  const getFilterQueryKey = (filter: DynamicFilter): string => {
    if (filter.slug.toLowerCase() === 'talla') {
      return 'size';
    }

    return filter.slug;
  };

  /** Laravel trata `size` numérico como attribute_values.id, no como slug ("5" !== id 5). Usar id de opción. */
  const getDynamicOptionParamValue = (filter: DynamicFilter, option: FilterOption): string =>
    filter.slug.toLowerCase() === 'talla' ? String(option.id) : option.slug;

  const getDynamicFilterStyle = (filter: DynamicFilter): string =>
    String(filter.style ?? '').toUpperCase().trim();

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() =>
    mobileMode
      ? {
          categories: false,
          brands: false,
          sports: false,
          price: false,
        }
      : {
          categories: true,
          brands: true,
          sports: false,
          price: false,
        },
  );

  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  /** SELECT escritorio: un solo dropdown abierto; slug del dynamic_filter activo */
  const [openDesktopSelectSlug, setOpenDesktopSelectSlug] = useState<string | null>(null);
  const [activePriceThumb, setActivePriceThumb] = useState<PriceThumb>(null);
  /** Quién debe ir arriba cuando no hay arrastre (ambos `<input>` son full-width). */
  const [nearestPriceThumb, setNearestPriceThumb] = useState<'min' | 'max'>('max');

  const priceTrackRef = useRef<HTMLDivElement>(null);

  const priceRangeMin = filtersData.price_range.min;
  const priceRangeMax = filtersData.price_range.max;

  const committedPriceMin = Number(activeFilters.price_min || priceRangeMin);
  const committedPriceMax = Number(activeFilters.price_max || priceRangeMax);

  const [priceDraft, setPriceDraft] = useState<{ min: number; max: number }>(() =>
    clampShopPricePair(
      Number(activeFilters.price_min || priceRangeMin),
      Number(activeFilters.price_max || priceRangeMax),
      priceRangeMin,
      priceRangeMax,
      SHOP_PRICE_SLIDER_GAP
    )
  );

  const priceDraftRef = useRef(priceDraft);
  useLayoutEffect(() => {
    priceDraftRef.current = priceDraft;
  }, [priceDraft]);

  // Refleja cambios de URL / rango API. El control siempre pinta `priceDraft` (no `committed*`) para que al soltar no vuelva atrás un frame.
  useEffect(() => {
    setPriceDraft(
      clampShopPricePair(
        committedPriceMin,
        committedPriceMax,
        priceRangeMin,
        priceRangeMax,
        SHOP_PRICE_SLIDER_GAP
      )
    );
  }, [committedPriceMin, committedPriceMax, priceRangeMin, priceRangeMax]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const wasExpanded = prev[section] ?? false;
      if (wasExpanded) {
        setOpenDesktopSelectSlug((open) => (open === section ? null : open));
      }
      return { ...prev, [section]: !wasExpanded };
    });
  };

  const toggleCategory = (slug: string) => {
    setExpandedCategories((prev) => ({ ...prev, [slug]: !prev[slug] }));
  };

  // --- LÓGICA DE NAVEGACIÓN RECURSIVA ---
  const findPathToSlug = (items: CategoryNavItem[], targetSlug: string): string[] => {
    for (const item of items) {
      if (categorySlugsMatch(item.slug, targetSlug)) return [item.slug];
      if (item.sub_categories?.length) {
        const childPath = findPathToSlug(item.sub_categories, targetSlug);
        if (childPath.length > 0) return [item.slug, ...childPath];
      }
    }
    return [];
  };

  const autoExpandedSlugs = new Set(
    !filtersData?.category_navigation?.length || !selectedCategorySlug
      ? []
      : findPathToSlug(filtersData.category_navigation, selectedCategorySlug)
  );

  const priceRangeWidth = Math.max(priceRangeMax - priceRangeMin, 1);

  const minPercent = ((priceDraft.min - priceRangeMin) / priceRangeWidth) * 100;
  const maxPercent = ((priceDraft.max - priceRangeMin) / priceRangeWidth) * 100;

  const priceSpanOk = priceRangeMax - priceRangeMin >= SHOP_PRICE_SLIDER_GAP;
  /** Fin del slider del mínimo (siempre hay al menos `$SHOP_PRICE_SLIDER_GAP` hasta el máximo). */
  const minRangeInputMax =
    priceSpanOk
      ? Math.max(priceRangeMin, Math.min(priceRangeMax, priceDraft.max - SHOP_PRICE_SLIDER_GAP))
      : priceRangeMax;
  /** Piso del slider del máximo. */
  const maxRangeInputMin =
    priceSpanOk
      ? Math.min(priceRangeMax, Math.max(priceRangeMin, priceDraft.min + SHOP_PRICE_SLIDER_GAP))
      : priceRangeMin;

  const minSlideMaxAttr = Math.max(priceRangeMin, Math.min(priceRangeMax, minRangeInputMax));
  const maxSlideMinAttr = Math.min(priceRangeMax, Math.max(priceRangeMin, maxRangeInputMin));

  const minSlideValue = Math.min(
    Math.max(priceDraft.min, priceRangeMin),
    minSlideMaxAttr
  );
  const maxSlideValue = Math.max(
    Math.min(priceDraft.max, priceRangeMax),
    maxSlideMinAttr
  );

  const updateNearestPriceThumbFromX = (clientX: number) => {
    if (activePriceThumb) {
      return;
    }

    const el = priceTrackRef.current;
    if (!el || typeof window === 'undefined') {
      return;
    }

    const rect = el.getBoundingClientRect();
    if (rect.width <= 0) {
      return;
    }

    const minCenterPx = rect.left + (minPercent / 100) * rect.width;
    const maxCenterPx = rect.left + (maxPercent / 100) * rect.width;
    const distanceMin = Math.abs(clientX - minCenterPx);
    const distanceMax = Math.abs(clientX - maxCenterPx);

    setNearestPriceThumb(distanceMin < distanceMax ? 'min' : 'max');
  };

  const flushShopPriceRangeCommit = () => {
    const d = priceDraftRef.current;
    onShopPriceRangeCommit(d.min, d.max);
    notifyMobileSheetClose();
  };

  const renderCategoryTree = (items: CategoryNavItem[], depth = 0) => {
    return items.map((item) => {
      const hasChildren = !!item.sub_categories?.length;
      const isExpanded = expandedCategories[item.slug] ?? autoExpandedSlugs.has(item.slug);
      const isActive = categorySlugsMatch(selectedCategorySlug, item.slug);

      return (
        <li key={item.id} className="select-none">
          <div className="flex items-center gap-1.5 py-0.5">
            {hasChildren ? (
              <button
                type="button"
                onClick={() => toggleCategory(item.slug)}
                className={`shrink-0 rounded-full p-1 transition-all duration-300 ${
                  isExpanded ? 'bg-gray-100 text-black' : 'text-gray-400 hover:bg-gray-100 hover:text-black'
                }`}
              >
                <ChevronRight
                  size={12}
                  className={`transition-all duration-300 ease-out ${isExpanded ? 'rotate-90 scale-110' : 'rotate-0 scale-100'}`}
                />
              </button>
            ) : (
              <span className="w-4 h-4 flex items-center justify-center">
                <span className="w-1 h-1 rounded-full bg-gray-10" />
              </span>
            )}

            <button
              type="button"
              onClick={() => {
                if (isActive) {
                  onCategoryNavigate(null);
                } else {
                  onCategoryNavigate(normalizeCategoryPublicSlug(item.slug));
                }
                notifyMobileSheetClose();
              }}
              className={`flex items-center justify-between flex-1 rounded-sm px-1 py-0.5 text-left text-[15px] transition-all duration-200 leading-4 ${
                isActive ? 'font-bold text-black' : 'text-gray-600 hover:bg-black/5 hover:text-black'
              }`}
            >
              <span className="font-helvetica text-[13px] leading-[11px] tracking-[0.18px]
">{item.name}</span>
              <span className="ml-1 inline-flex items-center rounded-sm bg-gray-100 px-1.5 py-0.5 text-[13px] font-medium text-gray-600 transition-colors duration-200 group-hover:bg-black/5 group-hover:text-black">
                {item.products_count}
              </span>
            </button>
          </div>

          {hasChildren && (
            <div
              className={`grid overflow-hidden transition-all duration-300 ease-out ${
                isExpanded ? 'mt-0.5 grid-rows-[1fr] opacity-100' : 'mt-0 grid-rows-[0fr] opacity-0'
              }`}
            >
              <ul className="min-h-0 space-y-0.5 border-l border-gray-100 ml-2 pl-2">
                {renderCategoryTree(item.sub_categories || [], depth + 1)}
              </ul>
            </div>
          )}
        </li>
      );
    });
  };

  return (
    <aside className={`w-full font-helvetica ${mobileMode ? 'px-1 pb-8 pt-1' : ''}`}>
      {/* 1. Categorías / Subcategorías */}
      {filtersData?.category_navigation?.length > 0 && (
        <FilterSection 
          title="Categorías" 
          isOpen={expandedSections.categories} 
          onClick={() => toggleSection('categories')}
          mobileMode={mobileMode}
        >
          <ul className={`space-y-0.5 max-h-96 overflow-y-auto pr-2 no-scrollbar ${mobileMode ? 'max-h-none pr-1' : ''}`}>
            {renderCategoryTree(filtersData.category_navigation)}
          </ul>
        </FilterSection>
      )}

      {/* 2. Marcas */}
      {filtersData?.brands?.length > 0 && (
        <FilterSection 
          title="Marcas" 
          isOpen={expandedSections.brands} 
          onClick={() => toggleSection('brands')}
          mobileMode={mobileMode}
        >
          <ul className={`space-y-1 max-h-60 overflow-y-auto pr-2 no-scrollbar ${mobileMode ? 'max-h-none pr-1' : ''}`}>
            {filtersData.brands.map((brand) => (
              <li key={brand.id}>
                <label className="flex items-center justify-between gap-2 cursor-pointer group w-full py-0.5">
                  <span className="flex items-center gap-2 min-w-0">
                    <input
                      type="checkbox"
                      checked={getSelectedValues('brand').includes(brand.slug)}
                      onChange={() => toggleSelectedValue('brand', brand.slug)}
                      className="w-3 h-3 accent-black border-gray-300 rounded shrink-0"
                    />
                    <span className="rounded-sm px-1 py-0.5 text-[15px] text-gray-600 transition-all duration-200 group-hover:bg-black/5 group-hover:text-black truncate">
                      {brand.name}
                    </span>
                  </span>
                  <span className="inline-flex shrink-0 items-center rounded-sm bg-gray-100 px-1.5 py-0.5 text-[13px] font-medium text-gray-600 transition-colors duration-200 group-hover:bg-black/5 group-hover:text-black">
                    {brand.products_count}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </FilterSection>
      )}

      {/* 3. Deportes */}
      {filtersData?.sports?.length > 0 && (
        <FilterSection 
          title="Deportes" 
          isOpen={expandedSections.sports} 
          onClick={() => toggleSection('sports')}
          mobileMode={mobileMode}
        >
          <ul className={`space-y-1 max-h-60 overflow-y-auto pr-2 no-scrollbar ${mobileMode ? 'max-h-none pr-1' : ''}`}>
            {filtersData.sports.map((sport) => (
              <li key={sport.id}>
                <label className="flex items-center justify-between gap-2 cursor-pointer group w-full py-0.5">
                  <span className="flex items-center gap-2 min-w-0">
                    <input
                      type="checkbox"
                      checked={getSelectedValues('sport').includes(sport.slug)}
                      onChange={() => toggleSelectedValue('sport', sport.slug)}
                      className="w-3 h-3 accent-black border-gray-300 rounded shrink-0"
                    />
                    <span className="rounded-sm px-1 py-0.5 text-[15px] text-gray-600 transition-all duration-200 group-hover:bg-black/5 group-hover:text-black truncate">
                      {sport.name}
                    </span>
                  </span>
                  <span className="inline-flex shrink-0 items-center rounded-sm bg-gray-100 px-1.5 py-0.5 text-[13px] font-medium text-gray-600 transition-colors duration-200 group-hover:bg-black/5 group-hover:text-black">
                    {sport.products_count}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </FilterSection>
      )}

      {/* 4. Filtros Dinámicos (Color, Talla, etc.) — `style`: COLOR | BUTTON | SELECT */}
      {filtersData?.dynamic_filters?.map((filter) => (
        (() => {
          const filterQueryKey = getFilterQueryKey(filter);
          const uiStyle = getDynamicFilterStyle(filter);

          const renderCheckboxList = () => (
            <ul className="space-y-2">
              {filter.options.map((option) => {
                const paramValue = getDynamicOptionParamValue(filter, option);

                return (
                  <li key={option.id}>
                    <label className="flex items-center gap-2 cursor-pointer group rounded-sm px-2 py-1 transition-all duration-200 hover:bg-black/5">
                      <input
                        type="checkbox"
                        checked={getSelectedValues(filterQueryKey).includes(paramValue)}
                        onChange={() => toggleSelectedValue(filterQueryKey, paramValue)}
                        className="w-3 h-3 accent-black border-gray-300 rounded"
                      />
                      <span className="text-[15px] text-gray-600 transition-colors duration-200 group-hover:text-black">
                        {option.label}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          );

          const renderButtonGrid = () => (
            <div className="flex flex-wrap gap-2">
              {filter.options.map((option) => {
                const paramValue = getDynamicOptionParamValue(filter, option);
                const active = getSelectedValues(filterQueryKey).includes(paramValue);

                return (
                  <button
                    type="button"
                    key={option.id}
                    onClick={() => toggleSelectedValue(filterQueryKey, paramValue)}
                    aria-pressed={active}
                    className={`min-h-9 min-w-9 shrink-0 rounded border px-3 py-1.5 text-center font-helvetica text-[14px] font-semibold uppercase tracking-[0.08em] transition-all duration-200 ${
                      active
                        ? 'border-black bg-black text-white shadow-sm'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-900 hover:text-black'
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          );

          /** Móvil: siempre chips botón (incluye color con swatch dentro del chip si hay hex). */
          const renderMobileDynamicButtons = () => {
            const isColorFilter =
              uiStyle === 'COLOR' || filter.slug.toLowerCase() === 'color';

            return (
              <div className="flex flex-wrap justify-start gap-2">
                {filter.options.map((option) => {
                  const paramValue = getDynamicOptionParamValue(filter, option);
                  const active = getSelectedValues(filterQueryKey).includes(paramValue);
                  const swatchHex = option.color_hex?.trim();

                  return (
                    <button
                      type="button"
                      key={option.id}
                      onClick={() => toggleSelectedValue(filterQueryKey, paramValue)}
                      aria-pressed={active}
                      title={option.label}
                      className={`inline-flex max-w-full items-center gap-2 rounded border px-3 py-2 text-left font-helvetica text-[14px] font-semibold uppercase tracking-[0.06em] transition-all duration-200 ${
                        active
                          ? 'border-black bg-black text-white shadow-sm'
                          : 'border-gray-200 bg-white text-gray-800 hover:border-gray-900 hover:text-black'
                      }`}
                    >
                      {(isColorFilter || swatchHex) && (
                        <span
                          aria-hidden
                          className={`inline-flex shrink-0 rounded-full bg-white p-[3px] ${
                            active
                              ? 'outline outline-2 outline-offset-2 outline-white'
                              : 'border border-gray-300'
                          }`}
                        >
                          <span
                            className="block h-[14px] w-[14px] rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]"
                            style={{
                              backgroundColor: swatchHex || (isColorFilter ? '#e5e5e5' : undefined),
                            }}
                          />
                        </span>
                      )}
                      <span className="truncate">{option.label}</span>
                    </button>
                  );
                })}
              </div>
            );
          };

          /** Escritorio: SELECT = desplegable colapsado (no lista nativa siempre visible). */
          const renderSelectDropdown = () => (
            <DesktopMultiSelectDropdown
              filterSlug={filter.slug}
              filterLabel={filter.name}
              options={filter.options}
              getParamValue={(option) => getDynamicOptionParamValue(filter, option)}
              selectedKeys={getSelectedValues(filterQueryKey)}
              onToggle={(paramValue) => toggleSelectedValue(filterQueryKey, paramValue)}
              openSlug={openDesktopSelectSlug}
              setOpenSlug={setOpenDesktopSelectSlug}
            />
          );

          let body: React.ReactNode;

          if (mobileMode) {
            body = renderMobileDynamicButtons();
          } else if (uiStyle === 'COLOR') {
            body = (
              <div className="grid grid-cols-6 gap-2">
                {filter.options.map((option) => {
                  const active = getSelectedValues(filterQueryKey).includes(option.slug);
                  const fill = option.color_hex?.trim() || '#e5e5e5';

                  return (
                    <button
                      type="button"
                      key={option.id}
                      onClick={() => toggleSelectedValue(filterQueryKey, option.slug)}
                      aria-pressed={active}
                      title={option.label}
                      className="flex h-9 w-9 items-center justify-center rounded-full outline-none transition-transform duration-200 hover:scale-105 focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                    >
                      <span
                        className={`flex items-center justify-center rounded-full transition-shadow ${
                          active
                            ? 'border-2 border-black bg-white p-[3px] shadow-sm'
                            : 'border border-gray-300 bg-white p-[2px] hover:border-gray-500'
                        }`}
                      >
                        <span
                          className="block h-[18px] w-[18px] rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.35)]"
                          style={{ backgroundColor: fill }}
                        />
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          } else if (uiStyle === 'SELECT') {
            body = renderSelectDropdown();
          } else if (uiStyle === 'BUTTON') {
            body = renderButtonGrid();
          } else {
            body = renderCheckboxList();
          }

          return (
            <FilterSection
              key={filter.slug}
              title={filter.name}
              isOpen={expandedSections[filter.slug]}
              onClick={() => toggleSection(filter.slug)}
              mobileMode={mobileMode}
            >
              {body}
            </FilterSection>
          );
        })()
      ))}

      {/* 5. Precio */}
      <FilterSection 
        title="Precio" 
        isOpen={expandedSections.price} 
        onClick={() => toggleSection('price')}
        mobileMode={mobileMode}
      >
        <div className="space-y-4">
          <div className="space-y-3">
            <div
              ref={priceTrackRef}
              className="relative h-8 flex items-center"
              onPointerEnter={(e) => updateNearestPriceThumbFromX(e.clientX)}
              onPointerMove={(e) => updateNearestPriceThumbFromX(e.clientX)}
              onPointerLeave={() => {
                if (!activePriceThumb) {
                  setNearestPriceThumb('max');
                }
              }}
            >
              <div className="pointer-events-none absolute left-0 right-0 h-1.5 rounded-full bg-gray-200" />
              <div
                className="pointer-events-none absolute h-1.5 rounded-full bg-black motion-reduce:!transition-none"
                style={{
                  left: `${minPercent}%`,
                  right: `${100 - maxPercent}%`,
                  transition:
                    activePriceThumb === null
                      ? 'left 290ms cubic-bezier(0.22, 1, 0.36, 1), right 290ms cubic-bezier(0.22, 1, 0.36, 1)'
                      : 'none',
                }}
              />

              <input
                type="range"
                min={priceRangeMin}
                max={minSlideMaxAttr}
                step={1}
                value={minSlideValue}
                aria-valuemin={priceRangeMin}
                aria-valuemax={minSlideMaxAttr}
                onChange={(e) => {
                  const raw = Number(e.target.value);
                  setPriceDraft((current) =>
                    clampShopPricePair(raw, current.max, priceRangeMin, priceRangeMax, SHOP_PRICE_SLIDER_GAP)
                  );
                }}
                onPointerDown={(e) => {
                  e.currentTarget.setPointerCapture(e.pointerId);
                  setActivePriceThumb('min');
                }}
                onPointerUp={(e) => {
                  e.currentTarget.releasePointerCapture(e.pointerId);
                  flushShopPriceRangeCommit();
                  setActivePriceThumb(null);
                }}
                onPointerCancel={() => {
                  setPriceDraft(
                    clampShopPricePair(
                      committedPriceMin,
                      committedPriceMax,
                      priceRangeMin,
                      priceRangeMax,
                      SHOP_PRICE_SLIDER_GAP
                    )
                  );
                  setActivePriceThumb(null);
                }}
                onBlur={() => setActivePriceThumb(null)}
                className={`absolute inset-x-0 h-10 touch-none appearance-none bg-transparent slider-thumb slider-thumb-shop-price cursor-grab active:cursor-grabbing ${
                  activePriceThumb === 'max' ? 'pointer-events-none' : 'pointer-events-auto'
                }`}
                style={{
                  zIndex:
                    activePriceThumb === 'min'
                      ? 40
                      : activePriceThumb === 'max'
                        ? 5
                        : nearestPriceThumb === 'min'
                          ? 30
                          : 20,
                }}
              />

              <input
                type="range"
                min={maxSlideMinAttr}
                max={priceRangeMax}
                step={1}
                value={maxSlideValue}
                aria-valuemin={maxSlideMinAttr}
                aria-valuemax={priceRangeMax}
                onChange={(e) => {
                  const raw = Number(e.target.value);
                  setPriceDraft((current) =>
                    clampShopPricePair(current.min, raw, priceRangeMin, priceRangeMax, SHOP_PRICE_SLIDER_GAP)
                  );
                }}
                onPointerDown={(e) => {
                  e.currentTarget.setPointerCapture(e.pointerId);
                  setActivePriceThumb('max');
                }}
                onPointerUp={(e) => {
                  e.currentTarget.releasePointerCapture(e.pointerId);
                  flushShopPriceRangeCommit();
                  setActivePriceThumb(null);
                }}
                onPointerCancel={() => {
                  setPriceDraft(
                    clampShopPricePair(
                      committedPriceMin,
                      committedPriceMax,
                      priceRangeMin,
                      priceRangeMax,
                      SHOP_PRICE_SLIDER_GAP
                    )
                  );
                  setActivePriceThumb(null);
                }}
                onBlur={() => setActivePriceThumb(null)}
                className={`absolute inset-x-0 h-10 touch-none appearance-none bg-transparent slider-thumb slider-thumb-shop-price cursor-grab active:cursor-grabbing ${
                  activePriceThumb === 'min' ? 'pointer-events-none' : 'pointer-events-auto'
                }`}
                style={{
                  zIndex:
                    activePriceThumb === 'max'
                      ? 40
                      : activePriceThumb === 'min'
                        ? 5
                        : nearestPriceThumb === 'max'
                          ? 30
                          : 20,
                }}
              />
            </div>

            <div
              className={`flex items-center justify-between text-[14px] font-medium text-gray-500 tabular-nums motion-reduce:transition-none transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                activePriceThumb ? 'scale-[1.03] opacity-90' : 'scale-100 opacity-100'
              }`}
            >
              <span>${priceDraft.min}</span>
              <span>${priceDraft.max}</span>
            </div>
          </div>

          {filtersData.price_range && (
            <p className="text-[14px] text-gray-400 text-center font-medium">
              Rango sugerido: ${filtersData.price_range.min} - ${filtersData.price_range.max}
            </p>
          )}
        </div>
      </FilterSection>

    </aside>
  );
}