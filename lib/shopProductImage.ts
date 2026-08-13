import type { SyntheticEvent } from 'react';

export const SHOP_PRODUCT_IMAGE_PLACEHOLDER = '/storage/galaxia_deportes_placeholder.webp';

export function resolveShopProductImageSrc(src?: string | null): string {
  const trimmed = typeof src === 'string' ? src.trim() : '';

  return trimmed || SHOP_PRODUCT_IMAGE_PLACEHOLDER;
}

export function handleShopProductImageError(
  event: SyntheticEvent<HTMLImageElement, Event>,
): void {
  const target = event.currentTarget;
  target.onerror = null;
  target.src = SHOP_PRODUCT_IMAGE_PLACEHOLDER;
}
