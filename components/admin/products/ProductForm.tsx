'use client';

import { useEffect, useState, useMemo, useRef, useCallback, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { useForm, UseFormRegisterReturn } from 'react-hook-form';
import { useRouter, useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/axios';
import { toast } from 'sonner';
import {
    ArrowLeft, Save, Upload, X, Package, Image as ImageIcon,
    Layers, BarChart, Trash2, RefreshCcw, Palette, Eye, ShoppingBag,
    AlertTriangle, Check, ChevronDown, DollarSign, Percent, EyeOff,
    LayoutGrid, Filter, Search, Square, CheckSquare, XCircle, RotateCcw, Box, Loader2, Truck
} from 'lucide-react';
import PermissionGate from '@/components/auth/PermissionGate';
import { usePermission } from '@/hooks/usePermission';
import { useCatalog } from '@/components/providers/CatalogContext';
import { handleError } from '@/lib/errorHandler';
import { colorGroupElementId, getVariantColorLabel, getVariantGroupKey, resolveVariantDeepLinkTarget, resolveVariantGroupScrollKey } from '@/lib/variantGroupUtils';
import { ADMIN_PRODUCT_NAME_CLASS } from '@/components/admin/AdminProductName';
import { Product, Category, ProductVariant, ProductImage } from '@/types';

/** Ruta raíz → … → categoría (ids), usando el mapa `parent_id` del listado admin. */
function categoryPathFromId(categoryId: number, byId: Map<number, Category>): number[] {
    const path: number[] = [];
    let cur: Category | undefined = byId.get(categoryId);
    let guard = 0;
    while (cur && guard++ < 40) {
        path.unshift(cur.id);
        const pid = cur.parent_id;
        cur = pid != null && pid !== undefined ? byId.get(pid) : undefined;
    }
    return path;
}

/** Une cada id con todos sus ancestros (para `product_categories`: aparece en Calzado, Femenino y Lifestyle…). */
function expandedCategoryIds(allCategories: Category[], explicitIds: number[]): number[] {
    const uniqueExplicit = [...new Set(explicitIds.filter((id) => Number.isFinite(id)))];
    if (!allCategories.length || !uniqueExplicit.length) {
        return uniqueExplicit;
    }
    const byId = new Map(allCategories.map((c) => [c.id, c]));
    const merged = new Set<number>();
    for (const id of uniqueExplicit) {
        for (const x of categoryPathFromId(id, byId)) {
            merged.add(x);
        }
    }
    return [...merged];
}

/** Tres selects: si el árbol tiene más de 3 niveles, los selects representan los 3 niveles inferiores del camino más profundo. */
function inferThreeLevelSelectorsFromPath(path: number[]): { parent: string; child: string; grand: string } {
    if (path.length === 0) return { parent: '', child: '', grand: '' };
    if (path.length === 1) return { parent: String(path[0]), child: '', grand: '' };
    if (path.length === 2) return { parent: String(path[0]), child: String(path[1]), grand: '' };
    return {
        parent: String(path[path.length - 3]),
        child: String(path[path.length - 2]),
        grand: String(path[path.length - 1]),
    };
}

/** Ruta ascendente usando `parent` anidado del API (parent → parent.parent). */
function categoryPathFromNestedCategory(category: Category): number[] {
    const path: number[] = [];
    let current: Category | null | undefined = category;
    let guard = 0;

    while (current && guard++ < 20) {
        path.unshift(current.id);
        current = current.parent ?? null;
    }

    return path;
}

/** Categoría hoja entre las asignadas (no es padre de otra asignada). */
function pickDeepestAssignedCategoryId(assigned: number[], byId: Map<number, Category>): number {
    const leaves = assigned.filter((id) => {
        for (const other of assigned) {
            if (other === id) continue;
            if (byId.get(other)?.parent_id === id) return false;
        }
        return true;
    });
    const candidates = leaves.length > 0 ? leaves : assigned;

    let bestId = candidates[0];
    let bestLen = 0;
    for (const id of candidates) {
        const len = categoryPathFromId(id, byId).length;
        if (len > bestLen) {
            bestLen = len;
            bestId = id;
        }
    }
    return bestId;
}

/** Mejor ruta para los tres selects: prioriza jerarquía anidada del producto, luego el árbol del catálogo. */
function resolveBestCategoryPath(
    assignedIds: number[],
    productCategories: Category[],
    byId: Map<number, Category>,
): number[] {
    const assignedSet = new Set(assignedIds);
    let best: number[] = [];

    for (const cat of productCategories) {
        if (!assignedSet.has(cat.id)) continue;

        const path = cat.parent
            ? categoryPathFromNestedCategory(cat)
            : categoryPathFromId(cat.id, byId);

        if (path.length > best.length) {
            best = path;
        }
    }

    if (best.length === 0 && assignedIds.length > 0) {
        const deepestId = pickDeepestAssignedCategoryId(assignedIds, byId);
        best = categoryPathFromId(deepestId, byId);
    }

    return best;
}

function getVariantTalla(variant: ProductVariant): string {
    const attrs = variant.attributes_json;
    if (!attrs || typeof attrs !== 'object') {
        return '—';
    }

    const talla = attrs.talla ?? attrs.Talla ?? attrs.size ?? attrs.Size;
    if (talla != null && String(talla).trim() !== '') {
        return String(talla).trim().toUpperCase();
    }

    return '—';
}

function computeVariantStockTotal(variant: ProductVariant): number {
    const fromStores = (variant.inventory_stores ?? []).reduce(
        (sum, inv) => sum + (Number(inv.qty_on_hand) || 0),
        0,
    );

    if (fromStores > 0) {
        return fromStores;
    }

    return Number(variant.stock_quantity) || 0;
}

function useFloatingPanelPosition(
    triggerRef: RefObject<HTMLElement | null>,
    open: boolean,
    panelWidth: number,
) {
    const [style, setStyle] = useState<{ top: number; left: number } | null>(null);

    const update = useCallback(() => {
        const el = triggerRef.current;
        if (!el) return;

        const rect = el.getBoundingClientRect();
        const margin = 8;
        const gap = 6;
        let left = rect.right - panelWidth;
        left = Math.max(margin, Math.min(left, window.innerWidth - panelWidth - margin));

        setStyle({
            top: rect.bottom + gap,
            left,
        });
    }, [triggerRef, panelWidth]);

    useEffect(() => {
        if (!open) {
            setStyle(null);
            return;
        }

        update();
        window.addEventListener('scroll', update, true);
        window.addEventListener('resize', update);
        return () => {
            window.removeEventListener('scroll', update, true);
            window.removeEventListener('resize', update);
        };
    }, [open, update]);

    return style;
}

const STOCK_PANEL_WIDTH = 224;

function VariantStockBadge({ variant }: { variant: ProductVariant }) {
    const [open, setOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const panelStyle = useFloatingPanelPosition(triggerRef, open, STOCK_PANEL_WIDTH);
    const stores = variant.inventory_stores ?? [];
    const total = computeVariantStockTotal(variant);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!open) return;

        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (
                triggerRef.current?.contains(target) ||
                panelRef.current?.contains(target)
            ) {
                return;
            }
            setOpen(false);
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setOpen(false);
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [open]);

    const badgeTone =
        total <= 0 ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
        : total <= 5 ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
        : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100';

    const panel =
        open && mounted && panelStyle
            ? createPortal(
                <div
                    ref={panelRef}
                    role="dialog"
                    aria-label="Stock por bodega"
                    className="fixed z-[9999] rounded-lg border border-slate-200 bg-white p-3 shadow-2xl animate-in fade-in zoom-in-95"
                    style={{ top: panelStyle.top, left: panelStyle.left, width: STOCK_PANEL_WIDTH }}
                >
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                        Stock por bodega
                    </p>
                    {stores.length > 0 ? (
                        <ul className="space-y-1 text-xs">
                            {stores.map((inv) => (
                                <li
                                    key={inv.id}
                                    className="flex items-center justify-between gap-2 rounded-md bg-slate-50 px-2 py-1"
                                >
                                    <span className="truncate font-medium text-slate-700" title={inv.store?.name}>
                                        {inv.store?.code?.trim() || inv.store?.name || 'Bodega'}
                                    </span>
                                    <span className="shrink-0 font-bold tabular-nums text-slate-900">
                                        {Number(inv.qty_on_hand) || 0}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-xs text-slate-400">
                            Sin desglose por bodega. Total consolidado: {total} u.
                        </p>
                    )}
                </div>,
                document.body,
            )
            : null;

    return (
        <>
            <button
                ref={triggerRef}
                type="button"
                onClick={() => setOpen((prev) => !prev)}
                className={`inline-flex items-center gap-0.5 rounded-full border px-2 py-0.5 text-[11px] font-bold tabular-nums transition-colors ${badgeTone}`}
                title="Ver desglose por bodega"
                aria-expanded={open}
            >
                {total} u.
                <ChevronDown className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {panel}
        </>
    );
}

const IMAGE_PANEL_WIDTH = 256;

function VariantImagePicker({
    variant,
    existingImages,
    isOpen,
    onToggle,
    onLink,
}: {
    variant: ProductVariant;
    existingImages: ProductImage[];
    isOpen: boolean;
    onToggle: () => void;
    onLink: (variantId: number, imageId: number) => void;
}) {
    const [mounted, setMounted] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const panelStyle = useFloatingPanelPosition(triggerRef, isOpen, IMAGE_PANEL_WIDTH);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (
                triggerRef.current?.contains(target) ||
                panelRef.current?.contains(target)
            ) {
                return;
            }
            onToggle();
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onToggle();
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen, onToggle]);

    const panel =
        isOpen && mounted && panelStyle
            ? createPortal(
                <div
                    ref={panelRef}
                    role="dialog"
                    aria-label="Asignar imágenes a variante"
                    className="fixed z-[9999] rounded-lg border border-slate-200 bg-white p-2 shadow-2xl animate-in fade-in zoom-in-95"
                    style={{ top: panelStyle.top, left: panelStyle.left, width: IMAGE_PANEL_WIDTH }}
                >
                    <div className="grid grid-cols-5 gap-1.5">
                        {existingImages.map((img) => {
                            const isLinked = variant.images?.some((vi) => vi.id === img.id);
                            return (
                                <button
                                    key={img.id}
                                    type="button"
                                    onClick={() => onLink(variant.id, img.id)}
                                    className={`relative aspect-square cursor-pointer rounded border overflow-hidden ${isLinked ? 'border-black ring-1 ring-black' : 'border-slate-200 hover:border-slate-400'}`}
                                >
                                    <img src={img.full_url || img.url} alt="" className="h-full w-full object-cover" />
                                    {isLinked ? (
                                        <span className="absolute inset-0 flex items-center justify-center bg-black/25">
                                            <Check className="h-3 w-3 text-white" />
                                        </span>
                                    ) : null}
                                </button>
                            );
                        })}
                    </div>
                    <button
                        type="button"
                        onClick={onToggle}
                        className="mt-2 w-full rounded py-1 text-[10px] font-bold text-red-500 hover:bg-slate-50"
                    >
                        Cerrar
                    </button>
                </div>,
                document.body,
            )
            : null;

    return (
        <div className="inline-flex items-center justify-center gap-0.5">
            {variant.images?.slice(0, 2).map((vi) => (
                <img
                    key={vi.id}
                    src={vi.full_url || vi.url}
                    alt=""
                    className="h-6 w-6 shrink-0 rounded border object-cover"
                />
            ))}
            <button
                ref={triggerRef}
                type="button"
                onClick={onToggle}
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded border transition-colors ${variant.images?.length ? 'border-green-200 bg-green-50 text-green-700' : 'border-slate-200 text-slate-400 hover:bg-slate-50'}`}
                title="Asignar imágenes"
                aria-expanded={isOpen}
            >
                <LayoutGrid className="h-3 w-3" />
            </button>
            {panel}
        </div>
    );
}

const schema = z.object({
    name: z.string().min(1, "El nombre es obligatorio"),
    sku: z.string().optional().default(''),
    description: z.string().optional(),
    short_description: z.string().optional(),
    style_code: z.string().optional(),
    product_color: z.string().optional(),
    pro_nombre_cotizaciones: z.string().max(255).optional().or(z.literal('')),
    price_regular: z.coerce.number().min(0.01, "Precio inválido"),
    price_sale: z.coerce.number().min(0).optional(),
    discount_percentage: z.coerce.number().min(0).max(100).optional(),
    weight: z.coerce.number().min(0, "El peso no puede ser negativo").optional(),
    brand_id: z.string().min(1, "Selecciona una marca"),
    status: z.enum(['draft', 'published', 'archived']),
    is_featured: z.boolean(),
    categories: z.array(z.coerce.number()).optional(),
    sports: z.array(z.coerce.number()).optional(),
    seo_title: z.string().optional(),
    seo_description: z.string().optional(),
    canonical_url: z.string().optional().or(z.literal('')),
    robots_index: z.boolean(),
    robots_follow: z.boolean(),
}).superRefine((data, ctx) => {
    if (data.price_sale && data.price_sale > 0 && data.price_sale >= data.price_regular) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "La oferta debe ser menor al regular", path: ["price_sale"] });
    }
});

type ProductFormData = z.infer<typeof schema>;

const FormSection = ({ children, title, icon: Icon }: { children: React.ReactNode, title?: string, icon?: React.ElementType }) => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
        {title && (
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
                {Icon && <Icon className="w-4 h-4 text-slate-800" />}
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">{title}</h3>
            </div>
        )}
        <div className="p-6">{children}</div>
    </div>
);

const FormInput = ({ label, error, registration, icon: Icon, className, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string, error?: string, registration: UseFormRegisterReturn, icon?: React.ElementType }) => (
    <div className="space-y-1.5 w-full">
        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">{label}</label>
        <div className="relative group">
            {Icon && <div className="absolute left-3 top-2.5 text-slate-400"><Icon className="w-4 h-4" /></div>}
            <input {...registration} {...props} className={`w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-2 focus:ring-black/5 focus:border-slate-400 block p-2.5 transition-all outline-none ${Icon ? 'pl-10' : ''} ${error ? 'border-red-300 bg-red-50 text-red-900' : ''} ${className ?? ''}`} />
        </div>
        {error && <p className="mt-1 text-xs text-red-600 font-medium flex items-center"><AlertTriangle className="w-3 h-3 mr-1" />{error}</p>}
    </div>
);

const FormSelect = ({ label, error, registration, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string, error?: string, registration?: UseFormRegisterReturn }) => (
    <div className="space-y-1.5 w-full">
        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">{label}</label>
        <div className="relative">
            <select {...registration} {...props} className={`w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-2 focus:ring-black/5 focus:border-slate-400 block p-2.5 appearance-none transition-all outline-none ${error ? 'border-red-300 bg-red-50' : ''}`}>{children}</select>
            <div className="absolute right-3 top-3 pointer-events-none text-slate-400"><ChevronDown className="w-4 h-4" /></div>
        </div>
        {error && <p className="mt-1 text-xs text-red-600 font-medium">{error}</p>}
    </div>
);

export default function ProductForm({ productId }: { productId?: string }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const variantDeepLink = useMemo(
        () => resolveVariantDeepLinkTarget({
            style: searchParams.get('style'),
            color: searchParams.get('color'),
        }),
        [searchParams],
    );
    const { can } = usePermission();
    const isEditing = Boolean(productId);
    const [productDbId, setProductDbId] = useState<number | null>(null);
    const [productDisplayName, setProductDisplayName] = useState<string | null>(null);
    const [isProductLoading, setIsProductLoading] = useState(isEditing);
    const {
        brands,
        categories: allCategories,
        sports,
        attributes,
    } = useCatalog();
    const [loading, setLoading] = useState(false);
    const [generatingVariants, setGeneratingVariants] = useState(false);
    const [isSyncingBrilo, setIsSyncingBrilo] = useState(false);
    const [activeTab, setActiveTab] = useState(() => (variantDeepLink.target ? 'variants' : 'general'));
    const colorScrollDoneRef = useRef(false);

    const [variants, setVariants] = useState<ProductVariant[]>([]);
    const [existingImages, setExistingImages] = useState<ProductImage[]>([]);
    const [variantSelection, setVariantSelection] = useState<Record<number, number[]>>({});
    const [variantImageSelector, setVariantImageSelector] = useState<number | null>(null);
    const [selectedVariantIds, setSelectedVariantIds] = useState<number[]>([]);
    const [variantSearchQuery, setVariantSearchQuery] = useState('');
    const [generatorOpen, setGeneratorOpen] = useState(false);

    const [bulkPrice, setBulkPrice] = useState('');
    const [bulkStock, setBulkStock] = useState('');
    const [bulkOffer, setBulkOffer] = useState('');

    const [selectedParentId, setSelectedParentId] = useState("");
    const [selectedChildId, setSelectedChildId] = useState("");
    const [selectedGrandChildId, setSelectedGrandChildId] = useState("");
    /** `null` = producto aún no cargado; tras GET contiene IDs asignados en BD. */
    const [productCategoryIds, setProductCategoryIds] = useState<number[] | null>(null);
    const [productCategoriesSnapshot, setProductCategoriesSnapshot] = useState<Category[]>([]);
    const categoryHydratedRef = useRef(false);
    const isCategoryHydratingRef = useRef(false);
    const [newImages, setNewImages] = useState<File[]>([]);
    const [previewImages, setPreviewImages] = useState<string[]>([]);

    const [previewFilters, setPreviewFilters] = useState<Record<string, string>>({});
    const [previewMainImage, setPreviewMainImage] = useState<string | null>(null);

    const hasPermission = isEditing ? can('edit_products') : can('create_products');

    const { register, handleSubmit, formState: { errors }, reset, setValue, watch, getValues } = useForm({
        resolver: zodResolver(schema),
        defaultValues: { name: '', sku: '', price_regular: 0, price_sale: 0, discount_percentage: 0, weight: 0, status: 'draft' as const, brand_id: '', is_featured: false, robots_index: true, robots_follow: true, categories: [], sports: [], pro_nombre_cotizaciones: '' }
    });

    const loadProduct = useCallback(async () => {
        if (!productId) return;

        setIsProductLoading(true);
        try {
            const { data } = await api.get<Product>(`/admin/products/${productId}`);
            setProductDbId(data.id);
            setProductDisplayName(data.name);
            const cats = data.categories ?? [];
            setProductCategoriesSnapshot(cats);
            setProductCategoryIds(cats.map((c) => c.id));
            reset({
                name: data.name,
                sku: data.sku,
                description: data.description || '',
                short_description: data.short_description || '',
                style_code: data.style_code || '',
                product_color: data.product_color || '',
                pro_nombre_cotizaciones: data.pro_nombre_cotizaciones?.trim() || '',
                price_regular: Number(data.price_regular),
                price_sale: Number(data.price_sale || 0),
                discount_percentage: data.discount_percentage || 0,
                weight: Number(data.weight ?? 0),
                brand_id: String(data.brand_id || ''),
                status: data.status,
                is_featured: data.is_featured,
                categories: data.categories?.map((c) => c.id) || [],
                sports: data.sports?.map((s) => s.id) || [],
                seo_title: data.seo_title || '',
                seo_description: data.seo_description || '',
                canonical_url: data.canonical_url || '',
                robots_index: !!data.robots_index,
                robots_follow: !!data.robots_follow,
            });
            if (data.images) setExistingImages(data.images);
            if (data.variants) setVariants(data.variants);
        } catch {
            toast.error('Error cargando producto');
        } finally {
            setIsProductLoading(false);
        }
    }, [productId, reset]);

    useEffect(() => {
        if (!productId) {
            setProductCategoryIds(null);
            setProductCategoriesSnapshot([]);
            categoryHydratedRef.current = false;
            setProductDbId(null);
            setProductDisplayName(null);
            setIsProductLoading(false);
            return;
        }

        setProductCategoryIds(null);
        setProductCategoriesSnapshot([]);
        categoryHydratedRef.current = false;

        void loadProduct();
    }, [productId, loadProduct]);

    const handleSyncBriloStock = async () => {
        if (!productId || isSyncingBrilo) return;

        setIsSyncingBrilo(true);
        try {
            await api.post(`/admin/products/${productId}/sync-brilo-stock`);
            toast.success('¡Stock sincronizado con Brilo correctamente!');
            await loadProduct();
        } catch (e) {
            toast.error(handleError(e, 'No se pudo sincronizar el stock con Brilo'));
        } finally {
            setIsSyncingBrilo(false);
        }
    };

    /** Hidrata los tres selects cuando el producto y el catálogo están listos. */
    useEffect(() => {
        if (!productId || !allCategories.length) return;
        if (productCategoryIds === null) return;
        if (categoryHydratedRef.current) return;

        isCategoryHydratingRef.current = true;

        if (productCategoryIds.length === 0) {
            setSelectedParentId('');
            setSelectedChildId('');
            setSelectedGrandChildId('');
            setValue('categories', []);
            categoryHydratedRef.current = true;
            isCategoryHydratingRef.current = false;
            return;
        }

        const byId = new Map(allCategories.map((c) => [c.id, c]));
        const bestPath = resolveBestCategoryPath(
            productCategoryIds,
            productCategoriesSnapshot,
            byId,
        );
        const sel = inferThreeLevelSelectorsFromPath(bestPath);

        setSelectedParentId(sel.parent);
        setSelectedChildId(sel.child);
        setSelectedGrandChildId(sel.grand);
        setValue('categories', expandedCategoryIds(allCategories, productCategoryIds));
        categoryHydratedRef.current = true;
        isCategoryHydratingRef.current = false;
    }, [productId, allCategories, productCategoryIds, productCategoriesSnapshot, setValue]);

    const parentCategories = useMemo(() => allCategories.filter(c => !c.parent_id), [allCategories]);
    const childCategories = useMemo(() => selectedParentId ? allCategories.filter(c => c.parent_id === parseInt(selectedParentId)) : [], [allCategories, selectedParentId]);
    const grandChildCategories = useMemo(
        () => selectedChildId ? allCategories.filter(c => c.parent_id === parseInt(selectedChildId)) : [],
        [allCategories, selectedChildId]
    );

    useEffect(() => {
        if (productId && (!categoryHydratedRef.current || isCategoryHydratingRef.current)) return;

        const explicit: number[] = [];
        if (selectedParentId) explicit.push(parseInt(selectedParentId, 10));
        if (selectedChildId) explicit.push(parseInt(selectedChildId, 10));
        if (selectedGrandChildId) explicit.push(parseInt(selectedGrandChildId, 10));
        setValue('categories', expandedCategoryIds(allCategories, explicit));
    }, [productId, selectedParentId, selectedChildId, selectedGrandChildId, allCategories, setValue]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            setNewImages(p => [...p, ...files]);
            setPreviewImages(p => [...p, ...files.map(f => URL.createObjectURL(f))]);
        }
    };

    const toggleImageVisibility = async (id: number) => {
        try {
            const { data } = await api.put(`/admin/product-images/${id}/toggle`);
            setExistingImages(p => p.map(img => img.id === id ? { ...img, is_visible: data.is_visible } : img));
            toast.success("Visibilidad actualizada");
        } catch (e) { toast.error("Error"); }
    };

    const removeExistingImage = async (id: number) => {
        if (!confirm("¿Borrar?")) return;
        try { await api.delete(`/admin/product-images/${id}`); setExistingImages(p => p.filter(i => i.id !== id)); } catch (e) { toast.error("Error"); }
    };

    const filteredVariants = useMemo(() => {
        if (!variantSearchQuery) return variants;
        const q = variantSearchQuery.toLowerCase();
        return variants.filter(v => v.variant_sku.toLowerCase().includes(q) || Object.values(v.attributes_json).some(val => String(val).toLowerCase().includes(q)));
    }, [variants, variantSearchQuery]);

    const groupedFilteredVariants = useMemo(() => {
        const map = new Map<string, ProductVariant[]>();

        for (const variant of filteredVariants) {
            const key = getVariantGroupKey(variant);
            const bucket = map.get(key) ?? [];
            bucket.push(variant);
            map.set(key, bucket);
        }

        return Array.from(map.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([groupKey, groupVariants]) => ({
                groupKey,
                groupVariants: groupVariants.sort((a, b) =>
                    getVariantTalla(a).localeCompare(getVariantTalla(b)),
                ),
            }));
    }, [filteredVariants]);

    useEffect(() => {
        colorScrollDoneRef.current = false;
    }, [productId, variantDeepLink.target, variantDeepLink.mode]);

    useEffect(() => {
        if (variantDeepLink.target) {
            setActiveTab('variants');
        }
    }, [variantDeepLink.target]);

    useEffect(() => {
        if (!variantDeepLink.target || !variantDeepLink.mode || activeTab !== 'variants') return;
        if (isProductLoading || !productDbId) return;
        if (colorScrollDoneRef.current) return;

        const scrollKey = resolveVariantGroupScrollKey(
            groupedFilteredVariants,
            variantDeepLink.target,
            variantDeepLink.mode,
        );
        if (!scrollKey) return;

        const elementId = colorGroupElementId(scrollKey);

        const scrollToGroup = () => {
            const element = document.getElementById(elementId);
            if (element) {
                setTimeout(() => {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
                colorScrollDoneRef.current = true;
                return true;
            }
            return false;
        };

        if (!scrollToGroup()) {
            const retryTimer = setTimeout(scrollToGroup, 300);
            return () => clearTimeout(retryTimer);
        }
    }, [
        variantDeepLink.target,
        variantDeepLink.mode,
        activeTab,
        isProductLoading,
        productDbId,
        groupedFilteredVariants,
    ]);

    const handleBulkUpdate = async () => {
        if (!confirm(`¿Actualizar ${selectedVariantIds.length} items?`)) return;
        const updates: any = {};
        if (bulkStock) updates.stock_quantity = parseInt(bulkStock);
        if (bulkPrice) updates.price_regular = parseFloat(bulkPrice);
        if (bulkOffer) updates.price_sale = parseFloat(bulkOffer);
        try {
            await Promise.all(selectedVariantIds.map(id => api.put(`/admin/product-variants/${id}`, updates)));
            setVariants(prev => prev.map(v => selectedVariantIds.includes(v.id) ? { ...v, ...updates } : v));
            toast.success("Actualizado");
            setBulkStock(''); setBulkPrice(''); setBulkOffer(''); setSelectedVariantIds([]);
        } catch (e) { toast.error("Error"); }
    };

    const handleBulkDelete = async () => {
        if (!confirm("¿Eliminar selección?")) return;
        try {
            await Promise.all(selectedVariantIds.map(id => api.delete(`/admin/product-variants/${id}`)));
            setVariants(prev => prev.filter(v => !selectedVariantIds.includes(v.id)));
            setSelectedVariantIds([]);
            toast.success("Eliminados");
        } catch (e) { toast.error("Error"); }
    };

    const handleGenerateVariants = async () => {
        if (!productDbId || !productId) return toast.error("Guarda primero");
        setGeneratingVariants(true);
        try {
            await api.post(`/admin/products/${productDbId}/variants/generate`, { selection: variantSelection });
            const { data } = await api.get<Product>(`/admin/products/${productId}`);
            setVariants(data.variants || []);
            setVariantSelection({});
            toast.success("Generadas");
        } catch (e) { toast.error("Error al generar"); }
        finally { setGeneratingVariants(false); }
    };

    const handleUpdateVariant = async (id: number, field: string, value: any) => {
        setVariants(prev => prev.map(v => v.id === id ? { ...v, [field]: value } : v));
        try { await api.put(`/admin/product-variants/${id}`, { [field]: value }); } catch (e) { }
    };

    const handleLinkImageToVariant = async (variantId: number, imageId: number) => {
        try {
            await api.post(`/admin/product-variants/${variantId}/images`, { image_ids: [imageId] });
            if (!productId) return;
            const { data } = await api.get<Product>(`/admin/products/${productId}`);
            setVariants(data.variants || []);
            setVariantImageSelector(null);
            toast.success("Imagen vinculada");
        } catch (e) { toast.error("Error"); }
    };

    const onSubmit = async (data: ProductFormData) => {
        if (!hasPermission) return;
        setLoading(true);
        const explicit: number[] = [];
        if (selectedParentId) explicit.push(parseInt(selectedParentId, 10));
        if (selectedChildId) explicit.push(parseInt(selectedChildId, 10));
        if (selectedGrandChildId) explicit.push(parseInt(selectedGrandChildId, 10));
        const categoryPayload = expandedCategoryIds(allCategories, explicit);

        const fd = new FormData();
        const skuForCreate = !productDbId && (!data.sku || !String(data.sku).trim())
            ? `FAM-${Date.now()}`
            : data.sku;

        Object.keys(data).forEach((key) => {
            // @ts-ignore
            const val = data[key];
            if (val === undefined || val === null) return;
            if (key === 'categories') return;
            if (key === 'sports') fd.append(key, JSON.stringify(val));
            else if (typeof val === 'boolean') fd.append(key, val ? '1' : '0');
            else if (key === 'sku') fd.append('sku', String(skuForCreate));
            else fd.append(key, val.toString());
        });
        fd.append('categories', JSON.stringify(categoryPayload));
        newImages.forEach(f => fd.append('new_images[]', f));
        if (productDbId) fd.append('_method', 'PUT');

        try {
            const url = productDbId ? `/admin/products/${productDbId}` : '/admin/products';
            const res = await api.post(url, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            toast.success('Guardado');
            if (!isEditing) {
                if (res.data?.id) {
                    router.push(`/products/${res.data.id}`);
                } else {
                    router.push('/products');
                }
            } else {
                router.refresh();
                setNewImages([]);
                setPreviewImages([]);
                setProductDisplayName(res.data.name ?? data.name);
            }
        } catch (e) { toast.error(handleError(e, 'Guardar')); }
        finally { setLoading(false); }
    };

    const calcPrice = () => {
        const r = Number(getValues('price_regular'));
        const p = Number(getValues('discount_percentage'));
        if (r > 0 && p >= 0) setValue('price_sale', parseFloat((r - (r * p / 100)).toFixed(2)));
    };
    const calcPercent = () => {
        const r = Number(getValues('price_regular'));
        const s = Number(getValues('price_sale'));
        if (r > 0 && s > 0 && s < r) setValue('discount_percentage', Math.round(((r - s) / r) * 100));
    };

    const PreviewEcommerce = () => {
        const activeVariant = variants.find(v =>
            Object.entries(previewFilters).every(([key, val]) => v.attributes_json[key] === val)
        );

        let displayImages = activeVariant?.images?.length ? activeVariant.images : existingImages.filter(i => i.is_visible);

        const mainImageSrc = previewMainImage || displayImages[0]?.full_url || displayImages[0]?.url || previewImages[0];

        let priceDisplay = null;
        let stockDisplay = null;

        if (activeVariant) {
            const reg = Number(activeVariant.price_regular);
            const sale = Number(activeVariant.price_sale);
            const isSale = sale > 0 && sale < reg;

            priceDisplay = (
                <div className="flex items-baseline gap-3">
                    <span className="text-2xl font-black text-slate-900">${(isSale ? sale : reg).toFixed(2)}</span>
                    {isSale && <span className="text-lg text-slate-400 line-through decoration-1">${reg.toFixed(2)}</span>}
                </div>
            );

            const stock = activeVariant.stock_quantity;
            stockDisplay = stock > 10
                ? <span className="text-green-600 font-bold text-xs flex items-center gap-1"><Check className="w-3 h-3" /> En Stock ({stock})</span>
                : stock > 0
                    ? <span className="text-amber-600 font-bold text-xs flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Poco Stock ({stock})</span>
                    : <span className="text-red-600 font-bold text-xs flex items-center gap-1"><XCircle className="w-3 h-3" /> Agotado</span>;

        } else {
            const prices = variants.length > 0
                ? variants.map(v => Number(v.price_sale || v.price_regular))
                : [Number(watch('price_sale') || watch('price_regular'))];

            const minPrice = Math.min(...prices);
            const maxPrice = Math.max(...prices);

            priceDisplay = (
                <div className="text-2xl font-black text-slate-900">
                    {minPrice !== maxPrice ? `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}` : `$${minPrice.toFixed(2)}`}
                </div>
            );
            stockDisplay = <span className="text-slate-400 text-xs">Selecciona opciones para ver stock</span>;
        }

        const availableAttributes: Record<string, string[]> = {};
        variants.forEach(v => {
            Object.entries(v.attributes_json).forEach(([key, val]) => {
                if (!availableAttributes[key]) availableAttributes[key] = [];
                if (!availableAttributes[key].includes(String(val))) availableAttributes[key].push(String(val));
            });
        });

        const handleFilterClick = (attr: string, val: string) => {
            setPreviewFilters(prev => {
                const next = { ...prev };
                if (next[attr] === val) delete next[attr];
                else next[attr] = val;
                return next;
            });
            setPreviewMainImage(null);
        };

        return (
            <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 flex flex-col md:flex-row gap-10 max-w-5xl mx-auto font-sans">

                <div className="w-full md:w-1/2 space-y-4">
                    <div className="aspect-[4/5] bg-slate-50 rounded-xl overflow-hidden relative border border-slate-100">
                        {mainImageSrc ? (
                            <img src={mainImageSrc} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" alt="Producto" />
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-300">
                                <ImageIcon className="w-16 h-16 mb-2 opacity-50" />
                                <span className="text-xs font-medium uppercase tracking-widest">Sin Imagen</span>
                            </div>
                        )}
                        {Number(activeVariant?.price_sale || watch('price_sale')) > 0 && (
                            <span className="absolute top-4 left-4 bg-black text-white text-[10px] font-bold px-3 py-1.5 uppercase tracking-widest shadow-lg">
                                Oferta
                            </span>
                        )}
                    </div>

                    {displayImages.length > 1 && (
                        <div className="grid grid-cols-5 gap-2">
                            {displayImages.slice(0, 5).map((img, i) => (
                                <button key={i} onClick={() => setPreviewMainImage(img.full_url || img.url)} className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${mainImageSrc === (img.full_url || img.url) ? 'border-black opacity-100' : 'border-transparent opacity-70 hover:opacity-100'}`}>
                                    <img src={img.full_url || img.url} className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="w-full md:w-1/2 flex flex-col">

                    <div className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-3 flex items-center gap-2">
                        {brands.find(b => b.id.toString() === watch('brand_id'))?.name || 'MARCA'}
                        <span className="text-slate-300">/</span>
                        {allCategories.find(c => c.id === Number(selectedParentId))?.name || 'CATEGORÍA'}
                    </div>

                    <h1 className={`text-4xl font-black text-slate-900 leading-tight mb-4 ${ADMIN_PRODUCT_NAME_CLASS}`}>{watch('name') || 'Nombre del Producto'}</h1>

                    {priceDisplay}
                    <div className="mt-2 mb-6">{stockDisplay}</div>

                    <div className="h-px bg-slate-100 w-full mb-6" />

                    <div className="space-y-6 mb-8">
                        {Object.entries(availableAttributes).map(([attr, values]) => (
                            <div key={attr}>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">{attr}: <span className="text-slate-500 font-normal">{previewFilters[attr]}</span></span>
                                    {previewFilters[attr] && <button onClick={() => handleFilterClick(attr, previewFilters[attr])} className="text-[10px] text-slate-400 underline hover:text-black">Limpiar</button>}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {values.map(val => {
                                        const isSelected = previewFilters[attr] === val;
                                        return (
                                            <button
                                                key={val}
                                                onClick={() => handleFilterClick(attr, val)}
                                                className={`px-4 py-2 text-sm font-medium border transition-all duration-200 min-w-[3rem] ${isSelected ? 'bg-black text-white border-black shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}
                                            >
                                                {val}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}

                        {Object.keys(previewFilters).length > 0 && (
                            <button onClick={() => setPreviewFilters({})} className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-black transition mt-4">
                                <RotateCcw className="w-3 h-3" /> Resetear todos los filtros
                            </button>
                        )}
                    </div>

                    <div className="mt-auto space-y-4">
                        <button disabled={!activeVariant && variants.length > 0} className="w-full bg-black text-white py-4 font-bold uppercase tracking-widest text-sm hover:bg-slate-800 transition flex items-center justify-center gap-3 shadow-xl shadow-black/10 disabled:opacity-50 disabled:cursor-not-allowed">
                            <ShoppingBag className="w-4 h-4" />
                            {variants.length > 0 && !activeVariant ? 'Selecciona Opciones' : 'Agregar al Carrito'}
                        </button>
                        <div className="text-xs text-center text-slate-400 flex items-center justify-center gap-4">
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const gallerySidebar = (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-3 border-b pb-2 flex items-center gap-2">
                <ImageIcon className="w-3.5 h-3.5" /> Galería
            </h3>
            <div className="grid grid-cols-2 gap-2">
                {existingImages.map(img => (
                    <div key={img.id} className={`relative group aspect-square rounded-md border overflow-hidden bg-white ${!img.is_visible ? 'opacity-50 grayscale' : ''}`}>
                        <img src={img.full_url || img.url} alt="" className="w-full h-full object-cover" />
                        <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
                            <button type="button" onClick={() => toggleImageVisibility(img.id)} className="bg-black/80 text-white p-1 rounded hover:bg-black"><Eye className="w-2.5 h-2.5" /></button>
                            <button type="button" onClick={() => removeExistingImage(img.id)} className="bg-red-500 text-white p-1 rounded hover:bg-red-600"><Trash2 className="w-2.5 h-2.5" /></button>
                        </div>
                        {!img.is_visible && <div className="absolute bottom-0 inset-x-0 bg-black text-white text-[8px] text-center py-0.5 uppercase font-bold">Oculta</div>}
                    </div>
                ))}
                {previewImages.map((src, i) => (
                    <div key={i} className="relative aspect-square rounded-md border-2 border-dashed border-slate-300 overflow-hidden">
                        <img src={src} alt="" className="w-full h-full object-cover opacity-70" />
                        <button type="button" onClick={() => { setNewImages(p => p.filter((_, x) => x !== i)); setPreviewImages(p => p.filter((_, x) => x !== i)) }} className="absolute top-0.5 right-0.5 bg-white rounded-full p-0.5 shadow-sm"><X className="w-2.5 h-2.5" /></button>
                    </div>
                ))}
                <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-slate-200 rounded-md cursor-pointer hover:bg-slate-50 transition-colors col-span-2">
                    <Upload className="w-4 h-4 text-slate-400 mb-1" />
                    <span className="text-[9px] font-bold text-slate-500 uppercase">Subir fotos</span>
                    <input type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
            </div>
        </div>
    );

    return (
        <PermissionGate permission={isEditing ? 'edit_products' : 'create_products'}>
            <form onSubmit={handleSubmit(onSubmit, () => toast.error("Revisa errores"))} className="max-w-7xl mx-auto px-6 py-8 pb-32">

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 sticky top-4 z-40 bg-white/90 backdrop-blur-xl p-4 rounded-xl border border-slate-200/60 shadow-lg shadow-slate-200/20">
                    <div className="flex items-center gap-4">
                        <button type="button" onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-lg transition text-slate-500 hover:text-black"><ArrowLeft className="w-5 h-5" /></button>
                        <div>
                            <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                                {isEditing
                                    ? (isProductLoading
                                        ? 'Editar Producto...'
                                        : (
                                            <>
                                                Editar Producto{' '}
                                                <span className={ADMIN_PRODUCT_NAME_CLASS}>
                                                    {productDisplayName ?? watch('name') ?? ''}
                                                </span>
                                            </>
                                        ))
                                    : 'Nuevo Producto'}
                            </h1>
                            {!isEditing ? (
                                <div className="flex items-center gap-2 text-xs font-mono text-slate-500 mt-0.5">
                                    <span className="bg-slate-100 px-1.5 rounded">DRAFT</span>
                                </div>
                            ) : null}
                        </div>
                    </div>
                    {hasPermission && <button type="submit" disabled={loading} className="w-full sm:w-auto bg-black text-white px-6 py-2.5 rounded-lg font-bold text-sm hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg shadow-black/10">{loading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : <Save className="w-4 h-4" />} Guardar</button>}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    <div className={`space-y-6 ${activeTab === 'general' ? 'lg:col-span-8' : 'lg:col-span-12'}`}>

                        <div className="flex flex-wrap gap-1 p-1 bg-slate-100 rounded-lg mb-2">
                            {[
                                { id: 'general', label: 'General', icon: Package },
                                { id: 'variants', label: 'Variantes', icon: Palette },
                                { id: 'seo', label: 'SEO', icon: BarChart },
                                { id: 'preview', label: 'Vista Previa', icon: Eye },
                            ].map(tab => (
                                <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold transition-all ${activeTab === tab.id ? 'bg-white text-black shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><tab.icon className="w-3.5 h-3.5" /> {tab.label}</button>
                            ))}
                        </div>

                        {activeTab === 'general' && (
                            <div className="space-y-6 animate-in fade-in zoom-in-95">
                                <input type="hidden" {...register('sku')} />
                                <input type="hidden" {...register('style_code')} />
                                <input type="hidden" {...register('product_color')} />

                                <FormSection title="Info Básica" icon={Package}>
                                    <FormInput label="Nombre *" registration={register('name')} error={errors.name?.message} className={ADMIN_PRODUCT_NAME_CLASS} />
                                    <div className="mt-4">
                                        <FormInput
                                            label="Referencia de Cotización (Brilo)"
                                            registration={register('pro_nombre_cotizaciones')}
                                            placeholder="Ej. U:SYTE L:TE S:RU"
                                            className="font-mono"
                                        />
                                    </div>
                                </FormSection>

                                <FormSection title="Clasificación" icon={Layers}>
                                    <div className="space-y-6">
                                        <FormSelect label="Marca" registration={register('brand_id')} error={errors.brand_id?.message}>
                                            <option value="">-- Seleccionar --</option>{brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                        </FormSelect>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <FormSelect label="Categoría" value={selectedParentId} onChange={e => { setSelectedParentId(e.target.value); setSelectedChildId(""); setSelectedGrandChildId(""); }}><option value="">-- Seleccionar --</option>{parentCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</FormSelect>
                                            <FormSelect label="Subcategoría" value={selectedChildId} onChange={e => { setSelectedChildId(e.target.value); setSelectedGrandChildId(""); }} disabled={!selectedParentId}><option value="">-- Seleccionar --</option>{childCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</FormSelect>
                                            <FormSelect label="Sub-subcategoría" value={selectedGrandChildId} onChange={e => setSelectedGrandChildId(e.target.value)} disabled={!selectedChildId}><option value="">-- Seleccionar --</option>{grandChildCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</FormSelect>
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1 block mb-2">Deportes</label>
                                            <div className="flex flex-wrap gap-2">{sports.map(s => (<label key={s.id} className="cursor-pointer border rounded-md px-3 py-1.5 text-xs font-medium hover:border-black transition select-none has-[:checked]:bg-black has-[:checked]:text-white has-[:checked]:border-black"><input type="checkbox" value={s.id} {...register('sports')} className="sr-only" />{s.name}</label>))}</div>
                                        </div>
                                    </div>
                                </FormSection>

                                <FormSection title="Precios" icon={DollarSign}>
                                    <div className="grid grid-cols-3 gap-6">
                                        <FormInput type="number" step="0.01" label="Regular *" registration={register('price_regular')} error={errors.price_regular?.message} />
                                        <div>
                                            <label className="text-[11px] font-bold text-slate-500 uppercase flex justify-between mb-1.5">% Desc <button type="button" onClick={calcPrice} className="text-black hover:underline">Calc</button></label>
                                            <div className="relative"><input type="number" {...register('discount_percentage')} className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-black/5" /><span className="absolute right-3 top-2.5 text-slate-400"><Percent className="w-4 h-4" /></span></div>
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-bold text-slate-500 uppercase flex justify-between mb-1.5">Oferta <button type="button" onClick={calcPercent} className="text-black hover:underline">Calc %</button></label>
                                            <div className="relative"><span className="absolute left-3 top-2.5 text-slate-400">$</span><input type="number" step="0.01" {...register('price_sale')} className="w-full bg-white border border-slate-200 rounded-lg pl-6 p-2.5 text-sm font-bold text-black outline-none focus:ring-2 focus:ring-black/5" /></div>
                                        </div>
                                    </div>
                                </FormSection>

                                <FormSection title="Logística" icon={Truck}>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <FormInput
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            label="Peso (Lbs) *"
                                            placeholder="Ej. 1.5"
                                            registration={register('weight')}
                                            error={errors.weight?.message}
                                        />
                                    </div>
                                </FormSection>

                                <FormSection title="Contenido">
                                    <textarea {...register('description')} className="w-full border border-slate-200 rounded-lg p-4 text-sm h-40 focus:ring-2 focus:ring-black/5 outline-none mb-4" placeholder="Descripción detallada..."></textarea>
                                    <textarea {...register('short_description')} className="w-full border border-slate-200 rounded-lg p-4 text-sm h-24 focus:ring-2 focus:ring-black/5 outline-none" placeholder="Resumen..."></textarea>
                                </FormSection>
                            </div>
                        )}

                        {activeTab === 'variants' && (
                            <div className="space-y-6 animate-in fade-in">
                                {isEditing ? (
                                    <>
                                        <div className="flex flex-col items-end gap-1.5 w-full">
                                            <button
                                                type="button"
                                                onClick={handleSyncBriloStock}
                                                disabled={isSyncingBrilo || variants.length === 0}
                                                className="inline-flex items-center gap-2 rounded-lg border border-amber-300/40 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-amber-50 shadow-md transition-all hover:from-black hover:to-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                {isSyncingBrilo ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                                                        Sincronizando stock...
                                                    </>
                                                ) : (
                                                    <>
                                                        <RefreshCcw className="h-4 w-4 shrink-0" />
                                                        Sincronizar stock con Brilo
                                                    </>
                                                )}
                                            </button>
                                            {variants.length > 0 ? (
                                                <span className="text-[11px] font-medium text-slate-500">
                                                    Consulta el ERP y actualiza inventario por bodega
                                                </span>
                                            ) : null}
                                        </div>

                                        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                                            <button
                                                type="button"
                                                onClick={() => setGeneratorOpen((prev) => !prev)}
                                                className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-slate-50 transition-colors"
                                            >
                                                <span className="text-sm font-bold text-slate-800">
                                                    🛠️ Abrir Generador Avanzado de Variantes
                                                </span>
                                                <ChevronDown className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${generatorOpen ? 'rotate-180' : ''}`} />
                                            </button>

                                            {generatorOpen ? (
                                                <div className="border-t border-slate-100 px-6 pb-6 pt-5 animate-in slide-in-from-top-2">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                                            <Filter className="w-3 h-3" /> Generador
                                                        </h4>
                                                        <div className={`text-[10px] px-2 py-1 rounded font-medium border ${selectedParentId ? 'bg-black text-white border-black' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                                                            {selectedParentId ? `Filtro: ${allCategories.find(c => c.id === Number(selectedParentId))?.name}` : '⚠️ Sin filtro'}
                                                        </div>
                                                    </div>
                                                    <div className="space-y-6">
                                                        {attributes.filter(a => a.is_variant).map(attr => {
                                                            const filtered = attr.values.filter(v => {
                                                                if (!selectedParentId) return true;
                                                                if (!v.category_ids || v.category_ids.length === 0) return true;
                                                                return v.category_ids.includes(Number(selectedParentId));
                                                            });
                                                            if (!filtered.length) return null;
                                                            return (
                                                                <div key={attr.id} className="pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                                                                    <div className="flex justify-between items-center mb-2">
                                                                        <p className="text-xs font-bold text-slate-700">{attr.name}</p>
                                                                        <button type="button" onClick={() => { const visibleIds = filtered.map(v => v.id); const current = variantSelection[attr.id] || []; const allSelected = visibleIds.every(id => current.includes(id)); setVariantSelection(p => ({ ...p, [attr.id]: allSelected ? [] : visibleIds })); }} className="text-[10px] font-bold text-slate-400 hover:text-black hover:underline">Seleccionar Todo</button>
                                                                    </div>
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {filtered.map(v => {
                                                                            const isSel = variantSelection[attr.id]?.includes(v.id);
                                                                            return <button key={v.id} type="button" onClick={() => setVariantSelection(p => { const c = p[attr.id] || []; return { ...p, [attr.id]: c.includes(v.id) ? c.filter(i => i !== v.id) : [...c, v.id] }; })} className={`px-3 py-1.5 text-xs font-medium rounded border transition-all flex items-center gap-2 ${isSel ? 'bg-black text-white border-black' : 'bg-white text-slate-600 hover:border-slate-400'}`}>{isSel && <Check className="w-3 h-3" />} {v.value}</button>
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                    <button type="button" onClick={handleGenerateVariants} disabled={generatingVariants} className="w-full mt-4 bg-black text-white py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-slate-800 disabled:opacity-50">{generatingVariants ? 'Procesando...' : 'Generar Variantes'}</button>
                                                </div>
                                            ) : null}
                                        </div>

                                        {variants.length > 0 ? (
                                            <div className="space-y-5">
                                                <div className="flex gap-4 items-center bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                                                    <div className="relative flex-1">
                                                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                                        <input placeholder="Buscar variante (SKU, Talla, Color)..." value={variantSearchQuery} onChange={e => setVariantSearchQuery(e.target.value)} className="w-full pl-9 bg-slate-50 border-0 rounded-lg py-2 text-xs font-medium focus:ring-1 focus:ring-black outline-none" />
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                                                        <span>{filteredVariants.length} resultados</span>
                                                        <span className="text-slate-300">·</span>
                                                        <span>{groupedFilteredVariants.length} grupos</span>
                                                    </div>
                                                </div>

                                                {selectedVariantIds.length > 0 ? (
                                                    <div className="bg-slate-900 text-white p-2.5 flex flex-wrap items-center justify-between gap-3 rounded-xl shadow-lg animate-in slide-in-from-top-2">
                                                        <div className="flex flex-wrap items-center gap-3">
                                                            <button type="button" onClick={() => setSelectedVariantIds([])} className="text-slate-400 hover:text-white transition"><XCircle className="w-5 h-5" /></button>
                                                            <span className="text-xs font-bold px-2 py-0.5 bg-slate-800 rounded">{selectedVariantIds.length} seleccionados</span>
                                                            <div className="h-4 w-px bg-slate-700 mx-1 hidden sm:block" />
                                                            <div className="flex flex-wrap gap-2 items-center">
                                                                <input placeholder="Stock" value={bulkStock} onChange={e => setBulkStock(e.target.value)} className="w-14 bg-slate-800 border-none rounded text-[10px] text-center text-white placeholder-slate-500 focus:ring-1 focus:ring-white h-7" />
                                                                <input placeholder="Precio" value={bulkPrice} onChange={e => setBulkPrice(e.target.value)} className="w-14 bg-slate-800 border-none rounded text-[10px] text-center text-white placeholder-slate-500 focus:ring-1 focus:ring-white h-7" />
                                                                <input placeholder="Oferta" value={bulkOffer} onChange={e => setBulkOffer(e.target.value)} className="w-14 bg-slate-800 border-none rounded text-[10px] text-center text-white placeholder-slate-500 focus:ring-1 focus:ring-white h-7" />
                                                                <button type="button" onClick={handleBulkUpdate} className="text-[10px] font-bold hover:underline bg-white text-black px-2 py-1 rounded h-7">Aplicar</button>
                                                            </div>
                                                        </div>
                                                        <button type="button" onClick={handleBulkDelete} className="text-red-400 hover:text-red-200 text-xs font-bold flex items-center gap-1 bg-red-900/30 px-2 py-1 rounded hover:bg-red-900/50"><Trash2 className="w-3 h-3" /> Eliminar</button>
                                                    </div>
                                                ) : null}

                                                {groupedFilteredVariants.map(({ groupKey, groupVariants }) => (
                                                    <div
                                                        key={groupKey}
                                                        id={colorGroupElementId(groupKey)}
                                                        className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-visible scroll-mt-28"
                                                    >
                                                        <div className="flex items-center gap-2 rounded-t-xl px-4 py-2 bg-slate-50 border-b border-slate-200">
                                                            <Box className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                                            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-800">
                                                                Estilo: {groupKey}
                                                            </h4>
                                                            <span className="ml-auto text-[10px] font-medium text-slate-400">{groupVariants.length} talla{groupVariants.length !== 1 ? 's' : ''}</span>
                                                        </div>

                                                        <div className="overflow-x-auto overflow-y-visible rounded-b-xl">
                                                            <table className="w-full text-left min-w-[680px]">
                                                                <thead className="bg-white text-[10px] uppercase text-slate-500 font-bold border-b border-slate-100">
                                                                    <tr>
                                                                        <th className="px-2 py-1.5 w-8">
                                                                            <button type="button" onClick={() => {
                                                                                const ids = groupVariants.map(v => v.id);
                                                                                const allSelected = ids.every(id => selectedVariantIds.includes(id));
                                                                                setSelectedVariantIds(prev => allSelected ? prev.filter(id => !ids.includes(id)) : [...new Set([...prev, ...ids])]);
                                                                            }} className="text-slate-400 hover:text-black">
                                                                                {groupVariants.every(v => selectedVariantIds.includes(v.id)) && groupVariants.length > 0 ? <CheckSquare className="w-3.5 h-3.5 text-black" /> : <Square className="w-3.5 h-3.5" />}
                                                                            </button>
                                                                        </th>
                                                                        <th className="px-2 py-1.5 w-16">Talla</th>
                                                                        <th className="px-2 py-1.5">SKU / Código de barra</th>
                                                                        <th className="px-2 py-1.5 text-center w-28">Precio</th>
                                                                        <th className="px-2 py-1.5 text-center w-24">Estado</th>
                                                                        <th className="px-2 py-1.5 text-center w-24">Imágenes</th>
                                                                        <th className="px-2 py-1.5 text-center w-24">Stock Total</th>
                                                                        <th className="px-2 py-1.5 w-8" />
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-slate-50">
                                                                    {groupVariants.map(v => {
                                                                        const isSelected = selectedVariantIds.includes(v.id);
                                                                        return (
                                                                            <tr key={v.id} className={`hover:bg-slate-50/50 transition-colors ${isSelected ? 'bg-indigo-50/30' : ''}`}>
                                                                                <td className="px-2 py-1">
                                                                                    <button type="button" onClick={() => setSelectedVariantIds(p => p.includes(v.id) ? p.filter(i => i !== v.id) : [...p, v.id])} className={`${isSelected ? 'text-black' : 'text-slate-300 hover:text-slate-500'}`}>
                                                                                        {isSelected ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                                                                                    </button>
                                                                                </td>
                                                                                <td className="px-2 py-1">
                                                                                    <span className="inline-flex min-w-[2rem] items-center justify-center rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-bold text-slate-800 leading-none">
                                                                                        {getVariantTalla(v)}
                                                                                    </span>
                                                                                </td>
                                                                                <td className="px-2 py-1">
                                                                                    <div className="font-mono text-[11px] font-semibold leading-tight text-slate-700">{v.variant_sku}</div>
                                                                                    {getVariantColorLabel(v) ? (
                                                                                        <div className="text-[9px] font-medium uppercase leading-tight text-slate-400">
                                                                                            Color: {getVariantColorLabel(v)}
                                                                                        </div>
                                                                                    ) : null}
                                                                                </td>
                                                                                <td className="px-2 py-1">
                                                                                    <div className="flex items-center gap-1">
                                                                                        <input type="number" step="0.01" title="Precio regular" className="w-full min-w-0 border rounded px-1 py-0.5 text-center text-[11px] font-medium leading-tight focus:ring-1 focus:ring-black outline-none bg-transparent hover:bg-white focus:bg-white" defaultValue={v.price_regular} onBlur={e => handleUpdateVariant(v.id, 'price_regular', parseFloat(e.target.value))} />
                                                                                        <input type="number" step="0.01" title="Precio oferta" placeholder="Of." className="w-full min-w-0 border rounded px-1 py-0.5 text-center text-[10px] font-medium leading-tight focus:ring-1 focus:ring-black outline-none bg-transparent hover:bg-white focus:bg-white placeholder-slate-300" defaultValue={v.price_sale || ''} onBlur={e => handleUpdateVariant(v.id, 'price_sale', parseFloat(e.target.value))} />
                                                                                    </div>
                                                                                </td>
                                                                                <td className="px-2 py-1">
                                                                                    <div className="relative">
                                                                                        <select value={v.status} onChange={e => handleUpdateVariant(v.id, 'status', e.target.value)} className={`w-full appearance-none border rounded py-0.5 pl-5 pr-1 text-[11px] font-medium leading-tight focus:ring-1 focus:ring-black outline-none bg-transparent hover:bg-white cursor-pointer ${v.status === 'active' ? 'text-green-700 border-green-200' : 'text-slate-500'}`}><option value="active">Activo</option><option value="inactive">Inactivo</option></select>
                                                                                        <div className={`absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full ${v.status === 'active' ? 'bg-green-500' : 'bg-slate-300'}`} />
                                                                                    </div>
                                                                                </td>
                                                                                <td className="px-2 py-1 text-center">
                                                                                    <VariantImagePicker
                                                                                        variant={v}
                                                                                        existingImages={existingImages}
                                                                                        isOpen={variantImageSelector === v.id}
                                                                                        onToggle={() => setVariantImageSelector(variantImageSelector === v.id ? null : v.id)}
                                                                                        onLink={handleLinkImageToVariant}
                                                                                    />
                                                                                </td>
                                                                                <td className="px-2 py-1 text-center">
                                                                                    <VariantStockBadge variant={v} />
                                                                                </td>
                                                                                <td className="px-2 py-1 text-right">
                                                                                    <button type="button" onClick={() => { if (confirm('¿Eliminar?')) api.delete(`/admin/product-variants/${v.id}`).then(() => { setVariants(p => p.filter(i => i.id !== v.id)); toast.success('Eliminada'); }); }} className="text-slate-300 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                                                                                </td>
                                                                            </tr>
                                                                        );
                                                                    })}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                ))}

                                                {groupedFilteredVariants.length === 0 ? (
                                                    <div className="text-center py-10 text-sm text-slate-400 border border-dashed border-slate-200 rounded-xl bg-white">
                                                        No hay variantes que coincidan con la búsqueda.
                                                    </div>
                                                ) : null}
                                            </div>
                                        ) : (
                                            <div className="text-center py-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-white">
                                                Aún no hay variantes. Abre el generador avanzado para crear combinaciones de talla y color.
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="text-center py-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-white">
                                        Guarda primero para habilitar variantes e inventario.
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'preview' && <PreviewEcommerce />}
                        {activeTab === 'seo' && (
                            <FormSection title="SEO" icon={BarChart}>
                                <FormInput label="Meta Title" registration={register('seo_title')} />
                                <textarea {...register('seo_description')} className="w-full border rounded-lg p-3 text-sm h-24 mt-4 outline-none" placeholder="Descripción..."></textarea>
                                <FormInput label="Canonical URL" registration={register('canonical_url')} />
                            </FormSection>
                        )}
                    </div>

                    {activeTab === 'general' ? (
                        <div className="lg:col-span-4 flex flex-col gap-4 sticky top-24">
                            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-4 border-b pb-2">Estado</h3>
                                <div className="space-y-4">
                                    <FormSelect label="Visibilidad" registration={register('status')}><option value="draft">Borrador</option><option value="published">Publicado</option><option value="archived">Archivado</option></FormSelect>
                                    <div className="pt-4 border-t border-slate-100 space-y-3">
                                        <label className="flex items-center gap-3 cursor-pointer group p-2 hover:bg-slate-50 rounded transition"><input type="checkbox" {...register('is_featured')} className="accent-black w-4 h-4" /><span className="text-sm font-medium text-slate-700">Destacado</span></label>
                                        <label className="flex items-center gap-3 cursor-pointer group p-2 hover:bg-slate-50 rounded transition"><input type="checkbox" {...register('robots_index')} className="accent-black w-4 h-4" /><span className="text-sm font-medium text-slate-700">Indexar (SEO)</span></label>
                                    </div>
                                </div>
                            </div>
                            {gallerySidebar}
                        </div>
                    ) : null}
                </div>
            </form>
        </PermissionGate>
    );
}