'use client';

import { useState, useEffect, useRef, MouseEvent, useMemo } from 'react';
import {
  handleShopProductImageError,
  resolveShopProductImageSrc,
  SHOP_PRODUCT_IMAGE_PLACEHOLDER,
} from '@/lib/shopProductImage';

export default function ProductGallery({ images, name }: { images: any[]; name: string }) {
  const getUrl = (img: unknown) => resolveShopProductImageSrc(
    typeof img === 'string' ? img : (img as { url?: string } | null)?.url,
  );

  const galleryImages = useMemo(() => {
    if (!images?.length) {
      return [SHOP_PRODUCT_IMAGE_PLACEHOLDER];
    }

    return images;
  }, [images]);

  const [mainSrc, setMainSrc] = useState(() => getUrl(galleryImages?.[0]));
  const [thumbActive, setThumbActive] = useState(() => getUrl(galleryImages?.[0]));
  const [fadeIn, setFadeIn] = useState(true);
  const mainRef = useRef(mainSrc);
  const fadeMs = 480;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  mainRef.current = mainSrc;

  const crossfadeTo = (url: string) => {
    const resolvedUrl = resolveShopProductImageSrc(url);
    setThumbActive(resolvedUrl);
    if (resolvedUrl === mainRef.current) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setFadeIn(false);
    timeoutRef.current = setTimeout(() => {
      setMainSrc(resolvedUrl);
      mainRef.current = resolvedUrl;
      requestAnimationFrame(() => setFadeIn(true));
    }, Math.round(fadeMs * 0.32));
  };

  useEffect(() => {
    if (!galleryImages?.length) return;
    const next = getUrl(galleryImages[0]);
    if (next === mainRef.current) {
      setThumbActive(next);
      return;
    }
    setThumbActive(next);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setFadeIn(false);
    timeoutRef.current = setTimeout(() => {
      setMainSrc(next);
      mainRef.current = next;
      requestAnimationFrame(() => setFadeIn(true));
    }, Math.round(fadeMs * 0.32));
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [galleryImages]);

  const [origen, setOrigen] = useState('center');

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setOrigen(`${x}% ${y}%`);
  };

  return (
    <div className="lg:col-span-8 flex flex-col md:flex-row md:items-start md:gap-x-6">
      <div className="order-2 md:order-1 flex w-full overflow-x-auto md:w-20 md:max-w-20 md:flex-col md:overflow-y-auto md:overflow-x-hidden no-scrollbar md:self-stretch">
        {galleryImages.map((img, index) => {
          const url = getUrl(img);
          const isActive = thumbActive === url;
          return (
            <div
              key={`${url}-${index}`}
              onMouseEnter={() => crossfadeTo(url)}
              className={`aspect-square w-16 shrink-0 cursor-pointer overflow-hidden rounded-sm border-2 bg-white transition-all duration-300 ease-out md:w-full ${
                isActive ? 'border-black opacity-100' : 'border-transparent opacity-70 hover:opacity-100 hover:border-slate-300'
              }`}
            >
              <img
                src={url}
                alt={`${name}-${index}`}
                className="h-full w-full object-contain object-center"
                onError={handleShopProductImageError}
              />
            </div>
          );
        })}
      </div>

      <div
        className="order-1 md:order-2 relative flex-1 aspect-square cursor-zoom-in overflow-hidden rounded-sm bg-white group"
        onMouseMove={handleMouseMove}
      >
        <img
          src={resolveShopProductImageSrc(mainSrc)}
          alt={name}
          style={{
            transformOrigin: origen,
            transition: `opacity ${fadeMs}ms cubic-bezier(0.4, 0, 0.2, 1), transform 160ms ease-out`,
          }}
          className={`h-full w-full object-contain object-center group-hover:scale-[2] ${
            fadeIn ? 'opacity-100' : 'opacity-0'
          }`}
          onError={handleShopProductImageError}
        />
      </div>
    </div>
  );
}
