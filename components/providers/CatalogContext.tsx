'use client';

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from 'react';
import api from '@/lib/axios';
import { toast } from 'sonner';
import type { Brand, Category, Sport, LaravelResource } from '@/types';

export interface CatalogAttributeValue {
    id: number;
    value: string;
    category_ids: number[];
    color_hex?: string;
}

export interface CatalogAttribute {
    id: number;
    name: string;
    is_variant: boolean;
    type: string;
    values: CatalogAttributeValue[];
}

interface CatalogContextValue {
    brands: Brand[];
    categories: Category[];
    sports: Sport[];
    attributes: CatalogAttribute[];
    isLoading: boolean;
    isReady: boolean;
    error: string | null;
    refreshCatalog: () => Promise<void>;
}

const CatalogContext = createContext<CatalogContextValue | null>(null);

const CATALOG_STALE_MS = 24 * 60 * 60 * 1000;

export function CatalogProvider({ children }: { children: ReactNode }) {
    const [brands, setBrands] = useState<Brand[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [sports, setSports] = useState<Sport[]>([]);
    const [attributes, setAttributes] = useState<CatalogAttribute[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const loadedAtRef = useRef<number | null>(null);
    const loadingRef = useRef(false);
    const hasDataRef = useRef(false);

    const loadCatalog = useCallback(async (force = false) => {
        if (loadingRef.current) return;

        const now = Date.now();
        if (
            !force
            && hasDataRef.current
            && loadedAtRef.current
            && now - loadedAtRef.current < CATALOG_STALE_MS
        ) {
            return;
        }

        loadingRef.current = true;
        setIsLoading(true);
        setError(null);

        try {
            const [brandsRes, categoriesRes, sportsRes, attributesRes] = await Promise.all([
                api.get<LaravelResource<Brand[]>>('/admin/brands'),
                api.get<LaravelResource<Category[]>>('/admin/categories'),
                api.get<LaravelResource<Sport[]>>('/admin/sports'),
                api.get<LaravelResource<CatalogAttribute[]>>('/admin/attributes'),
            ]);

            setBrands(brandsRes.data.data ?? []);
            setCategories(categoriesRes.data.data ?? []);
            setSports(sportsRes.data.data ?? []);
            setAttributes(attributesRes.data.data ?? []);
            loadedAtRef.current = Date.now();
            hasDataRef.current = true;
        } catch {
            const message = 'No se pudo cargar el catálogo maestro';
            setError(message);
            toast.error(message);
        } finally {
            setIsLoading(false);
            loadingRef.current = false;
        }
    }, []);

    useEffect(() => {
        void loadCatalog();
    }, [loadCatalog]);

    const refreshCatalog = useCallback(async () => {
        await loadCatalog(true);
    }, [loadCatalog]);

    const isReady = !isLoading && !error && loadedAtRef.current !== null;

    return (
        <CatalogContext.Provider
            value={{
                brands,
                categories,
                sports,
                attributes,
                isLoading,
                isReady,
                error,
                refreshCatalog,
            }}
        >
            {children}
        </CatalogContext.Provider>
    );
}

export function useCatalog(): CatalogContextValue {
    const context = useContext(CatalogContext);
    if (!context) {
        throw new Error('useCatalog debe usarse dentro de CatalogProvider');
    }
    return context;
}
