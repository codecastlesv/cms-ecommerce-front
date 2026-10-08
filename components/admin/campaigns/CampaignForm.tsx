'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Upload, Copy, Check, Plus, Loader2, Save, Mail, Link2 } from 'lucide-react';
import { FaInstagram, FaFacebook, FaWhatsapp } from 'react-icons/fa';
import { FaTiktok } from 'react-icons/fa6';
import { toast } from 'sonner';
import api from '@/lib/axios';
import { handleError } from '@/lib/errorHandler';
import PermissionGate from '@/components/auth/PermissionGate';

interface AdminProduct {
    id: number;
    name: string;
    sku: string;
    price_regular: number;
    price_sale?: number | null;
    main_image_url?: string | null;
}

interface CampaignLinkRow {
    id: number;
    channel: string | null;
    label: string | null;
    code: string;
    utm_source: string | null;
    utm_medium: string | null;
}

const CHANNEL_LABELS: Record<string, string> = {
    instagram: 'Instagram',
    facebook: 'Facebook',
    tiktok: 'TikTok',
    whatsapp: 'WhatsApp',
    email: 'Email',
    directo: 'Directo / Sitio web',
};

const CHANNEL_ICONS: Record<string, React.ReactNode> = {
    instagram: <FaInstagram className="w-4 h-4" />,
    facebook: <FaFacebook className="w-4 h-4" />,
    tiktok: <FaTiktok className="w-4 h-4" />,
    whatsapp: <FaWhatsapp className="w-4 h-4" />,
    email: <Mail className="w-4 h-4" />,
    directo: <Link2 className="w-4 h-4" />,
};

const CHANNEL_COLORS: Record<string, string> = {
    instagram: 'bg-[#C1306C]/10 text-[#C1306C]',
    facebook: 'bg-[#1877F2]/10 text-[#1877F2]',
    tiktok: 'bg-slate-900/10 text-slate-900',
    whatsapp: 'bg-[#25D366]/10 text-[#25D366]',
    email: 'bg-amber-500/10 text-amber-700',
    directo: 'bg-[#304C94]/10 text-[#304C94]',
};

