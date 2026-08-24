'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface HeroSliderProps {
    banners: any[];
    settings?: any;
}

const FALLBACK_BG = '#0B2340';
const ACCENT_RED = '#E30613';

function resolveBgColor(banner: any): string {
    const raw = banner?.style?.bg_color || banner?.bg_color;
    if (typeof raw === 'string' && raw.trim()) {
        return raw.trim();
    }
    return FALLBACK_BG;
}

/** Última línea (o última palabra) en rojo, como el mock. */
function Headline({ text }: { text: string }) {
    const normalized = text.replace(/\\n/g, '\n').trim();
    const lines = normalized.split(/\n+/).map((l) => l.trim()).filter(Boolean);

    if (lines.length > 1) {
        const last = lines[lines.length - 1];
        const rest = lines.slice(0, -1);
        return (
            <>
                {rest.map((line) => (
                    <span key={line} className="block text-white">
                        {line}
                    </span>
                ))}
                <span className="block" style={{ color: ACCENT_RED }}>
                    {last}
                </span>
            </>
        );
    }

    const words = normalized.split(/\s+/).filter(Boolean);
    if (words.length <= 1) {
        return <span className="text-white">{normalized}</span>;
    }

    const lastWord = words[words.length - 1];
    const lead = words.slice(0, -1).join(' ');
    return (
        <>
            <span className="text-white">{lead} </span>
            <span style={{ color: ACCENT_RED }}>{lastWord}</span>
        </>
    );
}

export default function HeroSlider({ banners }: HeroSliderProps) {
    const [current, setCurrent] = useState(0);
    const [isHovered, setIsHovered] = useState(false);

    const nextSlide = useCallback(() => {
        setCurrent((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
    }, [banners.length]);

    const prevSlide = () => {
        setCurrent((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
    };

    useEffect(() => {
        if (isHovered || banners.length <= 1) return;
        const interval = setInterval(nextSlide, 5000);
        return () => clearInterval(interval);
    }, [isHovered, nextSlide, banners.length]);

    if (!banners || banners.length === 0) return null;

    const activeBg = resolveBgColor(banners[current]);

    return (
        <div
            className="group relative h-[500px] w-full overflow-hidden font-helvetica md:h-[620px]"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{ backgroundColor: activeBg }}
        >
            {banners.map((banner, index) => {
                const bgColor = resolveBgColor(banner);
                const isActive = index === current;

                return (
                    <div
                        key={banner.id}
                        className={`absolute inset-0 h-full w-full transition-opacity duration-700 ease-in-out ${
                            isActive ? 'z-10 opacity-100' : 'z-0 opacity-0'
                        }`}
                        style={{ backgroundColor: bgColor }}
                        aria-hidden={!isActive}
                    >
                        {/* Imagen anclada a la derecha (como el mock); panel CMS a la izquierda */}
                        <picture
                            className="absolute inset-y-0 right-0 h-full w-full"
                            style={{
                                WebkitMaskImage:
                                    'linear-gradient(90deg, transparent 0%, #000 14%, #000 100%)',
                                maskImage:
                                    'linear-gradient(90deg, transparent 0%, #000 14%, #000 100%)',
                            }}
                        >
                            {banner.mobile_url ? (
                                <source media="(max-width: 768px)" srcSet={banner.mobile_url} />
                            ) : null}
                            <img
                                src={banner.image_url}
                                alt={banner.alt_text || banner.title || 'Banner'}
                                className="h-full w-full object-cover object-center"
                            />
                        </picture>

                        {/* Móvil: fundido superior para legibilidad del texto */}
                        <div
                            className="pointer-events-none absolute inset-0 md:hidden"
                            style={{
                                background: `linear-gradient(180deg, ${bgColor}f2 0%, ${bgColor}b3 42%, ${bgColor}40 72%, transparent 100%)`,
                            }}
                        />

                        <div className="absolute inset-0 z-20 flex items-center">
                            <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-10 xl:px-14">
                                <div
                                    className={`max-w-xl transition-all duration-700 md:max-w-2xl ${
                                        isActive
                                            ? 'translate-y-0 opacity-100'
                                            : 'translate-y-8 opacity-0'
                                    }`}
                                >
                                    {(banner.headline || banner.title) && (
                                        <h1 className="mb-4 text-4xl font-bold uppercase leading-[1.05] tracking-tight sm:text-5xl md:mb-5 md:text-6xl lg:text-7xl">
                                            <Headline text={String(banner.headline || banner.title)} />
                                        </h1>
                                    )}

                                    {banner.subheadline ? (
                                        <p className="mb-7 max-w-md text-base font-normal leading-relaxed text-white/95 md:mb-8 md:text-lg">
                                            {banner.subheadline}
                                        </p>
                                    ) : null}

                                    {banner.cta?.text ? (
                                        <Link
                                            href={banner.cta.url || '#'}
                                            target={banner.cta.new_tab ? '_blank' : '_self'}
                                            className="inline-flex items-center gap-2 rounded-md px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-white transition hover:brightness-110 md:px-8 md:text-base"
                                            style={{ backgroundColor: ACCENT_RED }}
                                        >
                                            {banner.cta.text}
                                            <ChevronRight className="h-5 w-5" strokeWidth={2.5} />
                                        </Link>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}

            {banners.length > 1 ? (
                <>
                    <button
                        type="button"
                        onClick={prevSlide}
                        aria-label="Anterior"
                        className="absolute left-3 top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white transition hover:bg-black/50 md:left-6 md:h-12 md:w-12"
                    >
                        <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                        type="button"
                        onClick={nextSlide}
                        aria-label="Siguiente"
                        className="absolute right-3 top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-slate-800 shadow-md transition hover:bg-slate-100 md:right-6 md:h-12 md:w-12"
                    >
                        <ChevronRight className="h-6 w-6" />
                    </button>

                    <div className="absolute bottom-6 left-0 right-0 z-30 flex justify-center gap-2.5">
                        {banners.map((_, idx) => (
                            <button
                                key={idx}
                                type="button"
                                aria-label={`Ir al slide ${idx + 1}`}
                                onClick={() => setCurrent(idx)}
                                className={`h-2.5 rounded-full transition-all ${
                                    idx === current ? 'w-2.5' : 'w-2.5 bg-white/80 hover:bg-white'
                                }`}
                                style={
                                    idx === current
                                        ? { backgroundColor: ACCENT_RED }
                                        : undefined
                                }
                            />
                        ))}
                    </div>
                </>
            ) : null}
        </div>
    );
}
