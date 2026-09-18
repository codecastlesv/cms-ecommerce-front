'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface BannerCta {
  text?: string | null;
  url?: string | null;
  new_tab?: boolean;
}

interface BannerItem {
  id: number | string;
  title?: string | null;
  headline?: string | null;
  subheadline?: string | null;
  body_text?: string | null;
  image_url?: string | null;
  mobile_url?: string | null;
  alt_text?: string | null;
  cta?: BannerCta;
  cta2?: BannerCta;
  style?: {
    cta_bg_color?: string | null;
    cta_text_color?: string | null;
    cta2_bg_color?: string | null;
    cta2_text_color?: string | null;
    cta2_bg_transparent?: boolean;
  };
}

function ctaButtonClass(filled: boolean): string {
  return filled
    ? 'inline-flex items-center gap-2 rounded-sm px-6 py-3 font-inter text-[1em] font-semibold transition hover:brightness-95'
    : 'inline-flex items-center gap-2 rounded-sm border px-6 py-3 font-inter text-[1em] font-semibold transition hover:bg-white/10';
}

export default function AboutHero({ banner }: { banner: BannerItem | null }) {
  if (!banner) {
    return (
      <div className="flex h-[45vh] items-center justify-center bg-slate-50 italic text-slate-300">
        Nosotros
      </div>
    );
  }

  const description = banner.body_text?.trim() || banner.subheadline?.trim() || '';
  const cta = banner.cta;
  const cta2 = banner.cta2;

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        <img
          src={banner.image_url || undefined}
          alt={banner.alt_text || banner.headline || 'Nosotros'}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/85 to-white/40" />
      </div>

      <div className="relative mx-auto w-full max-w-[1440px] px-4 py-16 sm:px-6 md:py-24 lg:px-10 xl:px-14">
        <div className="max-w-lg space-y-5">
          <h1 className="font-helvetica text-[32px] font-bold leading-tight text-[#08204E] md:text-[40px]">
            {banner.headline}
          </h1>

          {description ? (
            <p className="whitespace-pre-line font-helvetica text-[1em] leading-relaxed text-slate-700">
              {description}
            </p>
          ) : null}

          {(cta?.text || cta2?.text) && (
            <div className="flex flex-wrap gap-3 pt-2">
              {cta?.text ? (
                <Link
                  href={cta.url || '#'}
                  target={cta.new_tab ? '_blank' : undefined}
                  rel={cta.new_tab ? 'noopener noreferrer' : undefined}
                  className={ctaButtonClass(true)}
                  style={{
                    backgroundColor: banner.style?.cta_bg_color || '#E30613',
                    color: banner.style?.cta_text_color || '#ffffff',
                  }}
                >
                  {cta.text}
                  <ArrowRight size={16} />
                </Link>
              ) : null}

              {cta2?.text ? (
                <Link
                  href={cta2.url || '#'}
                  target={cta2.new_tab ? '_blank' : undefined}
                  rel={cta2.new_tab ? 'noopener noreferrer' : undefined}
                  className={ctaButtonClass(false)}
                  style={{
                    backgroundColor: banner.style?.cta2_bg_transparent
                      ? 'transparent'
                      : banner.style?.cta2_bg_color || 'transparent',
                    borderColor: banner.style?.cta2_text_color || '#08204E',
                    color: banner.style?.cta2_text_color || '#08204E',
                  }}
                >
                  {cta2.text}
                  <ArrowRight size={16} />
                </Link>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
