'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  handleShopProductImageError,
  resolveShopProductImageSrc,
} from '@/lib/shopProductImage';

interface Brand {
  id: string | number;
  name: string;
  slug: string;
  logo_url?: string | null;
  logo?: string | null;
  is_featured?: boolean;
}

interface BrandSectionProps {
  brands: Brand[];
}

function brandLogoSrc(brand: Brand): string {
  return resolveShopProductImageSrc(brand.logo_url || brand.logo);
}

function sortBrandsFeaturedFirst(brands: Brand[]): Brand[] {
  return [...brands].sort((a, b) => {
    const featuredDelta = (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0);
    if (featuredDelta !== 0) return featuredDelta;
    return String(a.name || '').localeCompare(String(b.name || ''), 'es', {
      sensitivity: 'base',
    });
  });
}

const BrandSection = ({ brands }: BrandSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const orderedBrands = useMemo(() => sortBrandsFeaturedFirst(brands), [brands]);
  const marqueeBrands = orderedBrands.slice(0, 6);

  return (
    <section className="py-10 md:pt-16 flex flex-col">
      <div className="container mx-auto px-4 text-center">
        <h2 className="font-bebas font-normal text-[28px] md:text-[36px] leading-tight md:leading-[45px] tracking-[2px] text-center uppercase mb-8 md:mb-2 md:pb-5">
          Elige entre las mejores marcas
        </h2>

        <AnimatePresence mode="wait">
          {!isExpanded ? (
            <motion.div
              key="brand-marquee"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-5"
            >
              <div className="group relative w-full overflow-hidden bg-white py-8 md:py-12">
                <style dangerouslySetInnerHTML={{
                  __html: `
                    @keyframes marquee-brands {
                      0% { transform: translateX(0); }
                      100% { transform: translateX(-50%); }
                    }
                    .animate-marquee-brands {
                      display: flex;
                      width: max-content;
                      animation: marquee-brands 80s linear infinite;
                    }
                    .group:hover .animate-marquee-brands {
                      animation-play-state: paused;
                    }
                  `
                }} />

                <div className="animate-marquee-brands">
                  {[...marqueeBrands, ...marqueeBrands].map((brd, i) => (
                    <Link
                      key={`${brd.id}-${i}`}
                      href={`/shop/brands/${brd.slug}`}
                      className="group/card flex flex-col items-center px-2 md:px-2 lg:px-2 flex-shrink-0 transition-all duration-300 hover:-translate-y-2"
                    >
                      <div className="flex aspect-square w-32 md:w-40 items-center justify-center overflow-hidden rounded-2xl transition-all duration-300">
                        <img
                          src={brandLogoSrc(brd)}
                          alt={brd.name}
                          className="h-full w-full object-contain p-4 transition-transform duration-700 group-hover/card:scale-110"
                          onError={handleShopProductImageError}
                        />
                      </div>
                    </Link>
                  ))}
                </div>

                <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-white via-white/80 to-transparent z-20" />
                <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-white via-white/80 to-transparent z-20" />
              </div>

              {orderedBrands.length > 6 ? (
                <button
                  type="button"
                  onClick={() => setIsExpanded(true)}
                  className="inline-flex items-center justify-center self-center rounded-full border border-black/10 bg-white px-5 py-2 font-inter text-[13px] font-semibold text-black shadow-[0_8px_24px_rgba(91,91,91,0.05)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(15,23,42,0.08)] hover:bg-black hover:text-white"
                >
                  Ver todas las  marcas
                </button>
              ) : null}
            </motion.div>
          ) : (
            <motion.div
              key="brand-expanded"
              initial={{ opacity: 0, y: 18, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.985 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="relative rounded-[32px] border border-black/5 bg-gradient-to-b from-white to-slate-50 px-4 py-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] md:px-6 md:py-8"
            >
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-black shadow-sm transition-all duration-300 hover:scale-105 hover:bg-black hover:text-white md:right-5 md:top-5"
                aria-label="Cerrar marcas"
              >
                ✕
              </button>

              <div className="mb-6 text-left">
                <p className="font-inter text-[12px] uppercase tracking-[0.24em] text-slate-400">
                  Todas las marcas
                </p>
                <p className="font-inter mt-2 text-[14px] text-slate-500">
                  Selecciona la marca que quieras ver.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                {orderedBrands.map((brd, index) => (
                  <motion.div
                    key={brd.id}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <Link
                      href={`/shop/brands/${brd.slug}`}
                      className="group/card flex flex-col items-center transition-all duration-300 hover:-translate-y-1"
                    >
                      <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.05)] transition-all duration-300 group-hover/card:border-black-400 group-hover/card:shadow-[0_18px_38px_rgba(6,182,212,0.12)]">
                        <img
                          src={brandLogoSrc(brd)}
                          alt={brd.name}
                          className="h-full w-full object-contain p-5 transition-transform duration-700 group-hover/card:scale-110"
                          onError={handleShopProductImageError}
                        />
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </section>
  );
};

export default BrandSection;
