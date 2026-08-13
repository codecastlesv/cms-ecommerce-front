'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, X } from 'lucide-react';
import ProductCard, { type Product } from '@/components/shop/product/ProductCard';
import api from '@/lib/axios';

interface SearchPanelProps {
    isOpen: boolean;
    onClose: () => void;
    /** Abre el buscador (focus / interacción en el input del header). */
    onOpen?: () => void;
}

const overlayEase = [0.22, 0.94, 0.36, 1] as const;
const SEARCH_PREVIEW_LIMIT = 9;

export default function SearchPanel({ isOpen, onClose, onOpen }: SearchPanelProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<Product[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const largeInputRef = useRef<HTMLInputElement>(null);
    const searchPanelRef = useRef<HTMLDivElement>(null);

    // Foco automático en el input al abrir
    useEffect(() => {
        if (isOpen && largeInputRef.current) {
            setTimeout(() => largeInputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // Cerrar al hacer clic fuera del contenedor (input + dropdown)
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isOpen && searchPanelRef.current && !searchPanelRef.current.contains(event.target as Node)) {
                onClose();
                setSearchTerm('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose]);

    // Debounce y Petición a la API (CON VALIDACIONES DE SEGURIDAD)
    useEffect(() => {
        const fetchResults = async () => {
            const q = searchTerm.trim();
            if (q.length < 2) {
                setSearchResults([]);
                return;
            }

            setIsSearching(true);
            try {
                const res = await api.get('/shop/store/products', { params: { search: q } });

                // Extracción segura: Si viene paginado usa res.data.data, si es directo usa res.data
                const itemsArray = res.data?.data || res.data || [];

                // Validación crítica para evitar que el .map() rompa la aplicación
                if (!Array.isArray(itemsArray)) {
                    console.error('Error: La API no devolvió un array válido.', itemsArray);
                    setSearchResults([]);
                    return;
                }

                // Mismo contrato que el catálogo (GET /shop/store/products): main_image_url, total_colors_count, color_variations
                const mappedData = itemsArray.map((raw): Product => {
                    const item = raw as Product & {
                        brand_name?: string | null;
                        category_name?: string | null;
                        is_featured?: boolean;
                    };
                    return {
                        ...item,
                        brand: item.brand_name ?? item.brand ?? 'Galaxia',
                        description: item.category_name ?? '',
                        is_new: Boolean(item.is_featured),
                    };
                });

                setSearchResults(mappedData);
            } catch (error) {
                console.error('Error buscando productos:', error);
                setSearchResults([]); // Limpiamos los resultados si falla la API
            } finally {
                setIsSearching(false);
            }
        };

        const timeoutId = setTimeout(fetchResults, 500);
        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    const handleClose = () => {
        onClose();
        setSearchTerm('');
    };

    const showDropdown = isOpen && (searchTerm.trim().length > 0 || isSearching);

    return (
        <>
            {/* Backdrop: oscurece la página detrás del Header/Dropdown */}
            <div
                className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ${
                    isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                }`}
                onClick={handleClose}
                aria-hidden={!isOpen}
            />

            {/* Contenedor relativo pegado al Header (estilo Best Buy) */}
            <div ref={searchPanelRef} className="relative z-50 w-full">
                <div
                    className={`flex items-center overflow-hidden rounded-md border bg-gray-100 transition-colors ${
                        isOpen ? 'border-black bg-white shadow-sm' : 'border-gray-200 hover:border-black'
                    }`}
                >
                    <input
                        ref={largeInputRef}
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onFocus={() => onOpen?.()}
                        onClick={() => onOpen?.()}
                        placeholder="Busca por nombre de producto, deporte o marca..."
                        className="font-inter min-w-0 flex-1 bg-transparent px-4 py-2 text-[12px] text-black outline-none placeholder:text-gray-400 lg:text-sm"
                        aria-label="Buscar productos"
                    />
                    {isOpen || searchTerm ? (
                        <button
                            type="button"
                            onClick={handleClose}
                            aria-label="Cerrar búsqueda"
                            className="flex shrink-0 items-center justify-center p-2.5 text-zinc-600 transition hover:bg-zinc-100 hover:text-black"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    ) : (
                        <span className="pointer-events-none select-none bg-black p-2.5" aria-hidden>
                            <Search className="h-5 w-5 text-white" />
                        </span>
                    )}
                </div>

                {/* Dropdown flotante justo debajo del input */}
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
                                            key={`results-${searchTerm}`}
                                            className="px-4 py-4 sm:px-5"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0, transition: { duration: 0.15 } }}
                                        >
                                            <h3 className="mb-4 border-b pb-2 text-xs font-bold uppercase tracking-widest text-gray-500">
                                                Resultados para &quot;{searchTerm}&quot;
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
                                                        href={`/product?search=${encodeURIComponent(searchTerm.trim())}`}
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
                                                Intenta buscar por marca (ej: Nike) o categoría.
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
