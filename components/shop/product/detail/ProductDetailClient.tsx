"use client";

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import ProductGallery from './ProductGallery';
import ProductActions from './ProductActions';
import ProductColorSwatchButton from './ProductColorSwatchButton';
import ProductPhysicalStoreAvailability from './ProductPhysicalStoreAvailability';
import RelatedProductsSection, { type RelatedProductItem } from './RelatedProductsSection';
import { parsePositiveSalePrice } from '@/utils/shopPricing';
import { sortSizes } from '@/utils/sizeOrder';
import { extractUpcFromSlug, getProductUrl, sanitizeUpc } from '@/lib/urls';

interface VariantImage {
  id?: number;
  url: string;
}

interface PhysicalStore {
  name: string;
  alias?: string | null;
  display_name?: string;
  available?: number;
}

interface Variant {
  id: number;
  sku?: string;
  attributes?: Record<string, unknown>;
  attributes_json?: Record<string, unknown>;
  color?: string;
  variant_color?: string | null;
  color_meta?: {
    value?: string;
    color_hex?: string | null;
    secondary_color_hex?: string | null;
    swatch_image_url?: string | null;
  } | null;
  price?: number;
  sale_price?: number | null;
  stock_quantity?: number;
  physical_stores?: PhysicalStore[];
  images?: VariantImage[];
}

interface AvailableSize {
  variant_id: number;
  size_value: string;
  has_stock: boolean;
}

interface ProductDetailData {
  id: number;
  sku?: string;
  name: string;
  slug?: string;
  seo_url?: string | null;
  description?: string;
  short_description?: string;
  brand?: { name?: string };
  product_color?: string | null;
  pro_nombre_cotizaciones?: string | null;
  in_stock?: boolean;
  price?: number;
  sale_price?: number | null;
  price_regular?: number;
  discount_percentage?: number | null;
  main_image?: string;
  gallery?: string[];
  images?: Array<{ url: string }>;
  categories?: Array<{ name: string }>;
  available_sizes?: AvailableSize[];
  variants?: Variant[];
  style_code?: string | null;
}

interface ColorMeta {
  label: string;
  colorHex: string | null;
  secondaryColorHex: string | null;
  swatchImageUrl: string | null;
}

interface VariantGroup {
  key: string;
  label: string;
  colorHex: string | null;
  secondaryColorHex: string | null;
  swatchImageUrl: string | null;
  variantThumbnailUrl: string | null;
  images: string[];
  variants: Variant[];
}

function getSizeFromVariant(variant: Variant): string {
  const attributes = variant?.attributes || {};
  
  // 1. Intentar buscar específicamente 'Talla' o 'size'
  if (typeof attributes['Talla'] === 'string') return attributes['Talla'];
  if (typeof attributes['size'] === 'string') return attributes['size'];

  // 2. Buscar dinámicamente cualquier clave que incluya la palabra "Talla" (ej. "Talla Camisas")
  const dynamicTallaKey = Object.keys(attributes).find(key => 
    key.toLowerCase().includes('talla')
  );
  
  if (dynamicTallaKey && typeof attributes[dynamicTallaKey] === 'string') {
    return attributes[dynamicTallaKey] as string;
  }

  // 3. Fallback: Primer valor disponible o string vacío
  const firstValue = Object.values(attributes)[0];
  return (typeof firstValue === 'string' ? firstValue : '');
}

const COLOR_ATTRIBUTE_KEYS = ['Color', 'color', 'COLOR', 'product_color'] as const;

function readColorField(raw: unknown): ColorMeta | null {
  if (raw && typeof raw === 'object' && 'value' in raw) {
    const obj = raw as {
      value?: string;
      color_hex?: string;
      secondary_color_hex?: string;
      swatch_image_url?: string;
    };
    const label = typeof obj.value === 'string' ? obj.value.trim() : '';
    if (label) {
      return {
        label,
        colorHex: obj.color_hex ?? null,
        secondaryColorHex: obj.secondary_color_hex ?? null,
        swatchImageUrl: obj.swatch_image_url ?? null,
      };
    }
  }

  if (typeof raw === 'string' && raw.trim()) {
    return {
      label: raw.trim(),
      colorHex: null,
      secondaryColorHex: null,
      swatchImageUrl: null,
    };
  }

  return null;
}

