/**
 * Utilidades centralizadas para URLs SEO de productos en la tienda.
 * Patrón: /productos/[marca]-[nombre]-[color]-[upc]
 */

export interface ProductUrlInput {
  name: string;
  brand_name?: string | null;
  brand?: string | { name?: string | null } | null;
  product_color?: string | null;
  color_name?: string | null;
  variant_sku?: string | null;
  upc?: string | null;
  sku?: string | null;
  /** Si el backend ya calculó la URL, usarla directamente. */
  seo_url?: string | null;
}

function resolveBrandName(product: ProductUrlInput): string {
  if (product.brand_name?.trim()) {
    return product.brand_name.trim();
  }

  if (typeof product.brand === 'string' && product.brand.trim()) {
    return product.brand.trim();
  }

  if (product.brand && typeof product.brand === 'object' && product.brand.name?.trim()) {
    return product.brand.name.trim();
  }

  return '';
}

function resolveColorName(product: ProductUrlInput): string {
  return (product.color_name ?? product.product_color ?? '').trim();
}

function resolveUpc(product: ProductUrlInput): string {
  const raw = product.variant_sku ?? product.upc ?? product.sku ?? '';
  return sanitizeUpc(String(raw));
}

/** Segmento de texto: minúsculas, guiones; "2.0" → "2-0". */
export function sanitizeTextSegment(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\./g, '-')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Color para URL: "/" y espacios → "-", sin guiones duplicados. */
export function sanitizeColorForUrl(color: string): string {
  return color
    .trim()
    .toLowerCase()
    .replace(/[/\s]+/g, '-')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/** UPC / código Brilo sin espacios. */
export function sanitizeUpc(code: string): string {
  return code.replace(/\s+/g, '');
}

export function buildProductSeoSlug(
  brandName: string,
  productName: string,
  colorName: string,
  upc: string,
): string {
  const parts = [
    sanitizeTextSegment(brandName),
    sanitizeTextSegment(productName),
    colorName ? sanitizeColorForUrl(colorName) : '',
    sanitizeUpc(upc),
  ].filter(Boolean);

  return parts.length > 0 ? parts.join('-') : 'producto';
}

/** Extrae el UPC del final del slug de la URL. */
export function extractUpcFromSlug(slug: string): string | null {
  const trimmed = slug.trim();
  if (!trimmed) return null;
  if (/^\d+$/.test(trimmed)) return trimmed;

  const match = trimmed.match(/-(\d+)$/);
  return match ? match[1] : null;
}

/**
 * Construye la URL pública del producto.
 * Nunca hardcodear rutas de producto en componentes; usar siempre esta función.
 */
export function getProductUrl(product: ProductUrlInput): string {
  if (product.seo_url?.trim()) {
    const path = product.seo_url.trim();
    return path.startsWith('/') ? path : `/${path}`;
  }

  const brand = resolveBrandName(product);
  const name = product.name?.trim() || 'producto';
  const color = resolveColorName(product);
  const upc = resolveUpc(product);

  const slug = buildProductSeoSlug(brand, name, color, upc);
  return `/productos/${slug}`;
}
