/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { FaWhatsapp } from 'react-icons/fa'; // Solo usado en la sección "Uniformes" (comentada)
import { motion, useReducedMotion } from 'framer-motion';

import HeroSlider from '@/components/shop/home/HeroSlider';
import TrustBadges from '@/components/shop/home/TrustBadges';
import BenefitsStrip from '@/components/shop/home/BenefitsStrip';
import FeaturedByCategory from '@/components/shop/home/FeaturedByCategory';
import BrandSection from '@/components/shop/home/BrandSection';
import FadeReveal from '@/components/shop/animations/FadeReveal';
import NewsletterSignupForm from '@/components/shop/home/NewsletterSignupForm'; // Solo usado en "Promociones y Lanzamientos" (comentada)

const ProductSlider = dynamic(() => import('@/components/shop/home/ProductSlider'), {
  loading: () => <div className="min-h-105 rounded-xl bg-slate-50 animate-pulse" />,
});

const CategoriesSlider = dynamic(() => import('@/components/shop/home/CategorySlider'), {
  loading: () => <div className="min-h-55 rounded-xl bg-slate-50 animate-pulse" />,
});

interface HomePageContentProps {
  heroItems: any[];
  categories: any[];
  products: any;
  brands: any[];
  featuredMain: any[];
  featuredSecondary: any[];
  featuredByCategory: any[];
}

