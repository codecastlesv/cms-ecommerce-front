'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { ArrowLeft, Save, Image as ImageIcon, Info, Lock } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { usePermission } from '@/hooks/usePermission';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import PermissionGate from '@/components/auth/PermissionGate';
import { Category, LaravelResource } from '@/types';
import { handleError } from '@/lib/errorHandler';
import { useCatalog } from '@/components/providers/CatalogContext';

const schema = z.object({
    name: z.string().min(1, "El nombre es requerido"),
    slug: z.string().optional(),
    parent_id: z.string().optional(),
    code: z.string().optional(),
    description: z.string().optional(),
    sort_order: z.string().optional(),
    is_active: z.boolean(),

    seo_title: z.string().max(60, "Máximo 60 caracteres").optional(),
    seo_description: z.string().max(160, "Máximo 160 caracteres").optional(),
    canonical_url: z.string().url("Debe ser una URL válida").optional().or(z.literal('')),
    robots_index: z.boolean(),
    robots_follow: z.boolean(),
});

type FormData = z.infer<typeof schema>;

interface CategoryFormProps {
    categoryId?: string;
}

export default function CategoryForm({ categoryId }: CategoryFormProps) {
    const { refreshCatalog } = useCatalog();
    const router = useRouter();
    const { can } = usePermission();

    const [loading, setLoading] = useState(false);
    const [parents, setParents] = useState<Category[]>([]);

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'general' | 'seo'>('general');

    const hasPermission = categoryId ? can('edit_categories') : can('create_categories');
    const requiredGatePermission = categoryId ? 'edit_categories' : 'create_categories';

    const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            is_active: true,
            robots_index: true,
            robots_follow: true,
            sort_order: '0',
            parent_id: ''
        }
    });

    useEffect(() => {
        let isMounted = true;

        const fetchData = async () => {
            try {
                const { data: listData } = await api.get<LaravelResource<Category[]>>('/admin/categories');

                if (isMounted) {
                    setParents(listData.data);
                }

                if (categoryId) {
                    const { data: catData } = await api.get<LaravelResource<Category>>(`/admin/categories/${categoryId}`);
                    const cat = catData.data;

                    if (cat && isMounted) {
                        reset({
                            name: cat.name,
                            slug: cat.slug,
                            code: cat.code?.toString(),
                            description: cat.description || '',
                            parent_id: cat.parent_id?.toString() || '',
                            sort_order: cat.sort_order?.toString() || '0',
                            is_active: !!cat.is_active,
                            seo_title: cat.seo?.title || '',
                            seo_description: cat.seo?.description || '',
                            canonical_url: cat.seo?.canonical_url || '',
                            robots_index: !!cat.seo?.robots_index,
                            robots_follow: !!cat.seo?.robots_follow,
                        });

                        if (cat.seo?.og_image) setImagePreview(cat.seo.og_image);
                    }
                }
            } catch (error) {
                if (isMounted) {
                    const msg = handleError(error, 'CategoryForm Fetch');
                    toast.error(msg);
                }
            }
        };

        fetchData();

        return () => {
            isMounted = false;
        };
    }, [categoryId]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setImageFile(e.target.files[0]);
            setImagePreview(URL.createObjectURL(e.target.files[0]));
        }
    };

    const onSubmit = async (data: FormData) => {
        if (!hasPermission) return;

        setLoading(true);
        const formData = new FormData();

        formData.append('name', data.name);
        if (data.slug) formData.append('slug', data.slug);
        if (data.code) formData.append('code', data.code);
        if (data.parent_id && data.parent_id !== '0') formData.append('parent_id', data.parent_id);
        if (data.description) formData.append('description', data.description);
        formData.append('sort_order', data.sort_order || '0');
        formData.append('is_active', data.is_active ? '1' : '0');

        if (data.seo_title) formData.append('seo_title', data.seo_title);
        if (data.seo_description) formData.append('seo_description', data.seo_description);
        if (data.canonical_url) formData.append('canonical_url', data.canonical_url);

        formData.append('robots_index', data.robots_index ? '1' : '0');
        formData.append('robots_follow', data.robots_follow ? '1' : '0');

        if (imageFile) {
            formData.append('og_image', imageFile);
        }

        const config = { headers: { 'Content-Type': 'multipart/form-data' } };

        try {
            if (categoryId) {
                formData.append('_method', 'PUT');
                await api.post(`/admin/categories/${categoryId}`, formData, config);
                toast.success('Categoría actualizada');
            } else {
                await api.post('/admin/categories', formData, config);
                toast.success('Categoría creada exitosamente');
            }
            await refreshCatalog();
            router.push('/categories');
        } catch (error) {
            const msg = handleError(error, 'CategoryForm Submit');
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };


    const parentOptions = parents.map(p => ({
        id: p.id,
        label: p.name,
        code: p.code
    }));

    return (
        <PermissionGate permission={requiredGatePermission}>
            <form onSubmit={handleSubmit(onSubmit)} className="max-w-5xl mx-auto p-6 pb-20">

                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                        <button type="button" onClick={() => router.back()} className="p-2 hover:bg-white rounded-full transition"><ArrowLeft className="w-5 h-5" /></button>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">{categoryId ? 'Editar Categoría' : 'Nueva Categoría'}</h1>
                            <div className="flex items-center gap-2">
                                <p className="text-sm text-slate-500">{categoryId ? `Código: ${watch('code')}` : 'Código automático'}</p>
                                {!hasPermission && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full flex items-center gap-1 font-bold"><Lock className="w-3 h-3" /> Solo Lectura</span>}
                            </div>
                        </div>
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
                            <button type="button" onClick={() => setActiveTab('general')} className={`px-5 py-2.5 text-sm font-bold border-b-2 transition ${activeTab === 'general' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>General</button>
                            <button type="button" onClick={() => setActiveTab('seo')} className={`px-5 py-2.5 text-sm font-bold border-b-2 transition ${activeTab === 'seo' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>SEO</button>
                        </div>

                        {activeTab === 'general' && (
                            <Card className="p-6 space-y-5 animate-in fade-in slide-in-from-bottom-2">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <Input label="Nombre de Categoría" registration={register('name')} error={errors.name?.message} disabled={!hasPermission} placeholder="Ej: Ropa Deportiva" />

                                    <div>
                                        <label className="text-xs font-bold text-slate-700 block mb-1">Código (Sistema)</label>
                                        <input
                                            {...register('code')}
                                            disabled
                                            className="w-full border bg-slate-100 border-slate-200 rounded-lg px-3 py-2 text-sm font-mono text-slate-600 focus:outline-none cursor-not-allowed"
                                            placeholder="Se generará al guardar"
                                        />
                                    </div>
                                </div>

                                <Input label="Slug (URL)" placeholder="Dejar vacío para autogenerar" registration={register('slug')} disabled={!hasPermission} />

                                <div className="relative z-20">
                                    <SearchableSelect
                                        label="Categoría Padre"
                                        options={parentOptions}
                                        value={watch('parent_id') || ''}
                                        onChange={(val) => setValue('parent_id', val, { shouldDirty: true })}
                                        disabled={!hasPermission}
                                        placeholder="Buscar padre por nombre o código..."
                                    />
                                    <p className="text-[10px] text-slate-400 mt-1">
                                        El código de esta categoría se calculará automáticamente según el padre seleccionado.
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <Input label="Orden Visual" type="number" registration={register('sort_order')} disabled={!hasPermission} />
                                    <div className="flex items-center h-full pt-6">
                                        <label className="flex items-center gap-2 cursor-pointer select-none">
                                            <input type="checkbox" {...register('is_active')} disabled={!hasPermission} className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900 border-slate-300" />
                                            <span className="text-sm font-bold text-slate-700">Visible en Tienda</span>
                                        </label>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-700 block mb-1">Descripción</label>
                                    <textarea {...register('description')} disabled={!hasPermission} rows={3} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 ring-slate-900 outline-none resize-none disabled:bg-slate-100"></textarea>
                                </div>
                            </Card>
                        )}

                        {activeTab === 'seo' && (
                            <Card className="p-6 space-y-4 animate-in fade-in slide-in-from-bottom-2">
                                <div className="bg-blue-50 p-3 rounded-lg flex gap-3 border border-blue-100">
                                    <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                                    <p className="text-xs text-blue-700 leading-relaxed">
                                        Configuración avanzada para motores de búsqueda (Google) y redes sociales.
                                    </p>
                                </div>

                                <Input label="Meta Title" placeholder="Ej: Duchas para baño | Castella" registration={register('seo_title')} disabled={!hasPermission} />

                                <Input
                                    label="Canonical URL"
                                    placeholder="https://..."
                                    registration={register('canonical_url')}
                                    error={errors.canonical_url?.message}
                                    disabled={!hasPermission}
                                />

                                <div>
                                    <label className="text-xs font-bold text-slate-700 block mb-1">Meta Description</label>
                                    <textarea
                                        {...register('seo_description')}
                                        disabled={!hasPermission}
                                        rows={2}
                                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 ring-slate-900 outline-none resize-none disabled:bg-slate-100"
                                    ></textarea>
                                    <div className="flex justify-end mt-1">
                                        <span className={`text-[10px] ${(watch('seo_description') ?? '')?.length > 160 ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
                                            {watch('seo_description')?.length || 0} / 160
                                        </span>
                                    </div>
                                </div>

                                <div className="flex gap-6 pt-2 border-t mt-2">
                                    <label className="flex items-center gap-2 cursor-pointer select-none">
                                        <input type="checkbox" {...register('robots_index')} disabled={!hasPermission} className="rounded text-slate-900 focus:ring-slate-900" />
                                        <span className="text-sm text-slate-700">Indexar (Index)</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer select-none">
                                        <input type="checkbox" {...register('robots_follow')} disabled={!hasPermission} className="rounded text-slate-900 focus:ring-slate-900" />
                                        <span className="text-sm text-slate-700">Seguir Enlaces (Follow)</span>
                                    </label>
                                </div>
                            </Card>
                        )}
                    </div>

                    <div className="w-full lg:w-80 space-y-6">
                        <Card className="p-5">
                            <label className="text-xs font-bold text-slate-700 block mb-3">Imagen Social (OG)</label>
                            <div className="aspect-square bg-slate-50 rounded-xl border-2 border-dashed border-slate-300 relative overflow-hidden group hover:border-slate-400 transition-colors">
                                {imagePreview ? (
                                    <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                        <ImageIcon className="w-8 h-8 mb-2" />
                                        <span className="text-xs font-medium">Click para subir</span>
                                    </div>
                                )}
                                {hasPermission && (
                                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={handleImageChange} />
                                )}
                                {imagePreview && hasPermission && (
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold pointer-events-none">
                                        Cambiar Imagen
                                    </div>
                                )}
                            </div>
                            <p className="text-[10px] text-slate-400 mt-2 text-center">Formato recomendado: 1200x630px.</p>
                        </Card>
                    </div>
                </div>
            </form>
        </PermissionGate>
    );
}