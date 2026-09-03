'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { Save, Upload, LayoutTemplate, Search, Share2, Info } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import PermissionGate from '@/components/auth/PermissionGate';

const schema = z.object({
    main_color: z.string().regex(/^#[0-9A-F]{6}$/i, "Debe ser un código Hex válido"),

    seo_title: z.string().max(60).optional(),
    seo_description: z.string().max(160).optional(),
    canonical_url: z.string().url("URL inválida").optional().or(z.literal('')),
    robots_index: z.boolean(),
    robots_follow: z.boolean(),
    schema_json: z.string().optional(),

    og_title: z.string().max(255).optional(),
    og_description: z.string().max(500).optional(),
});

type FormData = z.infer<typeof schema>;

export default function SettingsForm() {
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'branding' | 'seo' | 'social'>('branding');

    const [files, setFiles] = useState<{ logo: File | null; og_image: File | null }>({ logo: null, og_image: null });
    const [previews, setPreviews] = useState<{ logo: string | null; og_image: string | null }>({ logo: null, og_image: null });

    const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: { main_color: '#000000', robots_index: true, robots_follow: true }
    });

    useEffect(() => {
        api.get('/admin/settings').then(({ data }) => {
            const s = data.data;
            reset({
                main_color: s.main_color,
                seo_title: s.seo.title || '',
                seo_description: s.seo.description || '',
                canonical_url: s.seo.canonical_url || '',
                robots_index: s.seo.robots_index,
                robots_follow: s.seo.robots_follow,
                schema_json: s.seo.schema_json ? JSON.stringify(s.seo.schema_json, null, 2) : '',
                og_title: s.social.og_title || '',
                og_description: s.social.og_description || '',
            });
            setPreviews({ logo: s.logo, og_image: s.social.og_image });
        }).catch(() => toast.error("Error cargando configuración"));
    }, [reset]);

    const handleFile = (key: 'logo' | 'og_image', e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const file = e.target.files[0];
            setFiles(prev => ({ ...prev, [key]: file }));
            setPreviews(prev => ({ ...prev, [key]: URL.createObjectURL(file) }));
        }
    };

    const onSubmit = async (data: FormData) => {
        setLoading(true);
        const formData = new FormData();

        Object.entries(data).forEach(([key, val]) => {
            if (val !== undefined && val !== null) {
                if (typeof val === 'boolean') formData.append(key, val ? '1' : '0');
                else formData.append(key, val as string);
            }
        });

        if (files.logo) formData.append('logo', files.logo);
        if (files.og_image) formData.append('og_image', files.og_image);

        try {
            await api.post('/admin/settings', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            toast.success('Configuración guardada exitosamente');
        } catch (e: any) {
            toast.error('Error al guardar configuración');
        } finally {
            setLoading(false);
        }
    };

    return (
        <PermissionGate permission="manage_settings">
            <div className="max-w-4xl mx-auto p-6 pb-20">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-slate-900">Configuración General</h1>
                    <button onClick={handleSubmit(onSubmit)} disabled={loading} className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold flex items-center hover:bg-slate-800 disabled:opacity-50 shadow-lg active:scale-95 transition-transform">
                        <Save className="w-4 h-4 mr-2" /> {loading ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                </div>

                <div className="flex flex-col md:flex-row gap-6">
                    <div className="w-full md:w-64 space-y-1">
                        <TabButton active={activeTab === 'branding'} onClick={() => setActiveTab('branding')} icon={<LayoutTemplate className="w-4 h-4" />} label="Identidad & Marca" />
                        <TabButton active={activeTab === 'seo'} onClick={() => setActiveTab('seo')} icon={<Search className="w-4 h-4" />} label="SEO Global" />
                        <TabButton active={activeTab === 'social'} onClick={() => setActiveTab('social')} icon={<Share2 className="w-4 h-4" />} label="Redes Sociales" />
                    </div>

                    <div className="flex-1 space-y-6">

                        {activeTab === 'branding' && (
                            <Card className="p-6 space-y-6 animate-in fade-in slide-in-from-right-4">
                                <h2 className="font-bold text-lg border-b pb-2 mb-4">Identidad Visual</h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-xs font-bold text-slate-700 block mb-2">Color Principal</label>
                                        <div className="flex items-center gap-3">
                                            <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                                                <input type="color" {...register('main_color')} className="absolute -top-1/4 -left-1/4 w-[150%] h-[150%] p-0 border-0 cursor-pointer" />
                                            </div>
                                            <div className="flex-1">
                                                <input type="text" {...register('main_color')} className="w-full border rounded-lg px-3 py-2 text-sm uppercase font-mono" />
                                                {errors.main_color && <p className="text-red-500 text-xs mt-1">{errors.main_color.message}</p>}
                                            </div>
                                        </div>
                                    </div>

                                    <ImageUploader label="Logo del Sitio" preview={previews.logo} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFile('logo', e)} fit="contain" />
                                </div>
                            </Card>
                        )}

                        {activeTab === 'seo' && (
                            <Card className="p-6 space-y-5 animate-in fade-in slide-in-from-right-4">
                                <div className="bg-blue-50 p-3 rounded-lg flex gap-3 text-xs text-blue-700 border border-blue-100">
                                    <Info className="w-5 h-5 shrink-0" /> Estos ajustes definen cómo aparece la página de inicio en Google.
                                </div>

                                <Input label="Meta Title (Home)" registration={register('seo_title')} />
                                <div>
                                    <label className="text-xs font-bold text-slate-700 block mb-1">Meta Description</label>
                                    <textarea {...register('seo_description')} rows={3} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 ring-slate-900 outline-none resize-none"></textarea>
                                </div>
                                <Input label="Canonical URL" registration={register('canonical_url')} placeholder="https://castellasagarra.com" />

                                <div className="flex gap-6 pt-2 border-t">
                                    <label className="flex gap-2 items-center cursor-pointer"><input type="checkbox" {...register('robots_index')} className="rounded text-slate-900" /> <span className="text-sm font-medium">Indexar Sitio</span></label>
                                    <label className="flex gap-2 items-center cursor-pointer"><input type="checkbox" {...register('robots_follow')} className="rounded text-slate-900" /> <span className="text-sm font-medium">Seguir Enlaces</span></label>
                                </div>

                                <div className="pt-4">
                                    <label className="text-xs font-bold text-slate-700 block mb-1">JSON-LD Schema (Avanzado)</label>
                                    <textarea {...register('schema_json')} rows={5} className="w-full border rounded-lg px-3 py-2 text-xs font-mono bg-slate-50 focus:ring-2 ring-slate-900 outline-none" placeholder='{"@context": "https://schema.org", ...}'></textarea>
                                </div>
                            </Card>
                        )}

                        {activeTab === 'social' && (
                            <Card className="p-6 space-y-5 animate-in fade-in slide-in-from-right-4">
                                <h2 className="font-bold text-lg border-b pb-2 mb-4">Open Graph (Facebook / WhatsApp)</h2>

                                <Input label="OG Title" registration={register('og_title')} placeholder="Igual al SEO Title si se deja vacío" />
                                <div>
                                    <label className="text-xs font-bold text-slate-700 block mb-1">OG Description</label>
                                    <textarea {...register('og_description')} rows={2} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 ring-slate-900 outline-none resize-none"></textarea>
                                </div>

                                <div className="pt-2">
                                    <ImageUploader label="Imagen para compartir (1200x630)" preview={previews.og_image} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFile('og_image', e)} fit="cover" />
                                </div>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </PermissionGate>
    );
}

function TabButton({ active, onClick, icon, label }: any) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-all ${active ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                }`}
        >
            {icon} {label}
        </button>
    );
}

function ImageUploader({ label, preview, onChange, fit = 'cover' }: any) {
    return (
        <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">{label}</label>
            <div className="relative border-2 border-dashed border-slate-300 rounded-xl overflow-hidden bg-slate-50 hover:border-slate-400 transition-colors aspect-video w-full max-w-xs group">
                {preview ? (
                    <img src={preview} className={`w-full h-full object-${fit}`} />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                        <Upload className="w-8 h-8 mb-2 opacity-50" />
                        <span className="text-xs font-medium">Click para subir</span>
                    </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold pointer-events-none">
                    Cambiar Imagen
                </div>
                <input type="file" accept="image/*" onChange={onChange} className="absolute inset-0 opacity-0 cursor-pointer" />
            </div>
        </div>
    );
}