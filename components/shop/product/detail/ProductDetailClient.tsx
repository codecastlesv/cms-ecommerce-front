"use client";

import { ChevronDown, FileText } from 'lucide-react';
import ProductGallery from './ProductGallery';
import ProductActions from './ProductActions';
import ProductPhysicalStoreAvailability from './ProductPhysicalStoreAvailability';
import RelatedProductsSection, { type RelatedProductItem } from './RelatedProductsSection';
import TrustBadges from '@/components/shop/home/TrustBadges';
import { parsePositiveSalePrice } from '@/utils/shopPricing';

interface ProductAttribute {
  id: number;
  value: string;
  slug?: string | null;
  attribute?: {
    id?: number | null;
    name?: string | null;
    slug?: string | null;
  };
}

interface PhysicalStore {
  name: string;
  alias?: string | null;
  display_name?: string;
  available?: number;
}

interface ProductDetailData {
  id: number;
  sku?: string;
  codigo?: string | null;
  name: string;
  description?: string;
  short_description?: string;
  brand?: { name?: string };
  in_stock?: boolean;
  price?: number;
  sale_price?: number | null;
  price_regular?: number;
  discount_percentage?: number | null;
  stock_quantity?: number;
  main_image?: string;
  external_image_url?: string | null;
  gallery?: string[];
  images?: Array<{ url: string }>;
  categories?: Array<{ name: string }>;
  specs?: Array<{ label: string; value: string }>;
  attributes?: ProductAttribute[];
  physical_stores?: PhysicalStore[];
  technical_spec_pdf_url?: string | null;
  precio_lista_sin_iva?: number | null;
  tipo_precio?: string | null;
  descuento_por_aplicar?: number | null;
  promo_desde?: string | null;
  promo_hasta?: string | null;
  is_promo_active?: boolean;
  promo_price?: number | null;
}

function formatPrice(value: number): string {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '0.00';
  }
  return value.toFixed(2);
}

function formatPromoUntil(value?: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function discountPercentFromRate(rate: number): number {
  if (!Number.isFinite(rate) || rate <= 0) return 0;
  return Math.round(rate > 1 ? rate : rate * 100);
}

export default function ProductDetailClient({
  product,
  relatedProducts,
}: {
  product: ProductDetailData;
  relatedProducts: RelatedProductItem[];
}) {
  const galleryImages = (() => {
    if (Array.isArray(product.gallery) && product.gallery.length > 0) {
      return product.gallery;
    }
    if (Array.isArray(product.images) && product.images.length > 0) {
      return product.images.map((image) => image.url).filter(Boolean);
    }
    if (product.main_image) {
      return [product.main_image];
    }
    if (product.external_image_url) {
      return [product.external_image_url];
    }
    return [];
  })();

  const regularNum = Number(product.price_regular ?? product.price ?? 0) || 0;
  const olympusPromoPrice = Number(product.promo_price);
  const isOlympusPromo =
    Boolean(product.is_promo_active) &&
    Number.isFinite(olympusPromoPrice) &&
    olympusPromoPrice > 0 &&
    (regularNum <= 0 || olympusPromoPrice < regularNum);
  const saleNumeric = isOlympusPromo ? olympusPromoPrice : parsePositiveSalePrice(product.sale_price);
  const onSale = saleNumeric !== null && regularNum > 0 && saleNumeric < regularNum;
  const displayPrice = onSale && saleNumeric !== null ? saleNumeric : regularNum;
  const computedDiscount =
    onSale && regularNum > 0 && saleNumeric !== null
      ? Math.round((1 - saleNumeric / regularNum) * 100)
      : 0;
  const olympusDiscountPct = discountPercentFromRate(Number(product.descuento_por_aplicar ?? 0));
  const discountPct = isOlympusPromo && olympusDiscountPct > 0
    ? olympusDiscountPct
    : onSale && computedDiscount > 0
      ? computedDiscount
      : onSale && typeof product.discount_percentage === 'number' && product.discount_percentage > 0
        ? Math.round(product.discount_percentage)
        : null;
  const promoUntil = isOlympusPromo ? formatPromoUntil(product.promo_hasta) : null;
  const priceWithoutTax = Number(product.precio_lista_sin_iva);

  const presentacion = (product.attributes ?? []).find((item) => {
    const slug = (item.attribute?.slug || '').toLowerCase();
    const name = (item.attribute?.name || '').toLowerCase();
    return slug === 'presentacion' || name === 'presentación' || name === 'presentacion';
  })?.value;

  const specRows = (product.specs ?? []).filter((row) => row.label && row.value);
  const hasDescription = Boolean(
    product?.description && product.description.replace(/<[^>]*>/g, '').trim().length > 0
  );

  return (
    <>
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

              <div className="pt-3 space-y-1.5">
                <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
                  {onSale ? (
                    <>
                      <span className={`text-2xl font-inter font-bold leading-none tracking-tight ${isOlympusPromo ? 'text-red-600' : 'text-gray-900'}`}>
                        ${formatPrice(displayPrice)}
                      </span>
                      <span className="text-sm font-inter text-slate-400 line-through tabular-nums">
                        ${formatPrice(regularNum)}
                      </span>
                      {discountPct !== null && discountPct > 0 ? (
                        <span className="inline-flex items-center rounded-md border border-rose-200 bg-rose-50/90 px-2 py-0.5 text-xs font-bold text-rose-800">
                          -{discountPct}% OFF
                        </span>
                      ) : null}
                    </>
                  ) : (
                    <p className="text-lg font-inter font-bold leading-none tracking-tight text-gray-900">
                      ${formatPrice(displayPrice)}
                    </p>
                  )}
                </div>
                {promoUntil ? (
                  <p className="text-xs text-gray-500">Oferta válida hasta el {promoUntil}</p>
                ) : null}
              </div>
            </div>

            <ProductActions product={product} presentacion={presentacion} />

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

            {product.technical_spec_pdf_url ? (
              <a
                href={product.technical_spec_pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 pt-2 text-sm font-medium text-gray-900 hover:underline"
              >
                <FileText size={16} className="text-gray-500" />
                Descargar ficha técnica (PDF)
              </a>
            ) : null}

            <details className="pt-6 group" open>
              <summary className="flex justify-between items-center cursor-pointer pb-4 list-none">
                <span className="font-medium text-[15px] group-hover:text-black transition">Detalles</span>
                <ChevronDown size={20} className="text-gray-500 transition-transform duration-300 group-open:rotate-180" />
              </summary>
              <ul className="text-[14px] text-gray-700 space-y-1 mt-2">
                {product.brand?.name ? <li>• Marca: {product.brand.name}</li> : null}
                {specRows.map((row) => (
                  <li key={`${row.label}-${row.value}`}>• {row.label}: {row.value}</li>
                ))}
              </ul>
            </details>

            <ProductPhysicalStoreAvailability stores={product.physical_stores ?? []} />
          </div>
        </div>


      </div>
      <TrustBadges />
      {
        relatedProducts.length > 0 && (
          <div className="max-w-300 mx-auto px-4 sm:px-6 lg:px-25 py-6 sm:py-10">
            <RelatedProductsSection products={relatedProducts} />
          </div>          
        )
      }
    </>
    
  );
}
