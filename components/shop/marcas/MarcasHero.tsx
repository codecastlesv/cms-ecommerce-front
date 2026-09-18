'use client';

import { ShieldCheck } from 'lucide-react';
import { iconMap } from '@/lib/icon-map';
import { LayoutList } from 'lucide-react';

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

function resolveIcon(name?: string | null) {
  return (name && iconMap[name]) || LayoutList;
}

export default function MarcasHero({
  banner,
  highlights,
  totalBrands,
}: {
  banner: BannerItem | null;
  highlights: HighlightItem[];
  totalBrands: number;
}) {
  const headline = banner?.headline?.trim() || 'Encuentra tus marcas favoritas';
  const description =
    banner?.body_text?.trim() ||
    banner?.subheadline?.trim() ||
    'Descubre productos de las mejores marcas en ferreterías, construcción, hogar y proyectos.';

  return (
    <section className="px-4 pt-6 sm:px-6 lg:px-10 xl:px-14">
      <div className="mx-auto w-full max-w-[1440px]">
        <div className="rounded-3xl bg-[#EEF2FF] px-6 py-10 sm:px-10 sm:py-12">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-8 xl:gap-16">
            <div className="max-w-xl space-y-4 lg:min-w-0 lg:flex-1">
              <h1 className="font-helvetica text-[32px] font-bold leading-tight text-[#08204E] md:text-[40px]">
                {headline}
              </h1>
              <p className="font-helvetica text-[1em] leading-relaxed text-slate-600">
                {description}
              </p>
              {totalBrands > 0 ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-[#08204E] shadow-sm">
                  <ShieldCheck size={16} className="text-[#304C94]" />
                  +{totalBrands.toLocaleString('es-SV')} marcas disponibles
                </span>
              ) : null}
            </div>

            {highlights.length > 0 ? (
              <div className="hidden md:grid md:grid-cols-4 md:gap-6 lg:shrink-0 lg:gap-3 xl:gap-6">
                {highlights.map((item) => {
                  const Icon = resolveIcon(item.icon);
                  return (
                    <div key={item.id} className="flex max-w-[150px] flex-col items-center gap-2.5 text-center lg:max-w-[110px] xl:max-w-[150px]">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white text-[#304C94]">
                        <Icon size={32} strokeWidth={1.75} />
                      </div>
                      <p className="font-helvetica text-[14px] font-bold leading-snug text-[#08204E]">
                        {item.title}
                      </p>
                      {item.description ? (
                        <p className="text-[13px] leading-snug text-slate-500">{item.description}</p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
