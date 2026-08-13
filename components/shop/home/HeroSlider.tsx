'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

interface HeroSliderProps {
    banners: any[];
    settings?: any;
}

export default function HeroSlider({ banners, settings }: HeroSliderProps) {
    const [current, setCurrent] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const mainColor = settings?.main_color || '#000000';

    const nextSlide = useCallback(() => {
        setCurrent((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
    }, [banners.length]);

    const prevSlide = () => {
        setCurrent((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
    };

    useEffect(() => {
        if (isHovered) return;
        const interval = setInterval(() => {
            nextSlide();
        }, 5000);
        return () => clearInterval(interval);
    }, [isHovered, nextSlide]);

    if (!banners || banners.length === 0) return null;

    return (
        <div
            className="relative w-full h-[500px] md:h-[620px] bg-black overflow-hidden group font-bebas"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                background: 'radial-gradient(circle at 50% 50%, rgba(20, 20, 40, 0.8) 0%, rgba(0, 0, 0, 1) 100%)'
            }}
        >
            {banners.map((banner, index) => (
                <div
                    key={banner.id}
                    className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${index === current ? 'opacity-100 z-10' : 'opacity-0 z-0'
                        }`}
                >
                    <picture className="absolute inset-0 w-full h-full">

                        {banner.mobile_url && (
                            <source media="(max-width: 768px)" srcSet={banner.mobile_url} />
                        )}
                        <img
                            src={banner.image_url}
                            alt={banner.alt_text || banner.title}
                            className="w-full h-full object-cover"
                        />
                    </picture>

                    <div className="absolute inset-0 bg-gradient-to-br from-black/50 via-transparent to-black/70 md:bg-gradient-to-r md:from-black/60 md:via-black/30 md:to-transparent"></div>

                    {/* Efecto de luz vanguardista */}
                    <div className="absolute inset-0 opacity-30">
                        <div className="absolute top-0 left-1/4 w-96 h-96 bg-white blur-3xl rounded-full mix-blend-overlay opacity-5"></div>
                        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white blur-3xl rounded-full mix-blend-overlay opacity-5"></div>
                    </div>

                    <div className="absolute inset-0 flex items-center justify-center md:justify-start z-20">
                        <div className="container mx-auto px-4 md:px-22">
                            <div className={`max-w-2xl transition-all duration-1000 transform ${index === current ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
                                }`}>
                                {banner.subheadline && (
                                    <h3 className="text-white font-black mb-6 uppercase tracking-[0.2em] text-xs lg:text-[16px]">
                                        {banner.subheadline}
                                    </h3>
                                )}

                                <div className="relative mb-4">
                                    <h1 
                                        className="text-5xl md:text-7xl lg:text-8xl font-black text-white leading-[0.95] drop-shadow-2xl uppercase relative z-10 tracking-tight transition-all duration-700 peer-hover:translate-x-2 transform will-change-transform"
                                        style={{
                                            textShadow: `
                                                0 2px 8px rgba(0, 0, 0, 0.9),
                                                0 0 20px rgba(0, 0, 0, 0.5)
                                            `,
                                            letterSpacing: '0.02em'
                                        }}
                                    >
                                        {banner.headline || banner.title}
                                    </h1>
                                </div>

                                {banner.cta?.text && (
                                    <Link
                                        href={banner.cta.url || '#'}
                                        target={banner.cta.new_tab ? '_blank' : '_self'}
                                        className="peer group/cta inline-flex items-center gap-3 px-10 py-4 rounded-full font-black text-base uppercase tracking-[0.14em] transition-all duration-500 transform relative mt-1 border border-white/70 overflow-hidden backdrop-blur-xl hover:scale-[1.04]"
                                        style={{
                                            background: `linear-gradient(135deg, rgba(255, 255, 255, 0.96) 0%, rgba(255, 255, 255, 0.78) 58%, ${mainColor}22 100%)`,
                                            boxShadow: `0 14px 38px rgba(0, 0, 0, 0.38), 0 0 0 1px rgba(255, 255, 255, 0.2) inset`,
                                            transition: 'all 0.5s'
                                        }}
                                    >
                                        <div className="absolute inset-0 opacity-0 group-hover/cta:opacity-100 transition-opacity duration-500" style={{
                                            background: `linear-gradient(120deg, transparent 0%, ${mainColor}2b 45%, transparent 100%)`
                                        }}></div>

                                        <span className="relative z-10 text-black flex items-center">
                                            {banner.cta.text}
                                            <span className="ml-3 inline-flex items-center justify-center w-8 h-8 rounded-full bg-black text-white transition-all duration-500 group-hover/cta:bg-white group-hover/cta:text-black group-hover/cta:translate-x-1">
                                                <ArrowRight className="w-4 h-4 transition-all duration-500 group-hover/cta:translate-x-0.5 group-hover/cta:scale-110" />
                                            </span>
                                        </span>
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ))}

            {banners.length > 1 && (
                <>
                    <style>{`
                        @keyframes shimmer {
                            0% { transform: translateX(-100%); }
                            100% { transform: translateX(100%); }
                        }
                    `}</style>

                    <button
                        onClick={prevSlide}
                        className="absolute left-6 top-1/2 -translate-y-1/2 z-30 text-white p-3 rounded-full transition-all duration-500 opacity-0 group-hover:opacity-100 hover:scale-125 border border-white/40 backdrop-blur-xl group/btn"
                        style={{
                            background: `linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)`,
                            boxShadow: `0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.2)`
                        }}
                    >
                        <ChevronLeft className="w-7 h-7 transition-transform duration-300 group-hover/btn:-translate-x-1" />
                    </button>

                    <button
                        onClick={nextSlide}
                        className="absolute right-6 top-1/2 -translate-y-1/2 z-30 text-white p-3 rounded-full transition-all duration-500 opacity-0 group-hover:opacity-100 hover:scale-125 border border-white/40 backdrop-blur-xl group/btn"
                        style={{
                            background: `linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)`,
                            boxShadow: `0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.2)`
                        }}
                    >
                        <ChevronRight className="w-7 h-7 transition-transform duration-300 group-hover/btn:translate-x-1" />
                    </button>

                    <div className="absolute bottom-8 left-0 right-0 z-30 flex justify-center space-x-4">
                        {banners.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrent(idx)}
                                className={`h-1.5 rounded-full transition-all duration-500 backdrop-blur-md ${idx === current ? 'w-10 bg-white shadow-lg' : 'w-2 bg-white/40 hover:bg-white/70 hover:w-3'
                                    }`}
                                style={{
                                    boxShadow: idx === current ? `0 0 20px rgba(255, 255, 255, 0.6)` : 'none'
                                }}
                            />
                        ))}
                    </div>
                </>
            )}

            
        </div>

        
    );
}