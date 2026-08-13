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
import { LaravelResource, Brand } from '@/types';
import { handleError } from '@/lib/errorHandler';
import { useCatalog } from '@/components/providers/CatalogContext';

const schema = z.object({
    name: z.string().min(1, "Nombre requerido"),
    slug: z.string().optional(),
    description: z.string().optional(),
    is_featured: z.boolean(),

    seo_title: z.string().max(60).optional(),
    seo_description: z.string().max(160).optional(),
    canonical_url: z.string().url("URL inválida").optional().or(z.literal('')),
    robots_index: z.boolean(),
    robots_follow: z.boolean(),
});

type FormData = z.infer<typeof schema>;

interface BrandFormProps {
    brandId?: string;
}

interface FileState {
    logo: File | null;
    og_image: File | null;
}

interface PreviewState {
    logo: string | null;
    og_image: string | null;
}

export default function BrandForm({ brandId }: BrandFormProps) {
    const { refreshCatalog } = useCatalog();
    const router = useRouter();
    const { can } = usePermission();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'general' | 'seo'>('general');

    const hasPermission = brandId ? can('edit_brands') : can('create_brands');
    const requiredPermission = brandId ? 'edit_brands' : 'create_brands';

    const [files, setFiles] = useState<FileState>({ logo: null, og_image: null });
    const [previews, setPreviews] = useState<PreviewState>({ logo: null, og_image: null });

    const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: { is_featured: false, robots_index: true, robots_follow: true }
    });

    useEffect(() => {
        let isMounted = true;
        if (brandId) {
            const fetchBrand = async () => {
                try {
                    const { data } = await api.get<LaravelResource<Brand>>(`/admin/brands/${brandId}`);
                    if (!isMounted) return;

                    const b = data.data;
                    reset({
                        name: b.name,
                        slug: b.slug,
                        description: b.description || '',
                        is_featured: b.is_featured,
                        seo_title: b.seo?.title || '',
                        seo_description: b.seo?.description || '',
                        canonical_url: b.seo?.canonical_url || '',
                        robots_index: !!b.seo?.robots_index,
                        robots_follow: !!b.seo?.robots_follow,
                    });

                    setPreviews({
                        logo: b.logo,
                        og_image: b.seo?.og_image || null
                    });
                } catch (error) {
                    if (isMounted) {
                        toast.error(handleError(error, 'Cargar Marca'));
                    }
                }
            };
            fetchBrand();
        }
        return () => { isMounted = false; };
    }, [brandId, reset]);

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

        if (files.logo) formData.append('logo', files.logo);
        if (files.og_image) formData.append('og_image', files.og_image);

        if (brandId) formData.append('_method', 'PUT');

        try {
            const url = brandId ? `/admin/brands/${brandId}` : '/admin/brands';
            const config = { headers: { 'Content-Type': 'multipart/form-data' } };

            await api.post(url, formData, config);

            await refreshCatalog();
            toast.success(brandId ? 'Marca actualizada' : 'Marca creada');
            router.push('/brands');
        } catch (e) {
            toast.error(handleError(e, 'Guardar Marca'));
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
                        <h1 className="text-2xl font-bold text-slate-900">{brandId ? 'Editar Marca' : 'Nueva Marca'}</h1>
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
                                <Input label="Nombre de la Marca" registration={register('name')} error={errors.name?.message} disabled={!hasPermission} />
                                <Input label="Slug (URL)" placeholder="Automático" registration={register('slug')} disabled={!hasPermission} />

                                <div>
                                    <label className="text-xs font-bold text-slate-700 block mb-1">Descripción</label>
                                    <textarea {...register('description')} disabled={!hasPermission} rows={3} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 ring-slate-900 outline-none resize-none disabled:bg-slate-100"></textarea>
                                </div>

                                <div className="grid grid-cols-2 gap-6 pt-2">
                                    <ImageUpload label="Logo de la Marca" preview={previews.logo} onChange={(e) => handleFile('logo', e)} disabled={!hasPermission} />
                                    <div className="flex items-center pt-6">
                                        <label className="flex items-center gap-2 cursor-pointer select-none">
                                            <input type="checkbox" {...register('is_featured')} disabled={!hasPermission} className="rounded text-slate-900 focus:ring-slate-900" />
                                            <span className="text-sm font-bold text-slate-700">Marca Destacada</span>
                                        </label>
                                    </div>
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
                                    <textarea {...register('seo_description')} disabled={!hasPermission} rows={2} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 ring-slate-900 outline-none resize-none disabled:bg-slate-100"></textarea>
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
}

function ImageUpload({ label, preview, onChange, disabled }: ImageUploadProps) {
    return (
        <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">{label}</label>
            <div className="relative border-2 border-dashed border-slate-300 rounded-xl overflow-hidden bg-slate-50 hover:border-slate-400 transition-colors aspect-square w-32 group">
                {preview ? (
                    <img src={preview} alt={label} className="w-full h-full object-contain p-2" />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                        <Upload className="w-6 h-6 mb-1" />
                        <span className="text-[10px] font-bold">Subir</span>
                    </div>
                )}
                {!disabled && <input type="file" accept="image/*" onChange={onChange} className="absolute inset-0 opacity-0 cursor-pointer" />}

                {preview && !disabled && (
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                        <span className="text-white text-[10px] font-bold">Cambiar</span>
                    </div>
                )}
            </div>
        </div>
    );
}