function slugify(value: string): string {
    return value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

function toDateInputValue(value: string | null): string {
    if (!value) return '';
    return value.slice(0, 10);
}

export default function CampaignForm({ mode, campaignId }: { mode: 'create' | 'edit'; campaignId?: number }) {
    const router = useRouter();

    const [name, setName] = useState('');
    const [promoTitle, setPromoTitle] = useState('');
    const [promoDescription, setPromoDescription] = useState('');
    const [startsAt, setStartsAt] = useState('');
    const [endsAt, setEndsAt] = useState('');
    const [bannerFile, setBannerFile] = useState<File | null>(null);
    const [bannerPreview, setBannerPreview] = useState<string | null>(null);

    const [ogTitle, setOgTitle] = useState('');
    const [ogDescription, setOgDescription] = useState('');
    const [ogImageFile, setOgImageFile] = useState<File | null>(null);
    const [ogImagePreview, setOgImagePreview] = useState<string | null>(null);

    const [selectedProducts, setSelectedProducts] = useState<AdminProduct[]>([]);
    const [productQuery, setProductQuery] = useState('');
    const [productResults, setProductResults] = useState<AdminProduct[]>([]);
    const [searchingProducts, setSearchingProducts] = useState(false);
    const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
    const nameDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [links, setLinks] = useState<CampaignLinkRow[]>([]);
    const [showManualLinkForm, setShowManualLinkForm] = useState(false);
    const [manualLabel, setManualLabel] = useState('');
    const [manualMedium, setManualMedium] = useState('social');
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    const [loading, setLoading] = useState(mode === 'edit');
    const [saving, setSaving] = useState(false);

    // Carga de campaña existente (modo edición)
    useEffect(() => {
        if (mode !== 'edit' || !campaignId) return;
        api.get(`/admin/campaigns/${campaignId}`).then(({ data }) => {
            setName(data.name);
            setPromoTitle(data.promo_title || '');
            setPromoDescription(data.promo_description || '');
            setStartsAt(toDateInputValue(data.starts_at));
            setEndsAt(toDateInputValue(data.ends_at));
            setOgTitle(data.og_title || '');
            setOgDescription(data.og_description || '');
            if (data.banner_image_url) setBannerPreview(data.banner_image_url);
            if (data.og_image_url) setOgImagePreview(data.og_image_url);
            setSelectedProducts(
                (data.products || []).map((p: { id: number; name: string; sku: string; price_regular: number; price_sale: number | null; main_image_url: string | null }) => ({
                    id: p.id,
                    name: p.name,
                    sku: p.sku,
                    price_regular: p.price_regular,
                    price_sale: p.price_sale,
                    main_image_url: p.main_image_url,
                }))
            );
            setLinks(data.links || []);
            setLoading(false);
        }).catch(() => {
            toast.error('No se pudo cargar la campaña');
            setLoading(false);
        });
    }, [mode, campaignId]);

    // Vista previa de la URL (solo creación — el slug nunca se edita después)
    const slugPreview = useMemo(() => slugify(name), [name]);

    // Aviso de nombre duplicado (no bloqueante)
    useEffect(() => {
        if (mode !== 'create') return;
        if (nameDebounce.current) clearTimeout(nameDebounce.current);
        if (!name.trim()) {
            setDuplicateWarning(null);
            return;
        }
        nameDebounce.current = setTimeout(async () => {
            try {
                const { data } = await api.get('/admin/campaigns/check-name', { params: { name: name.trim() } });
                if (data.exists) {
                    setDuplicateWarning(
                        data.is_active
                            ? 'Ya hay una campaña activa con este nombre — puedes seguir, pero la URL se diferenciará con un sufijo.'
                            : 'Ya existe una campaña con este nombre, pero está inactiva — se creará con una URL ligeramente distinta.'
                    );
                } else {
                    setDuplicateWarning(null);
                }
            } catch {
                /* silencioso: es solo una advertencia informativa */
            }
        }, 400);
        return () => {
            if (nameDebounce.current) clearTimeout(nameDebounce.current);
        };
    }, [name, mode]);

    // Búsqueda de productos (por nombre o SKU)
    useEffect(() => {
        if (searchDebounce.current) clearTimeout(searchDebounce.current);
        if (!productQuery.trim()) {
            setProductResults([]);
            return;
        }
        searchDebounce.current = setTimeout(async () => {
            setSearchingProducts(true);
            try {
                const { data } = await api.get('/admin/products', { params: { search: productQuery.trim(), per_page: 10 } });
                setProductResults(data.data || []);
            } catch {
                setProductResults([]);
            } finally {
                setSearchingProducts(false);
            }
        }, 300);
        return () => {
            if (searchDebounce.current) clearTimeout(searchDebounce.current);
        };
    }, [productQuery]);

    const addProduct = (p: AdminProduct) => {
        if (selectedProducts.some((sp) => sp.id === p.id)) return;
        setSelectedProducts((prev) => [...prev, p]);
        setProductQuery('');
        setProductResults([]);
    };

    const removeProduct = (id: number) => {
        setSelectedProducts((prev) => prev.filter((p) => p.id !== id));
    };

    const handleFile = (kind: 'banner' | 'og', e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        if (kind === 'banner') {
            setBannerFile(file);
            setBannerPreview(url);
        } else {
            setOgImageFile(file);
            setOgImagePreview(url);
        }
    };

    const copyLink = async (code: string) => {
        const url = `${window.location.origin}/c/${code}`;
        try {
            await navigator.clipboard.writeText(url);
        } catch {
            const ta = document.createElement('textarea');
            ta.value = url;
            document.body.appendChild(ta);
            ta.select();
            try { document.execCommand('copy'); } catch { /* noop */ }
            document.body.removeChild(ta);
        }
        setCopiedCode(code);
        toast.success('Enlace copiado: ' + url);
        setTimeout(() => setCopiedCode(null), 1500);
    };

    const addManualLink = async () => {
        if (!campaignId || !manualLabel.trim()) return;
        try {
            const { data } = await api.post(`/admin/campaigns/${campaignId}/links`, {
                label: manualLabel.trim(),
                utm_medium: manualMedium.trim() || undefined,
            });
            setLinks((prev) => [...prev, data.data]);
            setManualLabel('');
            setShowManualLinkForm(false);
            toast.success('Enlace agregado');
        } catch (error) {
            toast.error(handleError(error, 'No se pudo agregar el enlace'));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        const form = new FormData();
        form.append('name', name);
        form.append('promo_title', promoTitle);
        form.append('promo_description', promoDescription);
        if (startsAt) form.append('starts_at', startsAt);
        if (endsAt) form.append('ends_at', endsAt);
        form.append('og_title', ogTitle);
        form.append('og_description', ogDescription);
        if (bannerFile) form.append('banner', bannerFile);
        if (ogImageFile) form.append('og_image', ogImageFile);
        selectedProducts.forEach((p) => form.append('products[]', String(p.id)));

        try {
            if (mode === 'create') {
                const { data } = await api.post('/admin/campaigns', form, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                toast.success('Campaña creada');
                router.push(`/campaigns/${data.data.id}`);
            } else {
                form.append('_method', 'PUT');
                await api.post(`/admin/campaigns/${campaignId}`, form, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                toast.success('Campaña actualizada');
                router.push('/campaigns');
            }
        } catch (error) {
            toast.error(handleError(error, 'No se pudo guardar la campaña'));
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-20 text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin" />
            </div>
        );
    }

    return (
        <PermissionGate permission="edit_campaigns">
            <form onSubmit={handleSubmit} className="max-w-5xl mx-auto p-6 pb-24 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            {mode === 'create' ? 'Nueva Campaña' : name || 'Editar campaña'}
                        </h1>
                        <p className="text-sm text-slate-500">Contenido del landing, Open Graph y enlaces de la campaña.</p>
                    </div>
                    <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Guardar cambios
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-6 items-start">
                    {/* Columna izquierda: contenido + OG + productos */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
                            <p className="text-sm font-extrabold text-slate-900">1. Contenido del landing</p>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">Nombre de la campaña</label>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 ring-slate-900"
                                    placeholder="Ej. CyberWeek 2026"
                                />
                                {mode === 'create' && name.trim() ? (
                                    <p className="mt-1.5 text-[11px] text-slate-500">
                                        URL del landing: <span className="font-mono">/promos/{slugPreview || '—'}</span>
                                    </p>
                                ) : null}
                                {duplicateWarning ? (
                                    <p className="mt-1.5 text-[11px] font-medium text-amber-700">{duplicateWarning}</p>
                                ) : null}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    Banner <span className="font-normal text-slate-400">(recomendado 1920×640px)</span>
                                </label>
                                <div className="relative border-2 border-dashed border-slate-300 rounded-xl overflow-hidden bg-slate-50 hover:border-slate-400 transition-colors h-36 group">
                                    {bannerPreview ? (
                                        <img src={bannerPreview} className="w-full h-full object-cover" alt="" />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                            <Upload className="w-6 h-6 mb-1 opacity-50" />
                                            <span className="text-xs font-medium">Click para subir</span>
                                        </div>
                                    )}
                                    <input type="file" accept="image/*" onChange={(e) => handleFile('banner', e)} className="absolute inset-0 opacity-0 cursor-pointer" />
                                </div>
                                <p className="mt-1.5 text-[11px] text-slate-400">
                                    Se recorta para llenar el ancho de pantalla — el centro siempre se ve, los bordes pueden recortarse.
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">Título de la promo</label>
                                <input
                                    type="text"
                                    value={promoTitle}
                                    onChange={(e) => setPromoTitle(e.target.value)}
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 ring-slate-900"
                                    placeholder="Ej. Hasta 40% OFF en herramientas eléctricas"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">Descripción</label>
                                <textarea
                                    value={promoDescription}
                                    onChange={(e) => setPromoDescription(e.target.value)}
                                    rows={3}
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 ring-slate-900 resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Fecha de inicio</label>
                                    <input
                                        type="date"
                                        value={startsAt}
                                        onChange={(e) => setStartsAt(e.target.value)}
                                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 ring-slate-900"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Fecha de fin</label>
                                    <input
                                        type="date"
                                        value={endsAt}
                                        onChange={(e) => setEndsAt(e.target.value)}
                                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 ring-slate-900"
                                    />
                                </div>
                            </div>
                            <p className="text-[11px] text-slate-400">Estas fechas alimentan el temporizador del landing público.</p>
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
                            <p className="text-sm font-extrabold text-slate-900">2. Open Graph <span className="font-normal text-slate-400">(vista previa al compartir)</span></p>
                            <p className="text-[11.5px] text-slate-500 leading-relaxed">
                                Independiente del Open Graph genérico del sitio. Los campos vacíos usan el título/descripción/banner de arriba.
                            </p>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">Título para compartir <span className="font-normal text-slate-400">(opcional)</span></label>
                                <input
                                    type="text"
                                    value={ogTitle}
                                    onChange={(e) => setOgTitle(e.target.value)}
                                    placeholder="Igual al título de la promo si se deja vacío"
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 ring-slate-900"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">Descripción para compartir <span className="font-normal text-slate-400">(opcional)</span></label>
                                <textarea
                                    value={ogDescription}
                                    onChange={(e) => setOgDescription(e.target.value)}
                                    rows={2}
                                    placeholder="Igual a la descripción de la promo si se deja vacío"
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 ring-slate-900 resize-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">Imagen para compartir <span className="font-normal text-slate-400">(opcional, 1200×630)</span></label>
                                <div className="relative border-2 border-dashed border-slate-300 rounded-xl overflow-hidden bg-slate-50 h-24">
                                    {ogImagePreview ? (
                                        <img src={ogImagePreview} className="w-full h-full object-cover" alt="" />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full text-slate-400 text-[11px]">
                                            Si se deja vacío, se usa el banner principal
                                        </div>
                                    )}
                                    <input type="file" accept="image/*" onChange={(e) => handleFile('og', e)} className="absolute inset-0 opacity-0 cursor-pointer" />
                                </div>
                            </div>

                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-2">Así se vería al compartirlo</p>
                                <div className="flex border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                                    <div className="w-20 h-20 flex-shrink-0 bg-gradient-to-br from-[#304C94] to-[#08204E]">
                                        {(ogImagePreview || bannerPreview) ? (
                                            <img src={ogImagePreview || bannerPreview || ''} className="w-full h-full object-cover" alt="" />
                                        ) : null}
                                    </div>
                                    <div className="px-3 py-2 min-w-0">
                                        <p className="text-[9.5px] font-bold text-slate-400">CASTELLASAGARRA.COM</p>
                                        <p className="text-[12.5px] font-bold text-slate-900 line-clamp-2">{ogTitle || promoTitle || 'Título de la promo'}</p>
                                        <p className="text-[11px] text-slate-500 line-clamp-2">{ogDescription || promoDescription || 'Descripción de la promo'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
                            <p className="text-sm font-extrabold text-slate-900">
                                3. Productos de la campaña <span className="font-normal text-slate-400">({selectedProducts.length} seleccionados)</span>
                            </p>
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    value={productQuery}
                                    onChange={(e) => setProductQuery(e.target.value)}
                                    placeholder="Buscar por nombre o SKU…"
                                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 ring-slate-900"
                                />
                                {searchingProducts ? <Loader2 className="absolute right-3 top-2.5 w-4 h-4 text-slate-400 animate-spin" /> : null}
                            </div>

                            {productResults.length > 0 ? (
                                <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-56 overflow-y-auto">
                                    {productResults.map((p) => (
                                        <button
                                            type="button"
                                            key={p.id}
                                            onClick={() => addProduct(p)}
                                            className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-slate-50"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-semibold text-slate-900 truncate">{p.name}</p>
                                                <p className="text-[10.5px] text-slate-400 font-mono">SKU {p.sku}</p>
                                            </div>
                                            <span className="text-xs text-slate-500">${Number(p.price_sale || p.price_regular).toFixed(2)}</span>
                                        </button>
                                    ))}
                                </div>
                            ) : null}

                            <div className="space-y-1">
                                {selectedProducts.map((p) => (
                                    <div key={p.id} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-50">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-slate-900 truncate">{p.name}</p>
                                            <p className="text-[10.5px] text-slate-400 font-mono">SKU {p.sku}</p>
                                        </div>
                                        <span className="text-xs text-slate-500">${Number(p.price_sale || p.price_regular).toFixed(2)}</span>
                                        <button type="button" onClick={() => removeProduct(p.id)} className="text-slate-300 hover:text-red-600">✕</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Columna derecha: enlaces */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-2.5">
                        <p className="text-sm font-extrabold text-slate-900 mb-1">4. Enlaces de la campaña</p>

                        {mode === 'create' ? (
                            <p className="text-xs text-slate-400">Los 6 enlaces se generan automáticamente al guardar la campaña.</p>
                        ) : (
                            <>
                                {links.map((link) => (
                                    <div key={link.id} className="flex items-center gap-2.5 border border-slate-200 rounded-xl px-3 py-2.5">
                                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${link.channel ? CHANNEL_COLORS[link.channel] : 'bg-slate-100 text-slate-500'}`}>
                                            {link.channel ? CHANNEL_ICONS[link.channel] : <Link2 className="w-4 h-4" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-slate-900">
                                                {link.channel ? CHANNEL_LABELS[link.channel] : link.label}
                                            </p>
                                            <p className="text-[10.5px] text-slate-400 font-mono truncate">
                                                {link.utm_source ? `utm_source=${link.utm_source}` : 'sin UTM — código legible'}
                                            </p>
                                        </div>
                                        <span className="text-[11px] font-mono bg-slate-100 text-slate-700 px-2 py-1 rounded whitespace-nowrap">/c/{link.code}</span>
                                        <button
                                            type="button"
                                            onClick={() => copyLink(link.code)}
                                            className={`border rounded-lg p-1.5 ${copiedCode === link.code ? 'border-green-200 bg-green-50 text-green-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                                        >
                                            {copiedCode === link.code ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                        </button>
                                    </div>
                                ))}

                                {showManualLinkForm ? (
                                    <div className="border border-[#304C94] bg-[#F5F7FC] rounded-xl p-3 space-y-2">
                                        <div className="grid grid-cols-2 gap-2">
                                            <input
                                                type="text"
                                                value={manualLabel}
                                                onChange={(e) => setManualLabel(e.target.value)}
                                                placeholder="Nombre (ej. Pinterest)"
                                                className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none"
                                            />
                                            <input
                                                type="text"
                                                value={manualMedium}
                                                onChange={(e) => setManualMedium(e.target.value)}
                                                placeholder="Medio (ej. social)"
                                                className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none"
                                            />
                                        </div>
                                        <p className="text-[10.5px] text-slate-500 font-mono">
                                            se guardará como: utm_source={slugify(manualLabel) || '—'}
                                        </p>
                                        <div className="flex justify-end gap-2">
                                            <button type="button" onClick={() => setShowManualLinkForm(false)} className="text-xs font-bold text-slate-500 px-2 py-1">Cancelar</button>
                                            <button type="button" onClick={addManualLink} className="text-xs font-bold text-white bg-[#08204E] rounded-lg px-3 py-1.5">Agregar</button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => setShowManualLinkForm(true)}
                                        className="w-full border-2 border-dashed border-slate-200 rounded-xl py-2.5 text-xs font-bold text-[#304C94] hover:bg-[#F5F7FC] flex items-center justify-center gap-1.5"
                                    >
                                        <Plus className="w-3.5 h-3.5" /> Agregar enlace manual
                                    </button>
                                )}

                                <div className="flex gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-800 leading-relaxed mt-3">
                                    Los clics y el comportamiento de cada enlace se ven en Google Analytics, filtrando por <code>utm_campaign={slugPreview}</code>.
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </form>
        </PermissionGate>
    );
}
