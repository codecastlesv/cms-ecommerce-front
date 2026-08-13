'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { ArrowLeft, Save, Image as ImageIcon, Smartphone, Monitor, Lock, Type } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { usePermission } from '@/hooks/usePermission';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const bannerSchema = z.object({
    title: z.string().min(3, "El título es requerido"),
    headline: z.string().optional().nullable(),
    subheadline: z.string().optional().nullable(),
    cta_text: z.string().optional().nullable(),
    cta_url: z.string().optional().nullable(),
    bg_color: z.string().optional().nullable(),
    alt_text: z.string().optional().nullable(),
    is_active: z.boolean(),
    open_in_new_tab: z.boolean(),
});

type BannerFormData = z.infer<typeof bannerSchema>;

export default function BannerForm({ bannerId }: { bannerId?: string }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const [desktopPreview, setDesktopPreview] = useState<string | null>(null);
    const [mobilePreview, setMobilePreview] = useState<string | null>(null);
    const [desktopFile, setDesktopFile] = useState<File | null>(null);
    const [mobileFile, setMobileFile] = useState<File | null>(null);

    const { can } = usePermission();
    const hasPermission = bannerId ? can('edit_banners') : can('create_banners');

    const { register, handleSubmit, formState: { errors }, reset } = useForm<BannerFormData>({
        resolver: zodResolver(bannerSchema),
        defaultValues: {
            title: '',
            headline: '',
            subheadline: '',
            cta_text: '',
            cta_url: '',
            bg_color: '#ffffff',
            alt_text: '',
            is_active: true,
            open_in_new_tab: false
        }
    });

    useEffect(() => {
        if (bannerId) {
            const loadData = async () => {
                try {
                    const response = await api.get(`/admin/banners/${bannerId}`);
                    const banner = response.data.data;

                    reset({
                        title: banner.title,
                        headline: banner.headline || '',
                        subheadline: banner.subheadline || '',
                        cta_text: banner.cta?.text || '',
                        cta_url: banner.cta?.url || '',
                        bg_color: banner.style?.bg_color || '',
                        alt_text: banner.images?.alt || '',
                        is_active: banner.is_active,
                        open_in_new_tab: banner.cta?.new_tab,
                    });

                    if (banner.images?.desktop) setDesktopPreview(banner.images.desktop);
                    if (banner.images?.mobile) setMobilePreview(banner.images.mobile);

                } catch (error) {
                    console.error(error);
                    toast.error("Error cargando el banner");
                    router.push('/banners');
                }
            };
            loadData();
        }
    }, [bannerId, reset, router]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'desktop' | 'mobile') => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            if (type === 'desktop') {
                setDesktopFile(file);
                setDesktopPreview(url);
            } else {
                setMobileFile(file);
                setMobilePreview(url);
            }
        }
    };

    const onSubmit = async (data: BannerFormData) => {
        if (!hasPermission) return;

        if (!bannerId && !desktopFile) {
            toast.error("La imagen de escritorio es obligatoria para crear un nuevo banner");
            return;
        }

        setLoading(true);
        const formData = new FormData();

        formData.append('title', data.title);
        if (data.headline) formData.append('headline', data.headline);
        if (data.subheadline) formData.append('subheadline', data.subheadline);
        if (data.cta_text) formData.append('cta_text', data.cta_text);
        if (data.cta_url) formData.append('cta_url', data.cta_url);
        if (data.bg_color) formData.append('bg_color', data.bg_color);
        if (data.alt_text) formData.append('alt_text', data.alt_text);

        formData.append('is_active', data.is_active ? '1' : '0');
        formData.append('open_in_new_tab', data.open_in_new_tab ? '1' : '0');

        if (desktopFile) formData.append('image', desktopFile);
        if (mobileFile) formData.append('image_mobile', mobileFile);

        try {
            if (bannerId) {
                formData.append('_method', 'PUT');
                await api.post(`/admin/banners/${bannerId}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                await api.post('/admin/banners', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }
            toast.success('Banner guardado exitosamente');
            router.push('/banners');
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Error al guardar');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-5xl mx-auto p-6 pb-20">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button type="button" onClick={() => router.back()} className="p-2 hover:bg-white rounded-full transition"><ArrowLeft className="w-5 h-5" /></button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">{bannerId ? 'Editar Banner' : 'Nuevo Banner'}</h1>
                        {!hasPermission && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 mt-1 text-xs font-bold text-orange-700 bg-orange-100 rounded-md">
                                <Lock className="w-3 h-3" /> Solo Lectura
                            </span>
                        )}
                    </div>
                </div>
                {hasPermission && (
                    <button type="submit" disabled={loading} className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-slate-800 flex items-center shadow-lg disabled:opacity-50 text-sm transition">
                        <Save className="w-4 h-4 mr-2" /> {loading ? 'Guardando...' : 'Guardar'}
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                <div className="lg:col-span-2 space-y-6">
                    <Card className="p-6 space-y-4">
                        <h3 className="font-bold text-slate-800 border-b pb-2 mb-4">Información Principal</h3>

                        <Input
                            label="Título Interno (Referencia)"
                            placeholder="Ej: Promo Verano 2024"
                            registration={register('title')}
                            error={errors.title?.message}
                            disabled={!hasPermission}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Titular (Visible)"
                                placeholder="Ej: ¡Descuentos de Locura!"
                                registration={register('headline')}
                                disabled={!hasPermission}
                            />
                            <Input
                                label="Subtítulo"
                                placeholder="Ej: Hasta 50% OFF en Running"
                                registration={register('subheadline')}
                                disabled={!hasPermission}
                            />
                        </div>
                    </Card>

                    <Card className="p-6 space-y-4">
                        <h3 className="font-bold text-slate-800 border-b pb-2 mb-4">Llamada a la Acción (CTA)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Texto del Botón"
                                placeholder="Ej: Comprar Ahora"
                                registration={register('cta_text')}
                                disabled={!hasPermission}
                            />
                            <Input
                                label="Enlace de Destino (URL)"
                                placeholder="Ej: /coleccion/running"
                                registration={register('cta_url')}
                                disabled={!hasPermission}
                            />
                        </div>

                        <div className="flex items-center gap-2 mt-2">
                            <input
                                type="checkbox"
                                id="new_tab"
                                className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900"
                                {...register('open_in_new_tab')}
                                disabled={!hasPermission}
                            />
                            <label htmlFor="new_tab" className="text-sm text-slate-600">Abrir en nueva pestaña</label>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <h3 className="font-bold text-slate-800 border-b pb-2 mb-4">Configuración Visual</h3>
                        <div className="space-y-4">
                            <Input
                                type="color"
                                label="Color de Fondo (Opcional)"
                                registration={register('bg_color')}
                                disabled={!hasPermission}
                            />

                            <div className="flex items-center justify-between border-t pt-4">
                                <div>
                                    <span className="block font-medium text-slate-900">Estado Activo</span>
                                    <span className="text-xs text-slate-500">Desactívalo para ocultar el banner en todo el sitio.</span>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" {...register('is_active')} disabled={!hasPermission} />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-slate-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
                                </label>
                            </div>
                        </div>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="p-6">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Monitor className="w-4 h-4" /> Imagen Escritorio
                        </h3>

                        <div className="aspect-video bg-slate-100 rounded-lg border-2 border-dashed border-slate-300 relative overflow-hidden group">
                            {desktopPreview ? (
                                <img src={desktopPreview} alt="Preview Desktop" className="w-full h-full object-cover" />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                    <ImageIcon className="w-8 h-8 mb-2" />
                                    <span className="text-xs">Sin imagen</span>
                                </div>
                            )}

                            {hasPermission && (
                                <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer text-white font-bold text-sm">
                                    Cambiar Imagen
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => handleFileChange(e, 'desktop')}
                                    />
                                </label>
                            )}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2 text-center">Recomendado: 1920x600px | Max: 5MB</p>

                        <div className="mt-6 border-t pt-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Type className="w-4 h-4 text-slate-500" />
                                <span className="text-xs font-bold text-slate-700">SEO: Texto Alternativo</span>
                            </div>
                            <Input
                                label="Texto Alternativo (SEO)"
                                placeholder="Descripción de la imagen..."
                                registration={register('alt_text')}
                                disabled={!hasPermission}
                            />
                            <p className="text-[10px] text-slate-400 mt-1">Importante para accesibilidad y Google.</p>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Smartphone className="w-4 h-4" /> Imagen Móvil
                        </h3>

                        <div className="aspect-[4/5] bg-slate-100 rounded-lg border-2 border-dashed border-slate-300 relative overflow-hidden group w-2/3 mx-auto">
                            {mobilePreview ? (
                                <img src={mobilePreview} alt="Preview Mobile" className="w-full h-full object-cover" />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                    <ImageIcon className="w-8 h-8 mb-2" />
                                    <span className="text-xs">Opcional</span>
                                </div>
                            )}

                            {hasPermission && (
                                <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer text-white font-bold text-sm">
                                    Cambiar Imagen
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => handleFileChange(e, 'mobile')}
                                    />
                                </label>
                            )}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2 text-center">Recomendado: 800x1000px</p>
                    </Card>
                </div>
            </div>
        </form>
    );
}