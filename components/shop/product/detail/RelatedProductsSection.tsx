'use client';

import Link from 'next/link';
import {
  handleShopProductImageError,
  resolveShopProductImageSrc,
} from '@/lib/shopProductImage';
import { getProductUrl } from '@/lib/urls';

export interface RelatedProductItem {
  id: number;
  slug: string;
  seo_url?: string | null;
  name: string;
  brand_name?: string | null;
  product_color?: string | null;
  sku?: string | null;
  variant_sku?: string | null;
  categoria_hija?: string | null;
  price: number;
  main_image_url?: string | null;
}

function formatPrice(value: number): string {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '0.00';
  }

  return value.toFixed(2);
}

interface RelatedProductsSectionProps {
  products: RelatedProductItem[];
}

export default function RelatedProductsSection({ products }: RelatedProductsSectionProps) {
  if (products.length === 0) {
    return null;
  }

  return (
    <section className="mt-16 pt-10">
      <h2 className="font-bold text-gray-900 text-lg sm:text-xl mb-6">
        También podría gustarte
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {products.map((item) => (
          <Link
            key={item.id}
            href={getProductUrl({
              name: item.name,
              brand_name: item.brand_name,
              seo_url: item.seo_url,
              variant_sku: item.sku || item.variant_sku,
              sku: item.sku || item.variant_sku,
            })}
            className="group block"
          >
            <div className="aspect-square bg-white rounded-md overflow-hidden flex items-center justify-center">
              <img
                src={resolveShopProductImageSrc(item.main_image_url)}
                alt={item.name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                onError={handleShopProductImageError}
              />
            </div>

            {item.brand_name ? (
              <p className="text-[11px] uppercase tracking-wider text-gray-400 font-medium mt-3">
                {item.brand_name}
              </p>
            ) : null}

            <div className="flex justify-between items-start gap-2 mt-1">
              <p className="font-bold uppercase text-sm text-gray-900 text-left line-clamp-2">
                {item.name}
              </p>
              <p className="font-bold text-sm text-gray-900 text-right whitespace-nowrap tabular-nums">
                ${formatPrice(item.price)}
              </p>
            </div>

            {item.categoria_hija ? (
              <p className="text-xs text-gray-500 mt-0.5 text-left">
                {item.categoria_hija}
              </p>
            ) : null}
          </Link>
        ))}
      </div>
    </section>
  );
}