function getColorDataFromVariant(
  variant: Variant,
  fallbackIndex?: number
): { key: string; label: string; colorHex: string | null; secondaryColorHex: string | null; swatchImageUrl: string | null } {
  const bags: Record<string, unknown>[] = [];
  if (variant.attributes && typeof variant.attributes === 'object') {
    bags.push(variant.attributes);
  }
  if (variant.attributes_json && typeof variant.attributes_json === 'object') {
    bags.push(variant.attributes_json);
  }

  if (variant.color_meta?.value?.trim()) {
    const parsed = readColorField(variant.color_meta);
    if (parsed) {
      return {
        key: parsed.label.toLowerCase(),
        label: parsed.label,
        colorHex: parsed.colorHex,
        secondaryColorHex: parsed.secondaryColorHex,
        swatchImageUrl: parsed.swatchImageUrl,
      };
    }
  }

  for (const bag of bags) {
    for (const key of COLOR_ATTRIBUTE_KEYS) {
      const parsed = readColorField(bag[key]);
      if (parsed) {
        return {
          key: parsed.label.toLowerCase(),
          label: parsed.label,
          colorHex: parsed.colorHex,
          secondaryColorHex: parsed.secondaryColorHex,
          swatchImageUrl: parsed.swatchImageUrl,
        };
      }
    }
  }

  const rawColor = variant.variant_color ?? variant.color;
  if (typeof rawColor === 'string' && rawColor.trim() && rawColor.trim().toUpperCase() !== 'N/A') {
    const label = rawColor.trim();
    return {
      key: label.toLowerCase(),
      label,
      colorHex: null,
      secondaryColorHex: null,
      swatchImageUrl: null,
    };
  }

  const fallbackLabel =
    fallbackIndex !== undefined ? `Variante ${fallbackIndex + 1}` : 'Variante';

  return {
    key: fallbackIndex !== undefined ? `variant-${fallbackIndex}` : 'default',
    label: fallbackLabel,
    colorHex: null,
    secondaryColorHex: null,
    swatchImageUrl: null,
  };
}

function normalizeVariantImages(variant: Variant): string[] {
  return (variant.images || []).map((image) => image.url).filter(Boolean);
}

function resolveGroupVariantThumbnail(variants: Variant[]): string | null {
  for (const variant of variants) {
    const images = normalizeVariantImages(variant);
    if (images.length > 0) {
      return images[0];
    }
  }

  return null;
}

function formatPrice(value: number | undefined): string {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '0.00';
  }

  return value.toFixed(2);
}

function isGenericVariantLabel(label: string | null | undefined): boolean {
  if (!label?.trim()) return true;
  return label.trim().toLowerCase().includes('variante');
}

function resolveDisplayColorLabel(
  groupLabel?: string | null,
  productColor?: string | null,
): string | null {
  const fromGroup = groupLabel?.trim();
  if (fromGroup && !isGenericVariantLabel(fromGroup)) return fromGroup;

  const fromProduct = productColor?.trim();
  if (fromProduct && !isGenericVariantLabel(fromProduct)) return fromProduct;

  return null;
}