export default function HomePageContent({
  heroItems,
  categories,
  products,
  brands,
  featuredMain,
  featuredSecondary,
  featuredByCategory,
}: HomePageContentProps) {
  const [pageReady, setPageReady] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const [sectionsReady, setSectionsReady] = useState<Record<string, boolean>>({
    hero: false,
    categories: false,
    products: false,
    brands: false,
    featured: false,
  });

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setPageReady(true);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSectionsReady((prev) => ({ ...prev, hero: true }));
    }, 150);
    return () => clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSectionsReady((prev) => ({ ...prev, categories: true }));
    }, 150);
    return () => clearTimeout(timeoutId);
  }, [categories]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSectionsReady((prev) => ({ ...prev, products: true }));
    }, 150);
    return () => clearTimeout(timeoutId);
  }, [products]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSectionsReady((prev) => ({ ...prev, brands: true }));
    }, 150);
    return () => clearTimeout(timeoutId);
  }, [brands]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSectionsReady((prev) => ({ ...prev, featured: true }));
    }, 150);
    return () => clearTimeout(timeoutId);
  }, [featuredMain, featuredSecondary]);

  return (
    <motion.div
      className="min-h-screen space-y-10 bg-gradient-to-b from-white via-slate-50/40 to-white text-black"
      initial={shouldReduceMotion ? false : { opacity: 0, y: 10, scale: 0.996 }}
      animate={shouldReduceMotion ? undefined : { opacity: pageReady ? 1 : 0, y: pageReady ? 0 : 10, scale: pageReady ? 1 : 0.996 }}
      transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* HERO SLIDER */}
      <FadeReveal mount className="relative mb-0" duration={0.85} y={10} scale={0.996}>
        {heroItems.length > 0 ? (
          <HeroSlider banners={heroItems} settings={{ autoplay: true, loop: true }} />
        ) : (
          <div className="h-[60vh] bg-slate-50 flex items-center justify-center italic text-slate-300">
            Castella Sagarra
          </div>
        )}
      </FadeReveal>

      {/* FRANJA DE BENEFICIOS (envíos, retiro en tienda, cuotas, garantía) */}
      <FadeReveal className="mb-0" delay={0.06} duration={0.85} y={10} scale={0.996}>
        <TrustBadges />
      </FadeReveal>

      {/* CONTENEDOR */}
      <div className="px-4  sm:px-12   space-y-4 bg-foreground mb-0">
        {/* CATEGORIAS */}
          <FadeReveal className="border-b border-gray-100 pb-3" delay={0.08} duration={0.9} y={14} scale={0.994}>
          <div className="relative">
            <div
              className={`transition-[opacity,transform] duration-300 ease-out ${
                !sectionsReady.categories ? 'opacity-100 translate-y-0' : 'pointer-events-none opacity-0 -translate-y-1'
              }`}
            >
              <div className="max-w-7xl mx-auto space-y-2 animate-pulse">
                <div className="h-8 w-56 bg-gray-200 rounded" />
              </div>
            </div>
            <div
              className={`transition-[opacity,transform] duration-300 ease-out ${
                !sectionsReady.categories ? 'pointer-events-none opacity-0 translate-y-1' : 'opacity-100 translate-y-0'
              }`}
            >
              <div className="max-w-[1440px] mx-auto">
                <h2 className="font-inter text-[22px] font-bold text-black mb-4">
                  Compra por categorías
                </h2>
              </div>
              <div className="md:grid-cols-3 lg:grid-cols-5 gap-8">
                <CategoriesSlider categories={categories} />
              </div>
            </div>
          </div>
        </FadeReveal>

        {/* DESTACADOS POR CATEGORÍA (3 CARDS) */}
        {featuredByCategory.length > 0 && (
          <FadeReveal className="py-1 overflow-hidden" delay={0.1} duration={0.9} y={12} scale={0.994}>
            <FeaturedByCategory items={featuredByCategory} />
          </FadeReveal>
        )}

        {/* PRODUCTOS */}
        <FadeReveal className="py-4 overflow-hidden" delay={0.12} duration={0.9} y={12} scale={0.994}>
          <div className="container mx-auto px-0 md:px-4">
            <ProductSlider products={products} />
          </div>
        </FadeReveal>

        {/* MARCAS */}
        <FadeReveal className="py-1 overflow-hidden" delay={0.14} duration={0.9} y={12} scale={0.994}>
          <div className="container mx-auto px-0 md:px-4">
            <BrandSection brands={brands} />
          </div>
        </FadeReveal>

        {/* FEATURED MAIN BANNER*/}
        {featuredMain.length > 0 && (
        <FadeReveal className="bg-white py-1 overflow-hidden" delay={0.16} duration={0.95} y={12} scale={0.995}>
          <div className="container mx-auto px-4">
            {featuredMain.map((ftm, index) => (
              <FadeReveal key={ftm.id} delay={0.08 + index * 0.14} duration={0.95} y={8} scale={0.997} className="group relative mb-1 overflow-hidden rounded-[1.4rem] border-2 border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-1 hover:border-black hover:border-2 hover:shadow-[0_28px_60px_rgba(6,182,212,0.12)]">
                <div className="relative aspect-21/9 w-full overflow-hidden bg-gray-100 md:aspect-3/1">
                  <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/25 via-transparent to-cyan-400/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <img
                    src={ftm.image_url}
                    alt={ftm.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                </div>
                <div className="p-4 md:p-6">
                  <h2 className="font-bebas  font-normal text-[20px] leading-[23px] tracking-[1px] uppercase transition-colors duration-300 group-hover:text-black">
                    {ftm.title}
                  </h2>
                  <p className="font-inter text-black font-normal text-[14px] leading-[26px] tracking-[0.18px]transition-colors duration-300 group-hover:text-slate-700">{ftm.headline}</p>
                </div>
              </FadeReveal>
            ))}
          </div>
        </FadeReveal>
        )}

        {/* FEATURED SECONDARY BANNERS (4 CARDS) */}
        {featuredSecondary.length > 0 && (
        <FadeReveal className="bg-white py-1 overflow-hidden mb-40" delay={0.18} duration={0.95} y={12} scale={0.995}>
          <div className="container mx-auto px-4">
            <div className="mx-auto flex flex-wrap justify-between gap-2 md:gap-4">
              {featuredSecondary.map((fts, index) => (
                <FadeReveal
                  key={fts.id}
                  delay={0.1 + index * 0.13}
                  duration={0.9}
                  y={10}
                  scale={0.997}
                  className="group flex w-[calc(50%-0.5rem)] min-w-35 max-w-100 flex-col overflow-hidden rounded-[1.4rem] border-2 border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-1 hover:border-black hover:border-2 hover:shadow-[0_24px_50px_rgba(6,182,212,0.12)] md:w-[calc(25%-0.75rem)]"
                >
                  <div className="relative aspect-square w-full overflow-hidden bg-gray-100">
                    <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/18 via-transparent to-cyan-400/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <img
                      src={fts.image_url}
                      alt={fts.title}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  </div>
                  <div className="p-3 md:p-4">
                    <h3 className="line-clamp-1 font-bebas font-normal text-[16px] leading-5 tracking-[1px] uppercase transition-colors duration-300 ">
                      {fts.title}
                    </h3>
                    <p className="font-inter text-black font-normal text-[12px] leading-[18px] tracking-[0.18px] transition-colors duration-300 group-hover:text-slate-700">
                      {fts.headline}
                    </p>
                  </div>
                </FadeReveal>
              ))}
            </div>
          </div>
        </FadeReveal>
        )}
      </div>

      {/* CONTACT SECTION - UNIFORMES PARA EQUIPOS Y EMPRESAS */}
    <div className="w-full overflow-hidden">
      
      {/* --- SECCIÓN 1: CONTACTO (UNIFORMES) - DESACTIVADA temporalmente, no borrar --- */}
      {false && (
      <FadeReveal
        className="px-6 py-10 bg-[#F3F3F3] bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/bannerfooter.png')" }}
        delay={0.18}
        duration={0.95}
        y={12}
        scale={0.995}
      >
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-8 md:flex-row">

          {/* Columna Izquierda: Imagen con altura controlada */}
          <div className="w-full md:w-1/2 flex justify-center lg:justify-start">

          </div>

          {/* Columna Derecha: Texto y Botones */}
          <div className="flex w-full flex-col space-y-4 text-left text-black md:w-1/2">
            <div className="space-y-1">
                <h2 className="font-bebas leading-[1] lg:leading-[48px] tracking-[3px]  text-center lg:text-left text-[32px] md:text-[38px] lg:text-[48px]">
                  Uniformes para equipos <br /> y empresas
                </h2>
                <p className="font-bebas leading-[1] tracking-[1.5px]  text-center lg:text-left text-[18px] md:text-[22px]">
                  Diseño y personalización
                </p>
            </div>

            <div className="flex flex-wrap justify-center gap-3 pt-1 lg:justify-start">
              {/* Botón Cotización */}
              <button className="h-12 w-full sm:w-56 rounded-lg bg-black text-white font-inter font-semibold leading-[48px] tracking-[0.18px]  text-[13px] lg:text-[14px] text-center transition-all hover:-translate-y-1 hover:shadow-xl active:scale-95">
                Solicitar cotización
              </button>

              {/* Botón WhatsApp */}
              <button className="flex h-12 w-full sm:w-56 items-center justify-center gap-3 rounded-lg bg-[#25D366] text-white font-inter font-semibold leading-[48px] tracking-[0.18px]  text-[13px] lg:text-[14px] text-center transition-all hover:-translate-y-1 hover:shadow-xl active:scale-95">
                <FaWhatsapp size={20} /> WhatsApp
              </button>
            </div>
          </div>
        </div>
      </FadeReveal>
      )}

      {/* --- SECCIÓN 2: PROMOCIONES Y LANZAMIENTOS - DESACTIVADA temporalmente, no borrar --- */}
      {false && (
      <>
      <FadeReveal className="bg-black px-7 py-10 text-white sm:px-6 sm:py-12 md:hidden" delay={0.2} duration={0.9} y={12} scale={0.995}>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-bebas font-normal uppercase tracking-[2px] text-[28px] sm:text-[36px] mb-3">
            Promociones y <br /> Lanzamientos
          </h2>

          <p className="font-inter text-[13px] sm:text-[14px] text-white/70 leading-6 max-w-[28rem] mx-auto mb-6">
            Entérate primero de los lanzamientos, descuentos y novedades de Galaxia Deportes.
          </p>
          <NewsletterSignupForm variant="mobile" />
        </div>
      </FadeReveal>

      {/* Desktop */}
      <FadeReveal className="hidden md:block bg-black md:px-47 py-12 text-white" delay={0.2} duration={0.9} y={12} scale={0.995}>
        <div className="mx-auto flex max-w-7xl flex-col md:flex-row items-center gap-10">
          <div className="md:w-1/3">
            <h2 className="font-bebas font-normal leading-[1] tracking-[2px] uppercase text-[36px] md:text-[44px]">
              Promociones y <br /> Lanzamientos
            </h2>
          </div>

          <div className="md:w-1/3">
            <p className="font-inter font-normal leading-[28px] tracking-[0.18px] text-zinc-400 text-[14px] lg:text-[15px] max-w-xs">
              Entérate primero de los lanzamientos, descuentos y novedades de Galaxia Deportes.
            </p>
          </div>

          <NewsletterSignupForm variant="desktop" />
        </div>
      </FadeReveal>
      </>
      )}

      {/* --- SECCIÓN 3: BENEFICIOS --- */}
      <FadeReveal delay={0.22} duration={0.9} y={12} scale={0.996}>
        <BenefitsStrip />
      </FadeReveal>
    </div>

    </motion.div>
  );
}
