'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, X, ChevronDown } from 'lucide-react';
import ProductCard, { type Product } from '@/components/shop/product/ProductCard';
import api from '@/lib/axios';
import { toSentenceCase } from '@/lib/categoryUrls';

interface SearchPanelProps {
    isOpen: boolean;
    onClose: () => void;
    /** Abre el buscador (focus / interacción en el input del header). */
    onOpen?: () => void;
}

type ShopCategory = {
    id: number | string;
    name: string;
    slug: string;
};

const overlayEase = [0.22, 0.94, 0.36, 1] as const;
const SEARCH_PREVIEW_LIMIT = 9;
const ACCENT_RED = '#E30613';

export default function SearchPanel({ isOpen, onClose, onOpen }: SearchPanelProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<Product[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [categories, setCategories] = useState<ShopCategory[]>([]);
    const [selectedCategorySlug, setSelectedCategorySlug] = useState('');
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);

    const largeInputRef = useRef<HTMLInputElement>(null);
    const searchPanelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let cancelled = false;
        const loadCategories = async () => {
            try {
                const res = await api.get('/shop/categories');
                const raw = res.data?.data || res.data || [];
                if (!Array.isArray(raw) || cancelled) return;
                const mapped = raw
                    .map((item: { id?: number | string; name?: string; slug?: string }) => ({
                        id: item.id ?? item.slug ?? '',
                        name: String(item.name ?? '').trim(),
                        slug: String(item.slug ?? '').trim(),
                    }))
                    .filter((c: ShopCategory) => c.name && c.slug);
                setCategories(mapped);
            } catch (error) {
                console.error('Error cargando categorías del buscador:', error);
            }
        };
        void loadCategories();
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (isOpen && largeInputRef.current) {
            setTimeout(() => largeInputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isOpen && searchPanelRef.current && !searchPanelRef.current.contains(event.target as Node)) {
                onClose();
                setSearchTerm('');
                setIsCategoryOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose]);

    useEffect(() => {
        const fetchResults = async () => {
            const q = searchTerm.trim();
            if (q.length < 2) {
                setSearchResults([]);
                return;
            }

            setIsSearching(true);
            try {
                const params: Record<string, string> = { search: q };
                if (selectedCategorySlug) {
                    params.category = selectedCategorySlug;
                }

                const res = await api.get('/shop/store/products', { params });
                const itemsArray = res.data?.data || res.data || [];

                if (!Array.isArray(itemsArray)) {
                    console.error('Error: La API no devolvió un array válido.', itemsArray);
                    setSearchResults([]);
                    return;
                }

                const mappedData = itemsArray.map((raw): Product => {
                    const item = raw as Product & {
                        brand_name?: string | null;
                        category_name?: string | null;
                        is_featured?: boolean;
                    };
                    return {
                        ...item,
                        brand: item.brand_name ?? item.brand ?? 'Castella',
                        description: item.category_name ?? '',
                        is_new: Boolean(item.is_featured),
                    };
                });

                setSearchResults(mappedData);
            } catch (error) {
                console.error('Error buscando productos:', error);
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        };

        const timeoutId = setTimeout(fetchResults, 500);
        return () => clearTimeout(timeoutId);
    }, [searchTerm, selectedCategorySlug]);

    const handleClose = () => {
        onClose();
        setSearchTerm('');
        setIsCategoryOpen(false);
    };

    const selectedCategoryName = (() => {
        const name = categories.find((c) => c.slug === selectedCategorySlug)?.name;
        return name ? toSentenceCase(name) : 'Todas las categorías';
    })();

    const moreResultsHref = (() => {
        const params = new URLSearchParams();
        params.set('search', searchTerm.trim());
        if (selectedCategorySlug) params.set('category', selectedCategorySlug);
        return `/product?${params.toString()}`;
    })();

    const showDropdown = isOpen && (searchTerm.trim().length > 0 || isSearching);

    return (
        <>
            <div
                className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ${
                    isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                }`}
                onClick={handleClose}
                aria-hidden={!isOpen}
            />

            <div ref={searchPanelRef} className="relative z-50 w-full min-w-0 max-w-full font-helvetica">
                {/*
                  Desktop (md+): una sola fila [input | categorías | X | rojo].
                  Móvil: fila 1 [input | X | rojo] + fila 2 categorías a ancho completo
                  (evita overflow &lt;400px por placeholder + shrink-0).
                */}
                <div className="relative min-w-0">
                    <div
                        className={`flex min-w-0 flex-col overflow-hidden rounded-md border bg-white transition-shadow md:flex-row md:items-stretch ${
                            isOpen
                                ? 'border-slate-300 shadow-md'
                                : 'border-slate-200 hover:border-slate-300'
                        }`}
                    >
                        <div className="flex min-w-0 w-full items-stretch md:contents">
                            {/* w-0 + flex-1: el placeholder no fuerza min-width */}
                            <input
                                ref={largeInputRef}
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onFocus={() => onOpen?.()}
                                onClick={() => onOpen?.()}
                                placeholder="¿Qué buscas?"
                                className="order-1 min-w-0 w-0 flex-1 bg-transparent px-2.5 py-2.5 text-base text-slate-900 outline-none placeholder:text-slate-400 sm:px-4 md:rounded-l-md"
                                aria-label="Buscar productos"
                            />

                            {isOpen || searchTerm ? (
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    aria-label="Cerrar búsqueda"
                                    className="order-2 flex shrink-0 items-center justify-center px-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 sm:px-2.5 md:order-3"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            ) : null}

                            <button
                                type="button"
                                aria-label="Buscar"
                                onClick={() => {
                                    onOpen?.();
                                    largeInputRef.current?.focus();
                                }}
                                className="order-2 flex shrink-0 items-center justify-center px-2.5 transition hover:brightness-95 sm:px-4 md:order-4 md:rounded-r-md"
                                style={{ backgroundColor: ACCENT_RED }}
                            >
                                <Search className="h-5 w-5 text-white" strokeWidth={2.25} />
                            </button>
                        </div>

                        <div className="order-3 min-w-0 w-full border-t border-slate-200 md:order-2 md:w-auto md:max-w-[14rem] md:shrink md:border-l md:border-t-0 lg:max-w-[16rem]">
                            <button
                                type="button"
                                aria-haspopup="listbox"
                                aria-expanded={isCategoryOpen}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onOpen?.();
                                    setIsCategoryOpen((o) => !o);
                                }}
                                className="flex h-full w-full min-w-0 items-center gap-1.5 px-2.5 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50 sm:px-3 sm:text-base md:py-0 md:px-3.5"
                            >
                                <span className="min-w-0 flex-1 truncate">{selectedCategoryName}</span>
                                <ChevronDown
                                    className={`h-4 w-4 shrink-0 text-slate-500 transition ${
                                        isCategoryOpen ? 'rotate-180' : ''
                                    }`}
                                />
                            </button>
                        </div>
                    </div>

                    {isCategoryOpen ? (
                        <ul
                            role="listbox"
                            className="absolute right-0 top-full z-[80] mt-1 max-h-72 w-[min(100%,16rem)] overflow-y-auto rounded-md border border-slate-200 bg-white py-1 shadow-lg [scrollbar-width:thin]"
                        >
                            <li role="option" aria-selected={!selectedCategorySlug}>
                                <button
                                    type="button"
                                    className={`w-full px-3 py-2.5 text-left text-base transition hover:bg-slate-50 ${
                                        !selectedCategorySlug ? 'font-semibold text-slate-900' : 'text-slate-700'
                                    }`}
                                    onClick={() => {
                                        setSelectedCategorySlug('');
                                        setIsCategoryOpen(false);
                                        onOpen?.();
                                    }}
                                >
                                    Todas las categorías
                                </button>
                            </li>
                            {categories.map((cat) => (
                                <li
                                    key={String(cat.id)}
                                    role="option"
                                    aria-selected={selectedCategorySlug === cat.slug}
                                >
                                    <button
                                        type="button"
                                        className={`w-full px-3 py-2.5 text-left text-base transition hover:bg-slate-50 ${
                                            selectedCategorySlug === cat.slug
                                                ? 'font-semibold text-slate-900'
                                                : 'text-slate-700'
                                        }`}
                                        onClick={() => {
                                            setSelectedCategorySlug(cat.slug);
                                            setIsCategoryOpen(false);
                                            onOpen?.();
                                        }}
                                    >
                                        {toSentenceCase(cat.name)}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : null}
                </div>

                <AnimatePresence>
                    {showDropdown ? (
                        <motion.div
                            key="search-dropdown"
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.2, ease: overlayEase }}
                            className="absolute top-full left-0 z-50 mt-1 w-full overflow-hidden rounded-b-xl border border-gray-100 bg-white shadow-2xl"
                        >
                            <div className="max-h-[min(70vh,32rem)] overflow-x-hidden overflow-y-auto [scrollbar-width:thin]">
                                <AnimatePresence mode="popLayout" initial={false}>
                                    {isSearching ? (
                                        <motion.div
                                            key="search-loading"
                                            className="flex flex-col items-center justify-center space-y-3 py-12"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0, transition: { duration: 0.15 } }}
                                        >
                                            <span className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-black" />
                                            <p className="text-sm font-medium text-gray-500">
                                                Buscando productos...
                                            </p>
                                        </motion.div>
                                    ) : searchResults.length > 0 ? (
                                        <motion.div
                                            key={`results-${searchTerm}-${selectedCategorySlug}`}
                                            className="px-4 py-4 sm:px-5"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0, transition: { duration: 0.15 } }}
                                        >
                                            <h3 className="mb-4 border-b pb-2 text-xs font-bold uppercase tracking-widest text-gray-500">
                                                Resultados para &quot;{searchTerm}&quot;
                                                {selectedCategorySlug
                                                    ? ` en ${selectedCategoryName}`
                                                    : ''}
                                            </h3>
                                            <div className="grid grid-cols-2 items-start gap-4 pb-2 sm:grid-cols-3">
                                                {searchResults.slice(0, SEARCH_PREVIEW_LIMIT).map((product, idx) => (
                                                    <motion.div
                                                        key={product.id}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{
                                                            delay: 0.02 + idx * 0.03,
                                                            duration: 0.25,
                                                        }}
                                                        className="min-w-0 max-w-full"
                                                        onClick={handleClose}
                                                    >
                                                        <ProductCard product={product} />
                                                    </motion.div>
                                                ))}
                                            </div>
                                            {searchResults.length >= SEARCH_PREVIEW_LIMIT ? (
                                                <div className="mt-4 border-t border-gray-100 pt-4">
                                                    <Link
                                                        href={moreResultsHref}
                                                        onClick={handleClose}
                                                        className="flex w-full items-center justify-center rounded-md bg-black px-4 py-3 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-zinc-800"
                                                    >
                                                        Ver más resultados
                                                    </Link>
                                                </div>
                                            ) : null}
                                        </motion.div>
                                    ) : searchTerm.length >= 2 ? (
                                        <motion.div
                                            key="search-empty"
                                            className="flex flex-col items-center justify-center px-6 py-12 text-center"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                        >
                                            <div className="mb-4 rounded-full bg-zinc-100 p-4 ring-1 ring-zinc-200/80">
                                                <Search className="mx-auto h-10 w-10 text-zinc-300" />
                                            </div>
                                            <p className="text-base font-bold text-gray-800">
                                                No encontramos resultados
                                            </p>
                                            <p className="mt-1 max-w-sm text-sm text-gray-500">
                                                Intenta buscar por marca o cambia la categoría.
                                            </p>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="search-hint"
                                            className="px-5 py-6 text-sm text-gray-500"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                        >
                                            Escribe al menos 2 caracteres para buscar productos.
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    ) : null}
                </AnimatePresence>
            </div>
        </>
    );
}
