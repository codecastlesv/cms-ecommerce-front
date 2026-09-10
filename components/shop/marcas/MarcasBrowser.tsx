'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search as SearchIcon, Loader2, ChevronRight, ChevronLeft } from 'lucide-react';
import api from '@/lib/axios';
import { handleShopProductImageError, resolveShopProductImageSrc } from '@/lib/shopProductImage';
import Pagination from '@/components/ui/Pagination';

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

const LETTERS = ['#', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')];
const PER_PAGE = 18;

const AVATAR_COLORS = ['#304C94', '#08204E', '#E30613', '#1D4ED8', '#0EA5E9', '#7C3AED', '#0F766E', '#B45309'];

function SubtlePager({ meta, onPageChange }: { meta: BrandsMeta; onPageChange: (page: number) => void }) {
  if (!meta || meta.last_page <= 1) return null;

  return (
    <div className="flex shrink-0 items-center gap-2">
      <button
        type="button"
        disabled={meta.current_page <= 1}
        onClick={() => onPageChange(meta.current_page - 1)}
        className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-[#304C94] hover:text-[#304C94] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-slate-500"
        aria-label="Página anterior"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
      </button>
      <span className="font-helvetica text-xs font-medium text-slate-500">
        Página <span className="font-bold text-slate-900">{meta.current_page}</span> de {meta.last_page}
      </span>
      <button
        type="button"
        disabled={meta.current_page >= meta.last_page}
        onClick={() => onPageChange(meta.current_page + 1)}
        className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-[#304C94] hover:text-[#304C94] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-slate-500"
        aria-label="Página siguiente"
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function brandInitials(name: string): string {
  const clean = name.replace(/[()]/g, '').trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export default function MarcasBrowser({
  initialBrands,
  initialMeta,
}: {
  initialBrands: Brand[];
  initialMeta: BrandsMeta;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const letter = searchParams.get('letter') || '';
  const page = Number(searchParams.get('page') || '1');
  const urlSearch = searchParams.get('search') || '';

  const [searchInput, setSearchInput] = useState(urlSearch);
  const [brands, setBrands] = useState<Brand[]>(initialBrands);
  const [meta, setMeta] = useState<BrandsMeta>(initialMeta);
  const [loading, setLoading] = useState(false);

  const isFirstRun = useRef(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateParams = (updates: Record<string, string | null>) => {
    const newParams = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) newParams.set(key, value);
      else newParams.delete(key);
    });
    if (!('page' in updates)) newParams.delete('page');

    startTransition(() => {
      router.push(`/marcas?${newParams.toString()}`, { scroll: false });
    });
  };

  // Buscador con debounce: solo actualiza la URL (y dispara el fetch) 400ms después de dejar de escribir.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (searchInput !== urlSearch) {
        updateParams({ search: searchInput || null });
      }
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  useEffect(() => {
    // La primera carga ya viene resuelta desde el servidor con estos mismos filtros (ver page.tsx).
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }

    let cancelled = false;
    setLoading(true);

    api
      .get('/shop/brands', {
        params: {
          per_page: PER_PAGE,
          page,
          search: urlSearch || undefined,
          letter: letter || undefined,
        },
      })
      .then((res) => {
        if (cancelled) return;
        setBrands(res.data?.data || []);
        setMeta(res.data?.meta);
      })
      .catch(() => {
        if (!cancelled) {
          setBrands([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [urlSearch, letter, page]);

  return (
    <section className="px-4 py-10 sm:px-6 lg:px-10 xl:px-14">
      <div className="mx-auto w-full max-w-[1440px]">
        {/* Buscador + letras + contador: fijos al hacer scroll de la grilla */}
        <div className="sticky top-(--header-height,6rem) z-30 -mx-4 bg-white px-4 pb-4 sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10 xl:-mx-14 xl:px-14">
          <div className="pt-6">
            <div className="relative max-w-md">
              <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Buscar una marca..."
                className="w-full rounded-full border border-slate-200 bg-white py-2.5 pl-10 pr-4 font-helvetica text-sm text-slate-900 outline-none placeholder:text-slate-400 focus-visible:border-[#304C94] focus-visible:ring-2 focus-visible:ring-[#304C94]/20"
              />
            </div>
          </div>

          {/* Tabs de letra */}
          <div className="mt-6 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => updateParams({ letter: null })}
              className={`rounded-full px-3.5 py-1.5 font-helvetica text-[13px] font-semibold transition ${
                letter === ''
                  ? 'bg-[#304C94] text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-[#304C94] hover:text-[#304C94]'
              }`}
            >
              Todas
            </button>
            {LETTERS.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => updateParams({ letter: l })}
                className={`h-8 min-w-8 shrink-0 rounded-md px-2.5 font-helvetica text-[13px] font-semibold transition ${
                  letter === l
                    ? 'bg-[#304C94] text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-[#304C94] hover:text-[#304C94]'
                }`}
              >
                {l}
              </button>
            ))}
          </div>

          {/* Contador de resultados + paginador sutil */}
          <div className="mt-4 flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <p className="font-helvetica text-sm text-slate-500">
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Buscando marcas...
                </span>
              ) : (
                <>
                  <span className="font-bold text-slate-900">{meta?.total ?? 0}</span> marca
                  {meta?.total === 1 ? '' : 's'}
                  {letter ? <> que empiezan con &ldquo;{letter}&rdquo;</> : null}
                  {urlSearch ? <> para &ldquo;{urlSearch}&rdquo;</> : null}
                </>
              )}
            </p>
            <SubtlePager meta={meta} onPageChange={(p) => updateParams({ page: String(p) })} />
          </div>
        </div>

        {/* Grilla */}
        <div className="mt-6">
        {!loading && brands.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center text-sm text-slate-400">
            No se encontraron marcas con ese criterio.
          </div>
        ) : (
          <>
            {/* 0-767px: lista compacta (evita cajas cuadradas grandes y repetitivas sin logos reales) */}
            <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white md:hidden">
              {brands.map((brand, index) => (
                <Link
                  key={brand.id}
                  href={`/tienda?brand=${brand.slug}`}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50"
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-helvetica text-[13px] font-bold text-white"
                    style={{ backgroundColor: AVATAR_COLORS[index % AVATAR_COLORS.length] }}
                  >
                    {brandInitials(brand.name)}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-helvetica text-[13px] font-semibold text-slate-900">
                    {brand.name}
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-300" />
                </Link>
              ))}
            </div>

            {/* >=768px: grid de logos */}
            <div className="hidden md:grid md:grid-cols-4 md:gap-4 lg:grid-cols-5 xl:grid-cols-6">
              {brands.map((brand) => (
                <Link
                  key={brand.id}
                  href={`/tienda?brand=${brand.slug}`}
                  className="group flex flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-center transition-all duration-300 hover:-translate-y-1 hover:border-[#304C94] hover:shadow-[0_12px_30px_rgba(48,76,148,0.12)]"
                >
                  <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl">
                    <img
                      src={resolveShopProductImageSrc(brand.logo_url)}
                      alt={brand.name}
                      className="h-full w-full object-contain p-2 transition-transform duration-500 group-hover:scale-110"
                      onError={handleShopProductImageError}
                    />
                  </div>
                  <p className="font-helvetica text-[13px] font-semibold leading-snug text-slate-900 line-clamp-2">
                    {brand.name}
                  </p>
                </Link>
              ))}
            </div>
          </>
        )}
        </div>

        {/* Paginación */}
        <div className="mt-8">
          <Pagination meta={{ ...meta, data: [] }} onPageChange={(p) => updateParams({ page: String(p) })} />
        </div>
      </div>
    </section>
  );
}
