'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { ArrowLeft, Save, Upload, Info } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import PermissionGate from '@/components/auth/PermissionGate';
import { usePermission } from '@/hooks/usePermission';
import { LaravelResource, Sport } from '@/types';
import { handleError } from '@/lib/errorHandler';
import { useCatalog } from '@/components/providers/CatalogContext';

const schema = z.object({
    name: z.string().min(1, "Requerido"),
    slug: z.string().optional(),
    sort_order: z.string().optional(),
    is_featured: z.boolean(),

    seo_title: z.string().max(60).optional(),
    seo_description: z.string().max(160).optional(),
    canonical_url: z.string().url("URL inválida").optional().or(z.literal('')),
    robots_index: z.boolean(),
    robots_follow: z.boolean(),
});

type FormData = z.infer<typeof schema>;

interface SportFormProps {
    sportId?: string;
}

interface FileState {
    icon: File | null;
    image: File | null;
    og_image: File | null;
}

interface PreviewState {
    icon: string | null;
    image: string | null;
    og_image: string | null;
}

export default function SportForm({ sportId }: SportFormProps) {
    const { refreshCatalog } = useCatalog();
    const router = useRouter();
    const { can } = usePermission();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'general' | 'seo'>('general');

    const hasPermission = sportId ? can('edit_sports') : can('create_sports');
    const requiredPermission = sportId ? 'edit_sports' : 'create_sports';

    const [files, setFiles] = useState<FileState>({ icon: null, image: null, og_image: null });
    const [previews, setPreviews] = useState<PreviewState>({ icon: null, image: null, og_image: null });

    const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: { is_featured: false, robots_index: true, robots_follow: true, sort_order: '0' }
    });

    useEffect(() => {
        let isMounted = true;
        if (sportId) {
            const fetchSport = async () => {
                try {
                    const { data } = await api.get<LaravelResource<Sport>>(`/admin/sports/${sportId}`);
                    if (!isMounted) return;

                    const s = data.data;
                    reset({
                        name: s.name,
                        slug: s.slug,
                        sort_order: s.sort_order.toString(),
                        is_featured: s.is_featured,
                        seo_title: s.seo?.title || '',
                        seo_description: s.seo?.description || '',
                        canonical_url: s.seo?.canonical_url || '',
                        robots_index: !!s.seo?.robots_index,
                        robots_follow: !!s.seo?.robots_follow,
                    });

                    setPreviews({
                        icon: s.icon,
                        image: s.image,
                        og_image: s.seo?.og_image || null
                    });
                } catch (error) {
                    if (isMounted) {
                        toast.error(handleError(error, 'Cargar Deporte'));
                    }
                }
            };
            fetchSport();
        }
        return () => { isMounted = false; };
    }, [sportId, reset]);

    const handleFile = (key: keyof FileState, e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const file = e.target.files[0];
            setFiles(prev => ({ ...prev, [key]: file }));
            setPreviews(prev => ({ ...prev, [key]: URL.createObjectURL(file) }));
        }
    };

    const onSubmit = async (data: FormData) => {
        if (!hasPermission) return;
        setLoading(true);

        const formData = new FormData();

        (Object.keys(data) as Array<keyof FormData>).forEach((key) => {
            const val = data[key];
            if (typeof val === 'boolean') {
                formData.append(key, val ? '1' : '0');
            } else if (val !== undefined && val !== null && val !== '') {
                formData.append(key, val as string);
            }
        });

        if (files.icon) formData.append('icon', files.icon);
        if (files.image) formData.append('image', files.image);
        if (files.og_image) formData.append('og_image', files.og_image);

        if (sportId) formData.append('_method', 'PUT');

        try {
            const url = sportId ? `/admin/sports/${sportId}` : '/admin/sports';
            const config = { headers: { 'Content-Type': 'multipart/form-data' } };

            await api.post(url, formData, config);

            await refreshCatalog();
            toast.success(sportId ? 'Deporte actualizado' : 'Deporte creado');
            router.push('/sports');
        } catch (e) {
            toast.error(handleError(e, 'Guardar Deporte'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <PermissionGate permission={requiredPermission}>
            <form onSubmit={handleSubmit(onSubmit)} className="max-w-5xl mx-auto p-6 pb-20">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                        <button type="button" onClick={() => router.back()} className="p-2 hover:bg-white rounded-full transition-colors"><ArrowLeft className="w-5 h-5" /></button>
                        <h1 className="text-2xl font-bold text-slate-900">{sportId ? 'Editar Deporte' : 'Nuevo Deporte'}</h1>
                    </div>
                    {hasPermission && (
                        <button type="submit" disabled={loading} className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold flex items-center hover:bg-slate-800 disabled:opacity-50 shadow-lg active:scale-95 transition-transform">
                            <Save className="w-4 h-4 mr-2" /> {loading ? 'Guardando...' : 'Guardar'}
                        </button>
                    )}
                </div>

                <div className="flex flex-col lg:flex-row gap-6">
                    <div className="flex-1 space-y-6">
                        <div className="flex border-b border-slate-200 mb-2">
                            <button type="button" onClick={() => setActiveTab('general')} className={`px-5 py-2.5 text-sm font-bold border-b-2 transition ${activeTab === 'general' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500'}`}>General</button>
                            <button type="button" onClick={() => setActiveTab('seo')} className={`px-5 py-2.5 text-sm font-bold border-b-2 transition ${activeTab === 'seo' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500'}`}>SEO</button>
                        </div>

                        {activeTab === 'general' && (
                            <Card className="p-6 space-y-5">
                                <Input label="Nombre" registration={register('name')} error={errors.name?.message} disabled={!hasPermission} />
                                <Input label="Slug (URL)" placeholder="Automático" registration={register('slug')} disabled={!hasPermission} />

                                <div className="grid grid-cols-2 gap-4">
                                    <Input label="Orden" type="number" registration={register('sort_order')} disabled={!hasPermission} />
                                    <div className="pt-6">
                                        <label className="flex items-center gap-2 cursor-pointer select-none">
                                            <input type="checkbox" {...register('is_featured')} disabled={!hasPermission} className="rounded text-slate-900 focus:ring-slate-900" />
                                            <span className="text-sm font-bold text-slate-700">Deporte Destacado</span>
                                        </label>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                                    <ImageUpload label="Icono (Pequeño)" preview={previews.icon} onChange={(e) => handleFile('icon', e)} disabled={!hasPermission} />
                                    <ImageUpload label="Banner (Grande)" preview={previews.image} onChange={(e) => handleFile('image', e)} disabled={!hasPermission} wide />
                                </div>
                            </Card>
                        )}

                        {activeTab === 'seo' && (
                            <Card className="p-6 space-y-4">
                                <div className="bg-blue-50 p-3 rounded-lg flex gap-3 text-xs text-blue-700">
                                    <Info className="w-5 h-5 shrink-0" /> Configuración para Google y Redes Sociales.
                                </div>
                                <Input label="Meta Title" registration={register('seo_title')} disabled={!hasPermission} />
                                <Input label="Canonical URL" registration={register('canonical_url')} error={errors.canonical_url?.message} disabled={!hasPermission} />
                                <div>
                                    <label className="text-xs font-bold text-slate-700 block mb-1">Meta Description</label>
                                    <textarea {...register('seo_description')} disabled={!hasPermission} rows={2} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 ring-slate-900 outline-none resize-none"></textarea>
                                </div>
                                <div className="flex gap-6 pt-2">
                                    <label className="flex gap-2 items-center cursor-pointer select-none"><input type="checkbox" {...register('robots_index')} disabled={!hasPermission} className="rounded text-slate-900 focus:ring-slate-900" /> <span className="text-sm">Index</span></label>
                                    <label className="flex gap-2 items-center cursor-pointer select-none"><input type="checkbox" {...register('robots_follow')} disabled={!hasPermission} className="rounded text-slate-900 focus:ring-slate-900" /> <span className="text-sm">Follow</span></label>
                                </div>
                                <div className="pt-4 border-t mt-2">
                                    <ImageUpload label="Imagen Social (OG)" preview={previews.og_image} onChange={(e) => handleFile('og_image', e)} disabled={!hasPermission} />
                                </div>
                            </Card>
                        )}
                    </div>
                </div>
            </form>
        </PermissionGate>
    );
}

interface ImageUploadProps {
    label: string;
    preview: string | null;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    disabled: boolean;
    wide?: boolean;
}

function ImageUpload({ label, preview, onChange, disabled, wide }: ImageUploadProps) {
    return (
        <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">{label}</label>
            <div className={`relative border-2 border-dashed border-slate-300 rounded-xl overflow-hidden bg-slate-50 hover:border-slate-400 transition-colors ${wide ? 'aspect-video w-full' : 'aspect-square w-32'}`}>
                {preview ? (
                    <img src={preview} alt={label} className="w-full h-full object-cover" />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                        <Upload className="w-6 h-6 mb-1" />
                        <span className="text-[10px] font-bold">Subir Imagen</span>
                    </div>
                )}
                {!disabled && <input type="file" accept="image/*" onChange={onChange} className="absolute inset-0 opacity-0 cursor-pointer" />}
            </div>
        </div>
    );
}