'use client';

import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useForm, UseFormRegisterReturn } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/axios';
import { toast } from 'sonner';
import {
    ArrowLeft, Save, Upload, X, Package, Image as ImageIcon,
    Layers, BarChart, Trash2, RefreshCcw, Eye, ShoppingBag,
    AlertTriangle, Check, ChevronDown, DollarSign, Percent,
    XCircle, Loader2, Truck
} from 'lucide-react';
import PermissionGate from '@/components/auth/PermissionGate';
import { usePermission } from '@/hooks/usePermission';
import { useCatalog } from '@/components/providers/CatalogContext';
import { handleError } from '@/lib/errorHandler';
import { ADMIN_PRODUCT_NAME_CLASS } from '@/components/admin/AdminProductName';
import { Product, Category, ProductImage } from '@/types';

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
    const { can } = usePermission();
    const isEditing = Boolean(productId);
    const [productDbId, setProductDbId] = useState<number | null>(null);
    const [productDisplayName, setProductDisplayName] = useState<string | null>(null);
    const [isProductLoading, setIsProductLoading] = useState(isEditing);
    const {
        brands,
        categories: allCategories,
        sports,
    } = useCatalog();
    const [loading, setLoading] = useState(false);
    const [isSyncingOlympusStock, setIsSyncingOlympusStock] = useState(false);
    const [activeTab, setActiveTab] = useState('general');

    const [existingImages, setExistingImages] = useState<ProductImage[]>([]);
    const [loadedProduct, setLoadedProduct] = useState<Product | null>(null);

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
            setLoadedProduct(data);
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

    const handleSyncOlympusStock = async () => {
        if (!productId || isSyncingOlympusStock) return;

        setIsSyncingOlympusStock(true);
        try {
            const { data } = await api.post<{
                success: boolean;
                message: string;
                stock_quantity: number;
            }>(`/admin/products/${productId}/sync-olympus-stock`, {}, { timeout: 0 });

            const stock = Number(data.stock_quantity);
            if (!data.success || Number.isNaN(stock)) {
                toast.error(data.message || 'Olympus no devolvió un stock válido');
                return;
            }

            setLoadedProduct((prev) => (prev ? { ...prev, stock_quantity: stock } : prev));
            toast.success(`Stock actualizado a ${stock}`);
        } catch (e) {
            toast.error(handleError(e, 'No se pudo sincronizar el stock con Olympus'));
        } finally {
            setIsSyncingOlympusStock(false);
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
        const displayImages = existingImages.filter(i => i.is_visible);
        const mainImageSrc = previewMainImage || displayImages[0]?.full_url || displayImages[0]?.url || previewImages[0];
        const reg = Number(watch('price_regular')) || 0;
        const sale = Number(watch('price_sale')) || 0;
        const isSale = sale > 0 && sale < reg;
        const stock = Number(loadedProduct?.stock_quantity ?? 0);

        const priceDisplay = (
            <div className="flex items-baseline gap-3">
                <span className="text-2xl font-black text-slate-900">${(isSale ? sale : reg).toFixed(2)}</span>
                {isSale && <span className="text-lg text-slate-400 line-through decoration-1">${reg.toFixed(2)}</span>}
            </div>
        );

        const stockDisplay = stock > 10
            ? <span className="text-green-600 font-bold text-xs flex items-center gap-1"><Check className="w-3 h-3" /> En Stock ({stock})</span>
            : stock > 0
                ? <span className="text-amber-600 font-bold text-xs flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Poco Stock ({stock})</span>
                : <span className="text-red-600 font-bold text-xs flex items-center gap-1"><XCircle className="w-3 h-3" /> Agotado</span>;

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
                        {isSale && (
                            <span className="absolute top-4 left-4 bg-black text-white text-[10px] font-bold px-3 py-1.5 uppercase tracking-widest shadow-lg">
                                Oferta
                            </span>
                        )}
                    </div>

                    {displayImages.length > 1 && (
                        <div className="grid grid-cols-5 gap-2">
                            {displayImages.slice(0, 5).map((img, i) => (
                                <button key={i} type="button" onClick={() => setPreviewMainImage(img.full_url || img.url)} className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${mainImageSrc === (img.full_url || img.url) ? 'border-black opacity-100' : 'border-transparent opacity-70 hover:opacity-100'}`}>
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

                    <div className="mt-auto space-y-4">
                        <button type="button" className="w-full bg-black text-white py-4 font-bold uppercase tracking-widest text-sm hover:bg-slate-800 transition flex items-center justify-center gap-3 shadow-xl shadow-black/10">
                            <ShoppingBag className="w-4 h-4" />
                            Agregar al Carrito
                        </button>
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
                                { id: 'seo', label: 'SEO', icon: BarChart },
                                { id: 'preview', label: 'Vista Previa', icon: Eye },
                            ].map(tab => (
                                <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold transition-all ${activeTab === tab.id ? 'bg-white text-black shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><tab.icon className="w-3.5 h-3.5" /> {tab.label}</button>
                            ))}
                        </div>

                        {activeTab === 'general' && (
                            <div className="space-y-6 animate-in fade-in zoom-in-95">
                                <input type="hidden" {...register('style_code')} />
                                <input type="hidden" {...register('product_color')} />

                                <FormSection title="Info Básica" icon={Package}>
                                    <FormInput label="Nombre *" registration={register('name')} error={errors.name?.message} className={ADMIN_PRODUCT_NAME_CLASS} />
                                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormInput label="SKU / Código de barras" registration={register('sku')} className="font-mono" />
                                        <div>
                                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1 block mb-1.5">Código ERP</label>
                                            <div className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm font-mono text-slate-700">
                                                {loadedProduct?.codigo || '—'}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1 block mb-1.5">IdProducto ERP</label>
                                            <div className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm font-mono text-slate-700">
                                                {loadedProduct?.erp_product_id ?? '—'}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1 block mb-1.5">Stock</label>
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm font-mono text-slate-700">
                                                    {loadedProduct?.stock_quantity ?? 0}
                                                </div>
                                                {isEditing ? (
                                                    <button
                                                        type="button"
                                                        onClick={handleSyncOlympusStock}
                                                        disabled={isSyncingOlympusStock}
                                                        className="inline-flex items-center gap-1.5 shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                        title="Actualizar solo el stock desde Olympus"
                                                    >
                                                        {isSyncingOlympusStock ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCcw className="h-3.5 w-3.5" />}
                                                        Sincronizar con Olympus
                                                    </button>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1 block mb-1.5">Presentación</label>
                                        <div className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-700">
                                            {loadedProduct?.attributeValues?.find((value) => {
                                                const slug = value.attribute?.slug?.toLowerCase();
                                                const name = value.attribute?.name?.toLowerCase();
                                                return slug === 'presentacion' || name === 'presentación' || name === 'presentacion';
                                            })?.value || '—'}
                                        </div>
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