export default function ProductDetailClient({
  product,
  relatedProducts,
}: {
  product: ProductDetailData;
  relatedProducts: RelatedProductItem[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const variants = useMemo<Variant[]>(() => product.variants ?? [], [product.variants]);
  const availableSizes = useMemo<AvailableSize[]>(() => product.available_sizes ?? [], [product.available_sizes]);

  const availableSizeByVariantId = useMemo(() => {
    const map = new Map<number, AvailableSize>();
    for (const item of availableSizes) {
      map.set(item.variant_id, item);
    }
    return map;
  }, [availableSizes]);

  const productGallery = useMemo(() => {
    if (Array.isArray(product.gallery) && product.gallery.length > 0) {
      return product.gallery;
    }

    if (Array.isArray(product.images) && product.images.length > 0) {
      return product.images.map((image) => image.url).filter(Boolean);
    }

    return product.main_image ? [product.main_image] : [];
  }, [product.gallery, product.images, product.main_image]);

  const variantGroups = useMemo<VariantGroup[]>(() => {
    const groupMap = new Map<string, VariantGroup>();

    variants.forEach((variant, variantIndex) => {
      const colorData = getColorDataFromVariant(variant, variantIndex);
      const variantImages = normalizeVariantImages(variant);

      if (!groupMap.has(colorData.key)) {
        groupMap.set(colorData.key, {
          key: colorData.key,
          label: colorData.label,
          colorHex: colorData.colorHex,
          secondaryColorHex: colorData.secondaryColorHex,
          swatchImageUrl: colorData.swatchImageUrl,
          variantThumbnailUrl: variantImages[0] ?? null,
          images: variantImages,
          variants: [variant],
        });
      } else {
        const existing = groupMap.get(colorData.key);
        if (existing) {
          existing.variants.push(variant);
          if (!existing.variantThumbnailUrl && variantImages.length > 0) {
            existing.variantThumbnailUrl = variantImages[0];
          }
          if (variantImages.length > 0) {
            existing.images = [...new Set([...existing.images, ...variantImages])];
          }
          if (!existing.swatchImageUrl && colorData.swatchImageUrl) {
            existing.swatchImageUrl = colorData.swatchImageUrl;
          }
          if (!existing.colorHex && colorData.colorHex) {
            existing.colorHex = colorData.colorHex;
          }
          if (!existing.secondaryColorHex && colorData.secondaryColorHex) {
            existing.secondaryColorHex = colorData.secondaryColorHex;
          }
        }
      }
    });

    return Array.from(groupMap.values()).map((group) => ({
      ...group,
      variantThumbnailUrl: group.variantThumbnailUrl ?? resolveGroupVariantThumbnail(group.variants),
      images: group.images.length > 0 ? group.images : productGallery,
    }));
  }, [variants, productGallery]);

  const colorVariantUrlByGroupKey = useMemo(() => {
    const map = new Map<string, string>();

    for (const group of variantGroups) {
      map.set(
        group.key,
        getProductUrl({
          name: product.name,
          brand: product.brand,
          color_name: group.label,
          variant_sku: group.variants[0]?.sku,
        }),
      );
    }

    return map;
  }, [variantGroups, product.name, product.brand]);

  const colorVariantUrls = useMemo(
    () => Array.from(new Set(colorVariantUrlByGroupKey.values())),
    [colorVariantUrlByGroupKey],
  );

  useEffect(() => {
    for (const url of colorVariantUrls) {
      router.prefetch(url);
    }
  }, [router, colorVariantUrls]);

const sizes = useMemo<string[]>(() => {
  const fromAvailableSizes = (availableSizes || []).map((item) => item.size_value).filter(Boolean);
  const fromVariants = (variants || []).map((variant) => getSizeFromVariant(variant)).filter(Boolean);

  const deduped = Array.from(new Set([...fromAvailableSizes, ...fromVariants]));

  return sortSizes(deduped);
}, [availableSizes, variants]);

  const searchParams = useSearchParams();
  const colorFromUrl = searchParams?.get('color');
  const slugFromPath = pathname?.split('/').filter(Boolean).pop() ?? '';
  const upcFromUrl = extractUpcFromSlug(slugFromPath);

  const groupKeyFromUpc = useMemo(() => {
    if (!upcFromUrl || variants.length === 0) {
      return null;
    }

    const matchingVariant = variants.find(
      (variant) => sanitizeUpc(variant.sku ?? '') === upcFromUrl,
    );

    if (!matchingVariant) {
      return null;
    }

    return getColorDataFromVariant(matchingVariant).key;
  }, [upcFromUrl, variants]);

  const groupKeyFromLegacyColorParam = useMemo(() => {
    if (!colorFromUrl || variantGroups.length === 0) {
      return null;
    }
    const decoded = decodeURIComponent(colorFromUrl).toLowerCase();
    return variantGroups.find((group) => group.label.toLowerCase() === decoded)?.key ?? null;
  }, [colorFromUrl, variantGroups]);

  const [selectedGroupKey, setSelectedGroupKey] = useState<string>(() => variantGroups[0]?.key || 'default');
  const [selectedSize, setSelectedSize] = useState<string>(() => sizes[0] || '');

  const safeSelectedGroupKey = useMemo(() => {
    if (groupKeyFromUpc) {
      return groupKeyFromUpc;
    }
    if (groupKeyFromLegacyColorParam) {
      return groupKeyFromLegacyColorParam;
    }
    return (
      variantGroups.find((group) => group.key === selectedGroupKey)?.key ||
      variantGroups[0]?.key ||
      'default'
    );
  }, [groupKeyFromUpc, groupKeyFromLegacyColorParam, selectedGroupKey, variantGroups]);

  const currentGroup = useMemo(() => {
    return variantGroups.find((group) => group.key === safeSelectedGroupKey) || null;
  }, [variantGroups, safeSelectedGroupKey]);

  const displayColorLabel = useMemo(
    () => resolveDisplayColorLabel(currentGroup?.label, product.product_color),
    [currentGroup?.label, product.product_color],
  );

  const sizeStatusByValue = useMemo(() => {
    const statusMap: Record<string, { exists: boolean; hasStock: boolean }> = {};

    for (const size of sizes) {
      const variantsForSize = (currentGroup?.variants || []).filter((variant) => getSizeFromVariant(variant) === size);
      if (variantsForSize.length === 0) {
        statusMap[size] = { exists: false, hasStock: false };
        continue;
      }

      const hasStock = variantsForSize.some((variant) => {
        const stockFromAvailableSize = availableSizeByVariantId.get(variant.id)?.has_stock;
        if (typeof stockFromAvailableSize === 'boolean') {
          return stockFromAvailableSize;
        }

        return Number(variant.stock_quantity || 0) > 0;
      });

      statusMap[size] = { exists: true, hasStock };
    }

    return statusMap;
  }, [sizes, currentGroup, availableSizeByVariantId]);

  const safeSelectedSize = useMemo(() => {
    if (selectedSize && sizeStatusByValue[selectedSize]?.exists) {
      return selectedSize;
    }

    const firstExistingWithStock = sizes.find((size) => {
      const state = sizeStatusByValue[size];
      return state?.exists && state?.hasStock;
    });

    if (firstExistingWithStock) {
      return firstExistingWithStock;
    }

    return sizes.find((size) => sizeStatusByValue[size]?.exists) || sizes[0] || '';
  }, [selectedSize, sizes, sizeStatusByValue]);

  const selectedVariant = useMemo(() => {
    if (!currentGroup || !safeSelectedSize) {
      return null;
    }

    const exactMatch = currentGroup.variants.find((variant) => getSizeFromVariant(variant) === safeSelectedSize);
    if (exactMatch) {
      return exactMatch;
    }

    return null;
  }, [currentGroup, safeSelectedSize]);

  const variantsBySize = useMemo(() => {
    const map: Record<string, Variant> = {};
    for (const v of currentGroup?.variants ?? []) {
      const s = getSizeFromVariant(v);
      if (s) map[s] = v;
    }
    return map;
  }, [currentGroup]);

  const galleryImages = useMemo(() => {
    const variantImages = selectedVariant ? normalizeVariantImages(selectedVariant) : [];
    if (variantImages.length > 0) {
      return variantImages;
    }

    if (currentGroup?.images?.length) {
      return currentGroup.images;
    }

    return productGallery;
  }, [selectedVariant, currentGroup, productGallery]);

  const priceRegular =
    selectedVariant?.price ??
    product.price_regular ??
    product.price ??
    0;

  const saleNumeric = parsePositiveSalePrice(
    selectedVariant?.sale_price ?? product.sale_price,
  );
  const regularNum =
    typeof priceRegular === 'number' && !Number.isNaN(priceRegular) ? priceRegular : 0;
  const onSale = saleNumeric !== null && regularNum > 0 && saleNumeric < regularNum;

  const displayPrice = onSale && saleNumeric !== null ? saleNumeric : regularNum || priceRegular;

  const physicalStoresForDisplay = useMemo(() => {
    const label = (store: PhysicalStore) =>
      (store.display_name || store.alias || store.name || '').trim();

    if (selectedVariant?.physical_stores?.length) {
      return selectedVariant.physical_stores;
    }

    const seen = new Set<string>();
    const aggregated: PhysicalStore[] = [];

    for (const variant of currentGroup?.variants ?? []) {
      for (const store of variant.physical_stores ?? []) {
        const name = label(store);
        if (!name || seen.has(name)) {
          continue;
        }
        seen.add(name);
        aggregated.push(store);
      }
    }

    return aggregated.sort((a, b) => label(a).localeCompare(label(b), 'es'));
  }, [selectedVariant, currentGroup]);

  const computedDiscount =
    onSale && regularNum > 0 && saleNumeric !== null
      ? Math.round((1 - saleNumeric / regularNum) * 100)
      : 0;
  const discountPct =
    onSale && computedDiscount > 0
      ? computedDiscount
      : onSale && typeof product.discount_percentage === 'number' && product.discount_percentage > 0
        ? Math.round(product.discount_percentage)
        : null;

  const handleSizeSelect = (size: string) => {
    setSelectedSize(size);
  };

  const hasDescription = Boolean(
    product?.description &&
      product.description.replace(/<[^>]*>/g, '').trim().length > 0
  );

  return (
    <div className="max-w-300 mx-auto px-4 sm:px-6 lg:px-25 py-6 sm:py-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        <ProductGallery images={galleryImages} name={product.name} />

        <div className="lg:col-span-4 space-y-2">
          <div>
            <h1 className="text-2xl uppercase text-gray-900 font-inter font-bold text-[18px] leading-5 tracking-[0.18px]">
              {product.name}
            </h1>
            <p className="text-sm text-gray-600 font-inter text-[12px] leading-5 tracking-[0.18px]">
              {product.short_description || product.description}
            </p>

            <div className="pt-3 flex flex-wrap items-end gap-x-3 gap-y-1">
              {onSale ? (
                <>
                  <span className="text-lg font-inter font-bold leading-none tracking-tight text-gray-900">
                    ${formatPrice(displayPrice)}
                  </span>
                  <span className="text-sm font-inter text-slate-400 line-through tabular-nums">
                    ${formatPrice(regularNum || priceRegular)}
                  </span>
                  {discountPct !== null && discountPct > 0 ? (
                    <span className="inline-flex items-center rounded-md border border-rose-200 bg-rose-50/90 px-2 py-0.5 text-xs font-bold text-rose-800">
                      Oferta -{discountPct}%
                    </span>
                  ) : null}
                </>
              ) : (
                <p className="text-lg font-inter font-bold leading-none tracking-tight text-gray-900">
                  ${formatPrice(displayPrice)}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {variantGroups.length > 0 ? (
              <div className="space-y-3">
                <div className="grid w-full grid-cols-6 gap-1">
                  {variantGroups.map((group) => {
                    const isActive = safeSelectedGroupKey === group.key;
                    const colorDisplayName =
                      resolveDisplayColorLabel(group.label, null) ?? group.label.trim();
                    const variantHref = colorVariantUrlByGroupKey.get(group.key) ?? '#';

                    return (
                      <ProductColorSwatchButton
                        key={group.key}
                        isActive={isActive}
                        href={variantHref}
                        swatch={{
                          label: colorDisplayName,
                          variantImageUrl: group.variantThumbnailUrl,
                          swatchImageUrl: group.swatchImageUrl,
                          colorHex: group.colorHex,
                          secondaryColorHex: group.secondaryColorHex,
                        }}
                      />
                    );
                  })}
                </div>

                {displayColorLabel ? (
                  <p className="text-xs text-gray-600">
                     {displayColorLabel}
                  </p>
                ) : null}
              </div>
            ) : null}

            <ProductActions
              product={product}
              sizes={sizes}
              selectedSize={safeSelectedSize}
              selectedVariant={selectedVariant}
              selectedVariantLabel={displayColorLabel ?? undefined}
              sizeStatusByValue={sizeStatusByValue}
              variantsBySize={variantsBySize}
              onSelectSize={handleSizeSelect}
            />
          </div>

          {hasDescription ? (
            <details className="pt-6 group">
              <summary className="flex justify-between items-center cursor-pointer pb-4 list-none">
                <span className="font-medium text-[15px] group-hover:text-black transition">Descripción</span>
                <ChevronDown size={20} className="text-gray-500 transition-transform duration-300 group-open:rotate-180" />
              </summary>
              <p className="text-[14px] leading-7 text-gray-700 mt-2 transition-all duration-300">
                {product.description}
              </p>
            </details>
          ) : null}

          <details className="pt-6 group">
            <summary className="flex justify-between items-center cursor-pointer pb-4 list-none">
              <span className="font-medium text-[15px] group-hover:text-black transition">Detalles</span>
              <ChevronDown size={20} className="text-gray-500 transition-transform duration-300 group-open:rotate-180" />
            </summary>
            <ul className="text-[14px] text-gray-700 space-y-1 mt-2">
              <li>• Còdigo de estilo: {product.style_code}</li>
              <li>• Marca: {product.brand?.name}</li>
              {displayColorLabel ? <li>• Color: {displayColorLabel}</li> : null}
              {product.pro_nombre_cotizaciones?.trim() ? (
                <li>• {product.pro_nombre_cotizaciones.trim()}</li>
              ) : null}
            </ul>
          </details>
          
          <ProductPhysicalStoreAvailability stores={physicalStoresForDisplay} />
          
        </div>
      </div>

      <RelatedProductsSection products={relatedProducts} />
    </div>
  );
}
