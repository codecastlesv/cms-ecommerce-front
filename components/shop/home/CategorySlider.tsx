"use client";

import Link from "next/link";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import type { Swiper as SwiperType } from "swiper";
import { motion, useReducedMotion } from 'framer-motion';
import { resolveShopProductImageSrc } from "@/lib/shopProductImage";

import "swiper/css";
import "swiper/css/navigation";

interface Category {
  id: number;
  name: string;
  slug: string;
  image_url: string | null | undefined;
}

export default function CategoriesSlider({ categories }: { categories: Category[] }) {
  const [swiperInstance, setSwiperInstance] = useState<SwiperType | null>(null);
  const shouldReduceMotion = useReducedMotion();

  // Renderizado de la tarjeta individual para evitar repetición de código
  const CategoryCard = ({ cat, delay = 0 }: { cat: Category; delay?: number }) => (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 14, scale: 0.975 }}
      whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
      viewport={shouldReduceMotion ? undefined : { once: true, amount: 0.35 }}
      transition={{ duration: 0.75, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link
        href={`/${cat.slug}`}
        className="group/card flex w-full flex-col items-center outline-none transition-all duration-300 hover:-translate-y-1"
      >
        <div className="mb-3 flex h-24 w-24 items-center justify-center rounded-full transition-all duration-300 md:h-40 md:w-40 lg:h-40 lg:w-40">
          <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-white shadow-[0_8px_24px_rgba(15,23,42,0.08)] transition-all duration-300 group-hover/card:border-black group-hover/card:shadow-[0_18px_40px_rgba(0,0,0,0.16)] group-hover/card:ring-4 group-hover/card:black/10">
            <Image
              src={resolveShopProductImageSrc(cat.image_url)}
              alt={cat.name}
              width={160}
              height={160}
              unoptimized
              className="h-full w-full object-cover transition-transform duration-700 group-hover/card:scale-110"
            />
          </div>
        </div>
        <span className="font-inter font-semibold text-center text-[16px] text-black transition-all duration-300">
          {cat.name}
        </span>
      </Link>
    </motion.div>
  );

  return (
    <section className="relative border-b border-slate-50 py-8">
      <div className="container mx-auto ">
        
        {/* --- VISTA MÓVIL (Grid 3x2) --- */}
        <div className="grid grid-cols-3 gap-4 md:hidden">
          {categories.slice(0, 6).map((cat, index) => (
            <CategoryCard key={cat.id} cat={cat} delay={index * 0.12} />
          ))}
        </div>

        {/* --- VISTA TABLET/DESKTOP (Swiper) --- */}
        <div className="relative hidden md:block group/slider">
          <Swiper
            spaceBetween={20}
            slidesPerView={4}
            onSwiper={setSwiperInstance}
            breakpoints={{
              1024: { slidesPerView: 5 },
              1280: { slidesPerView: 6 },
            }}
            className="px-2"
          >
            {categories.map((cat, index) => (
              <SwiperSlide key={cat.id} className="py-4">
                <CategoryCard cat={cat} delay={index * 0.12} />
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Botones de Navegación (Solo visibles en Desktop) */}
          <button
            type="button"
            onClick={() => swiperInstance?.slidePrev()}
            className="absolute -left-4 top-1/2 z-50 -translate-y-1/2 rounded-full border border-black bg-white p-2 text-black opacity-0 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_35px_rgba(0,0,0,0.18)] group-hover/slider:opacity-100"
          >
            <ChevronLeft size={20} />
          </button>

          <button
            type="button"
            onClick={() => swiperInstance?.slideNext()}
            className="absolute -right-4 top-1/2 z-50 -translate-y-1/2 rounded-full border border-black bg-white p-2 text-black opacity-0 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_35px_rgba(0,0,0,0.18)] group-hover/slider:opacity-100"
          >
            <ChevronRight size={20} />
          </button>
        </div>

      </div>
    </section>
  );
}