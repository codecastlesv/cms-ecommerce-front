'use client';

import { LayoutList } from 'lucide-react';
import { iconMap } from '@/lib/icon-map';
import AboutHero from './AboutHero';
import BrandSection from '@/components/shop/home/BrandSection';
import TrustBadges from '@/components/shop/home/TrustBadges';
import FadeReveal from '@/components/shop/animations/FadeReveal';

interface BannerItem {
  id: number | string;
  title?: string | null;
  headline?: string | null;
  subheadline?: string | null;
  body_text?: string | null;
  image_url?: string | null;
  mobile_url?: string | null;
  alt_text?: string | null;
  cta?: { text?: string | null; url?: string | null; new_tab?: boolean };
  cta2?: { text?: string | null; url?: string | null; new_tab?: boolean };
  style?: {
    cta_bg_color?: string | null;
    cta_text_color?: string | null;
    cta2_bg_color?: string | null;
    cta2_text_color?: string | null;
    cta2_bg_transparent?: boolean;
  };
}

interface ContentBlockItem {
  id: number | string;
  icon?: string | null;
  eyebrow?: string | null;
  title?: string | null;
  description?: string | null;
}

interface Brand {
  id: string | number;
  name: string;
  slug: string;
  logo_url?: string | null;
  logo?: string | null;
  is_featured?: boolean;
}

/** Mismo contenedor que usa Header.tsx para el hamburguesa/nav, para que todo el "Nosotros" quede alineado. */
const CONTAINER_CLASS = 'mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-10 xl:px-14';

function resolveIcon(name?: string | null) {
  return (name && iconMap[name]) || LayoutList;
}

function ValueCard({ item }: { item: ContentBlockItem }) {
  const Icon = resolveIcon(item.icon);
  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center text-[#304C94]">
        <Icon size={45} strokeWidth={1.5} />
      </div>
      <h3 className="mb-1 font-helvetica text-[20px] font-bold text-slate-900">{item.title}</h3>
      {item.description ? (
        <p className="font-helvetica text-[1em] leading-relaxed text-slate-500">{item.description}</p>
      ) : null}
    </div>
  );
}

export default function NosotrosPageContent({
  heroItems,
  values,
  stats,
  timelineIntro,
  timeline,
  brands,
}: {
  heroItems: BannerItem[];
  values: ContentBlockItem[];
  stats: ContentBlockItem[];
  timelineIntro: string;
  timeline: ContentBlockItem[];
  brands: Brand[];
}) {
  const heroBanner = heroItems[0] || null;

  return (
    <div className="min-h-screen bg-white text-black">
      {/* HERO */}
      <FadeReveal mount duration={0.85} y={10} scale={0.996}>
        <AboutHero banner={heroBanner} />
      </FadeReveal>

      {/* NUESTROS VALORES */}
      {values.length > 0 && (
        <FadeReveal className="bg-foreground py-14" delay={0.06} duration={0.85} y={14} scale={0.996}>
          <div className={CONTAINER_CLASS}>
            <h2 className="mb-10 font-helvetica text-[24px] font-bold text-[#08204E] md:text-[28px]">
              Nuestros valores
            </h2>
            {/* < 1200px: 1 columna en móvil, 3 + 2 centrados en tablet */}
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-10 min-[1200px]:hidden">
              {values.map((item) => (
                <div key={item.id} className="w-full md:w-[calc((100%-4rem)/3)]">
                  <ValueCard item={item} />
                </div>
              ))}
            </div>

            {/* >= 1200px: misma estructura simple que ya teníamos al inicio (grid de 5 columnas) */}
            <div className="hidden min-[1200px]:grid min-[1200px]:grid-cols-5 min-[1200px]:gap-8">
              {values.map((item) => (
                <ValueCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        </FadeReveal>
      )}

      {/* NUESTRA TRAYECTORIA EN NÚMEROS — franja de ancho completo */}
      {stats.length > 0 && (
        <FadeReveal className="w-full bg-foreground py-8" delay={0.1} duration={0.85} y={14} scale={0.996}>
          <div className={CONTAINER_CLASS}>
            <p className="mb-6 font-helvetica text-[28px] font-bold tracking-wide text-[#08204E]">
              Nuestra trayectoria en números
            </p>
            <div className="grid grid-cols-1 divide-y divide-slate-200 min-[768px]:max-[991px]:grid-cols-2 min-[768px]:max-[991px]:divide-y-0 min-[992px]:grid-cols-4 min-[992px]:divide-y-0 min-[992px]:divide-x">
              {stats.map((stat) => {
                const Icon = resolveIcon(stat.icon);
                return (
                  <div key={stat.id} className="flex items-center gap-3 py-4 min-[992px]:px-6 min-[992px]:py-0 min-[992px]:first:pl-0 min-[992px]:last:pr-0">
                    <Icon size={52} className="shrink-0 text-[#304C94]" strokeWidth={1.5} />
                    <div>
                      <p className="font-helvetica text-[28px] font-bold text-[#304C94]">{stat.title}</p>
                      <p className="font-helvetica text-[1em] font-normal leading-tight text-slate-500">{stat.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </FadeReveal>
      )}

      {/* NUESTRA HISTORIA — texto como primera columna, items después (desktop); apilado en mobile/tablet */}
      {(timelineIntro || timeline.length > 0) && (
        <FadeReveal className="bg-foreground py-14" delay={0.14} duration={0.85} y={14} scale={0.996}>
          <div className={CONTAINER_CLASS}>
            <h2 className="mb-8 font-helvetica text-[24px] font-bold text-[#08204E] md:text-[28px]">
              Nuestra historia
            </h2>

            <div className="grid grid-cols-1 items-end gap-10 lg:grid-cols-[18rem_1fr]">
              {timelineIntro ? (
                <p className="whitespace-pre-line font-inter text-[14px] leading-relaxed text-slate-600">
                  {timelineIntro}
                </p>
              ) : null}

              {timeline.length > 0 && (
                <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-4">
                  {timeline.map((item) => {
                    const Icon = resolveIcon(item.icon);
                    return (
                      <div key={item.id} className="space-y-2 self-start max-[767px]:flex max-[767px]:flex-col max-[767px]:items-center max-[767px]:text-center">
                        <Icon size={64} className="text-[#304C94]" strokeWidth={1.5} />
                        <p className="font-helvetica text-[20px] font-bold text-slate-900">
                          <span className="text-[#304C94]">{item.eyebrow}</span>{' '}
                          <span className="font-normal text-slate-500">{item.title}</span>
                        </p>
                        {item.description ? (
                          <p className="font-inter text-[13px] leading-relaxed text-slate-500">
                            {item.description}
                          </p>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </FadeReveal>
      )}

      {/* MARCAS */}
      <FadeReveal className="py-4 bg-foreground" delay={0.18} duration={0.9} y={12} scale={0.996}>
        <div className={CONTAINER_CLASS}>
          <BrandSection brands={brands} />
        </div>
      </FadeReveal>

      {/* TRUST BADGES */}
      <FadeReveal delay={0.22} duration={0.9} y={12} scale={0.996}>
        <TrustBadges />
      </FadeReveal>
    </div>
  );
}
