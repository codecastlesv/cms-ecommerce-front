'use client';

import { Suspense } from 'react';
import MarcasHero from './MarcasHero';
import MarcasBrowser from './MarcasBrowser';
import FadeReveal from '@/components/shop/animations/FadeReveal';

interface BannerItem {
  id: number | string;
  headline?: string | null;
  subheadline?: string | null;
  body_text?: string | null;
}

interface HighlightItem {
  id: number | string;
  icon?: string | null;
  title?: string | null;
  description?: string | null;
}

interface Brand {
  id: number | string;
  name: string;
  slug: string;
  logo_url?: string | null;
  is_featured?: boolean;
}

interface BrandsMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

export default function MarcasPageContent({
  heroItems,
  highlights,
  initialBrands,
  initialMeta,
}: {
  heroItems: BannerItem[];
  highlights: HighlightItem[];
  initialBrands: Brand[];
  initialMeta: BrandsMeta;
}) {
  const heroBanner = heroItems[0] || null;

  return (
    <div className="min-h-screen bg-white text-black">
      <FadeReveal mount duration={0.85} y={10} scale={0.996}>
        <MarcasHero banner={heroBanner} highlights={highlights} totalBrands={initialMeta?.total ?? 0} />
      </FadeReveal>

      <FadeReveal delay={0.08} duration={0.85} y={12} scale={0.997}>
        <Suspense fallback={null}>
          <MarcasBrowser initialBrands={initialBrands} initialMeta={initialMeta} />
        </Suspense>
      </FadeReveal>
    </div>
  );
}
