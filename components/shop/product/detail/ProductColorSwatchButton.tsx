'use client';

import Link from 'next/link';
import { ColorSwatch } from '@/components/ui/ColorSwatch';
import {
  handleShopProductImageError,
  resolveShopProductImageSrc,
} from '@/lib/shopProductImage';

export interface ColorSwatchVisual {
  label: string;
  /** Nivel 1: miniatura real de variante de este color */
  variantImageUrl?: string | null;
  /** Nivel 2: textura / swatch del atributo color */
  swatchImageUrl?: string | null;
  /** Nivel 3: hex principal */
  colorHex?: string | null;
  /** Nivel 3: hex secundario (combinados WHITE/BLUE) */
  secondaryColorHex?: string | null;
}

interface ProductColorSwatchButtonProps {
  swatch: ColorSwatchVisual;
  isActive: boolean;
  href: string;
}

export default function ProductColorSwatchButton({
  swatch,
  isActive,
  href,
}: ProductColorSwatchButtonProps) {
  const variantImage = swatch.variantImageUrl?.trim() || null;
  const texture = swatch.swatchImageUrl?.trim() || null;
  const primaryHex = swatch.colorHex?.trim() || null;
  const secondaryHex = swatch.secondaryColorHex?.trim() || null;
  const colorName = swatch.label.trim();

  return (
    <Link
      href={href}
      prefetch
      scroll={false}
      className={`relative flex w-full aspect-square items-center justify-center overflow-hidden bg-gray-100 transition ${
        isActive
          ? 'border-2 border-black'
          : 'border border-transparent hover:border-slate-300'
      }`}
      title={colorName}
      aria-label={colorName}
      aria-current={isActive ? 'true' : undefined}
    >
      {variantImage ? (
        <img
          src={resolveShopProductImageSrc(variantImage)}
          alt=""
          className="h-full w-full object-contain"
          onError={handleShopProductImageError}
        />
      ) : texture ? (
        <span
          className="block h-full w-full bg-cover bg-center"
          style={{ backgroundImage: `url(${texture})` }}
          role="img"
          aria-label={colorName}
        />
      ) : (
        <ColorSwatch
          color={primaryHex || '#e5e7eb'}
          secondary={secondaryHex}
          size="fill"
          shape="square"
          title={colorName}
          className="border-0 shadow-none pointer-events-none"
        />
      )}
    </Link>
  );
}
