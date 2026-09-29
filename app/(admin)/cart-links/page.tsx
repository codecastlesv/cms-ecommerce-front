'use client';

import { useEffect, useRef, useState } from 'react';
import { Search, RefreshCw, ShoppingCart, Link2, Copy, Check, X, Clock, Package } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/axios';
import { handleError } from '@/lib/errorHandler';
import PermissionGate from '@/components/auth/PermissionGate';
import { usePermission } from '@/hooks/usePermission';

interface AdminProduct {
    id: number;
    name: string;
    sku: string;
    status: string;
    price_regular: number;
    price_sale?: number | null;
    is_promo_active?: boolean;
    promo_price?: number | null;
    stock_quantity: number;
    main_image_url?: string | null;
    categories?: unknown[];
}

interface CartLine {
    product: AdminProduct;
    quantity: number;
}

function effectivePrice(p: AdminProduct): number {
    if (p.is_promo_active && p.promo_price != null) return p.promo_price;
    const sale = p.price_sale != null ? Number(p.price_sale) : null;
    const regular = Number(p.price_regular);
    return sale != null && sale > 0 && sale < regular ? sale : regular;
}

function money(n: number): string {
    return '$' + n.toFixed(2);
}

export default function CartLinksPage() {
    const { can } = usePermission();
    const canEdit = can('edit_admin_carts');

    const [search, setSearch] = useState('');
    const [products, setProducts] = useState<AdminProduct[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [pendingQty, setPendingQty] = useState<Record<number, number>>({});

    const [cart, setCart] = useState<Map<number, CartLine>>(new Map());

    const [syncing, setSyncing] = useState(false);
    const [syncedAt, setSyncedAt] = useState<Date | null>(null);

    const [generating, setGenerating] = useState(false);
    const [generatedLink, setGeneratedLink] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const fetchProducts = async (term: string) => {
        setLoadingProducts(true);
        try {
            const { data } = await api.get('/admin/products', { params: { search: term || undefined, per_page: 24 } });
            const results: AdminProduct[] = Array.isArray(data?.data) ? data.data : [];
            // Solo productos que realmente se verían en la tienda: con stock, publicados
            // y con al menos una categoría (mismos requisitos que usa ShopStoreController).
            setProducts(
                results.filter(
                    (p) =>
                        Number(p.stock_quantity) >= 1 &&
                        p.status === 'published' &&
                        Array.isArray(p.categories) &&
                        p.categories.length > 0
                )
            );
        } catch (error) {
            toast.error(handleError(error, 'Buscar productos'));
        } finally {
            setLoadingProducts(false);
        }
    };

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            fetchProducts(search);
        }, 350);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    useEffect(() => {
        fetchProducts('');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const getPendingQty = (id: number) => pendingQty[id] ?? 1;

    const addToCart = (product: AdminProduct) => {
        const qty = getPendingQty(product.id);
        setCart((prev) => {
            const next = new Map(prev);
            next.set(product.id, { product, quantity: qty });
            return next;
        });
        setPendingQty((prev) => {
            const next = { ...prev };
            delete next[product.id];
            return next;
        });
    };

    const removeFromCart = (id: number) => {
        setCart((prev) => {
            const next = new Map(prev);
            next.delete(id);
            return next;
        });
    };

    const setCartQuantity = (id: number, quantity: number) => {
        setCart((prev) => {
            const line = prev.get(id);
            if (!line) return prev;
            const next = new Map(prev);
            next.set(id, { ...line, quantity });
            return next;
        });
    };

    const cartLines = Array.from(cart.values());
    const totalUnits = cartLines.reduce((sum, l) => sum + l.quantity, 0);

    const handleSyncPrices = async () => {
        setSyncing(true);
        try {
            const { data } = await api.post('/admin/olympus/sync-prices', {}, { timeout: 0 });
            setSyncedAt(new Date());
            toast.success(data?.message || 'Precios sincronizados');
            fetchProducts(search);
        } catch (error) {
            toast.error(handleError(error, 'Sincronizar precios'));
        } finally {
            setSyncing(false);
        }
    };

    const handleGenerateLink = async () => {
        if (cartLines.length === 0) return;
        setGenerating(true);
        setGeneratedLink(null);
        setCopied(false);
        try {
            const payload = {
                items: cartLines.map((l) => ({ product_id: l.product.id, quantity: l.quantity })),
            };
            const { data } = await api.post('/admin/admin-carts', payload);
            const origin = typeof window !== 'undefined' ? window.location.origin : '';
            setGeneratedLink(`${origin}/carrito/${data.token}`);
            toast.success('Enlace generado');
        } catch (error) {
            toast.error(handleError(error, 'Generar enlace'));
        } finally {
            setGenerating(false);
        }
    };

    const handleCopy = async () => {
        if (!generatedLink) return;
        try {
            await navigator.clipboard.writeText(generatedLink);
        } catch {
            // silencioso: el usuario puede seleccionar el texto manualmente
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
    };

    return (
        <PermissionGate permission="view_admin_carts">
            <div className="max-w-7xl mx-auto p-6 pb-20">
                <div className="mb-5">
                    <h1 className="text-2xl font-bold text-slate-900">Carritos para Clientes</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Arma una selección de productos y genera un enlace de 24 horas para que el cliente lo abra y complete la compra con su carrito ya lleno.
                    </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3 mb-5">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <Clock className="w-4 h-4 text-blue-700 shrink-0" />
                        <p className="text-xs text-blue-700 leading-relaxed">
                            {syncedAt
                                ? <>Precios sincronizados hace un momento ({syncedAt.toLocaleTimeString('es-SV')}).</>
                                : <>Precios sincronizados según la última corrida automática.</>}{' '}
                            El stock se actualiza solo a medianoche.
                        </p>
                    </div>
                    {canEdit && (
                        <button
                            type="button"
                            onClick={handleSyncPrices}
                            disabled={syncing}
                            className="shrink-0 inline-flex items-center gap-2 bg-white border border-blue-200 text-blue-700 text-xs font-bold px-3.5 py-2 rounded-xl hover:shadow-sm disabled:opacity-60 transition"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                            {syncing ? 'Sincronizando…' : 'Sincronizar precios'}
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5 items-start">
                    {/* Buscador + grid de productos */}
                    <div>
                        <div className="relative mb-4">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Buscar por nombre, SKU o código..."
                                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 ring-slate-900 shadow-sm"
                            />
                        </div>

                        {loadingProducts ? (
                            <div className="py-16 text-center text-sm text-slate-400">Cargando productos…</div>
                        ) : products.length === 0 ? (
                            <div className="py-16 text-center text-sm text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                                Sin resultados.
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                                {products.map((p) => {
                                    const added = cart.has(p.id);
                                    const qty = getPendingQty(p.id);
                                    const price = effectivePrice(p);
                                    return (
                                        <div key={p.id} className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm flex flex-col gap-2">
                                            <div className="aspect-square rounded-xl bg-slate-50 flex items-center justify-center overflow-hidden">
                                                {p.main_image_url ? (
                                                    <img src={p.main_image_url} alt={p.name} className="w-full h-full object-contain p-2" />
                                                ) : (
                                                    <Package className="w-8 h-8 text-slate-300" />
                                                )}
                                            </div>
                                            <p className="text-[12.5px] font-bold text-slate-800 leading-tight line-clamp-2 min-h-[2.4em]">{p.name}</p>
                                            <p className="text-[11px] text-slate-400 font-mono">SKU {p.sku}</p>
                                            <p className="text-sm font-extrabold text-slate-900 tabular-nums">{money(price)}</p>
                                            <p className="text-[10.5px] text-slate-500">{p.stock_quantity} en stock</p>

                                            {canEdit && (
                                                <div className="flex flex-col gap-1.5 mt-0.5">
                                                    {!added && (
                                                        <div className="flex items-stretch border border-slate-300 rounded-lg overflow-hidden h-[30px]">
                                                            <button
                                                                type="button"
                                                                onClick={() => setPendingQty((prev) => ({ ...prev, [p.id]: Math.max(1, getPendingQty(p.id) - 1) }))}
                                                                disabled={qty <= 1}
                                                                className="w-7 bg-slate-50 text-slate-700 font-bold disabled:opacity-30"
                                                            >
                                                                −
                                                            </button>
                                                            <input
                                                                type="number"
                                                                min={1}
                                                                max={p.stock_quantity || undefined}
                                                                value={qty}
                                                                onChange={(e) => {
                                                                    const v = Math.max(1, Math.round(Number(e.target.value)) || 1);
                                                                    setPendingQty((prev) => ({ ...prev, [p.id]: v }));
                                                                }}
                                                                className="flex-1 min-w-0 text-center text-xs font-bold outline-none"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => setPendingQty((prev) => ({ ...prev, [p.id]: getPendingQty(p.id) + 1 }))}
                                                                className="w-7 bg-slate-50 text-slate-700 font-bold"
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => addToCart(p)}
                                                        disabled={added}
                                                        className={`w-full text-xs font-bold py-2 rounded-lg border transition flex items-center justify-center gap-1.5 ${
                                                            added
                                                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 cursor-default'
                                                                : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-900 hover:text-white hover:border-slate-900'
                                                        }`}
                                                    >
                                                        {added ? (
                                                            <>
                                                                <Check className="w-3.5 h-3.5" /> En el carrito
                                                            </>
                                                        ) : (
                                                            'Agregar'
                                                        )}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Carrito lateral */}
                    <aside className="sticky top-6 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col max-h-[calc(100vh-48px)]">
                        <div className="px-4 pt-4 pb-3 border-b border-slate-100">
                            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <ShoppingCart className="w-4 h-4" /> Carrito para el cliente
                            </h2>
                            <p className="text-[11px] text-slate-500 mt-0.5">Estos productos son los que verá al abrir el enlace.</p>
                        </div>

                        <div className="flex-1 overflow-y-auto px-3 py-2">
                            {cartLines.length === 0 ? (
                                <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                                    <ShoppingCart className="w-7 h-7 text-slate-300" />
                                    <p className="text-xs text-slate-400 max-w-[20ch]">Todavía no has agregado productos.</p>
                                </div>
                            ) : (
                                cartLines.map(({ product, quantity }) => (
                                    <div key={product.id} className="flex items-center gap-2.5 py-2 border-b border-slate-100 last:border-b-0">
                                        <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 overflow-hidden">
                                            {product.main_image_url ? (
                                                <img src={product.main_image_url} alt={product.name} className="w-full h-full object-contain" />
                                            ) : (
                                                <Package className="w-4 h-4 text-slate-300" />
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[11.5px] font-bold text-slate-800 truncate">{product.name}</p>
                                            <p className="text-[10.5px] text-slate-500 tabular-nums">
                                                {money(effectivePrice(product))} c/u · {money(effectivePrice(product) * quantity)}
                                            </p>
                                        </div>
                                        <div className="flex items-stretch border border-slate-200 rounded-md overflow-hidden h-[24px] shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => setCartQuantity(product.id, Math.max(1, quantity - 1))}
                                                disabled={quantity <= 1}
                                                className="w-5 text-[11px] font-bold bg-slate-50 disabled:opacity-30"
                                            >
                                                −
                                            </button>
                                            <span className="w-6 text-[10.5px] font-bold flex items-center justify-center">{quantity}</span>
                                            <button
                                                type="button"
                                                onClick={() => setCartQuantity(product.id, Math.min(product.stock_quantity || quantity + 1, quantity + 1))}
                                                className="w-5 text-[11px] font-bold bg-slate-50"
                                            >
                                                +
                                            </button>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeFromCart(product.id)}
                                            aria-label="Quitar"
                                            className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-600"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="px-4 pt-3 pb-4 border-t border-slate-100">
                            <div className="flex justify-between text-xs text-slate-500 mb-2.5">
                                <span>Unidades agregadas</span>
                                <b className="text-slate-900 tabular-nums">{totalUnits}</b>
                            </div>
                            {canEdit && (
                                <button
                                    type="button"
                                    onClick={handleGenerateLink}
                                    disabled={cartLines.length === 0 || generating}
                                    className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white text-sm font-bold py-2.5 rounded-xl disabled:opacity-40 hover:bg-slate-800 transition"
                                >
                                    <Link2 className="w-4 h-4" />
                                    {generating ? 'Generando…' : 'Generar enlace'}
                                </button>
                            )}

                            {generatedLink && (
                                <div className="mt-3 space-y-1.5">
                                    <p className="text-[10.5px] text-slate-500 flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> Válido por 24 horas
                                    </p>
                                    <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
                                        <input
                                            readOnly
                                            value={generatedLink}
                                            className="flex-1 min-w-0 bg-transparent text-[10.5px] text-slate-600 font-mono outline-none"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleCopy}
                                            className={`shrink-0 flex items-center gap-1 text-[10.5px] font-bold px-2 py-1 rounded-md ${
                                                copied ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200 text-slate-700'
                                            }`}
                                        >
                                            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                            {copied ? 'Copiado' : 'Copiar'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </aside>
                </div>
            </div>
        </PermissionGate>
    );
}
