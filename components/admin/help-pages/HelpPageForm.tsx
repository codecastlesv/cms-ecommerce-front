'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/axios';
import { handleError } from '@/lib/errorHandler';
import PermissionGate from '@/components/auth/PermissionGate';
import RichTextEditor from './RichTextEditor';

function slugify(value: string): string {
    return value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

export default function HelpPageForm({ mode, pageId }: { mode: 'create' | 'edit'; pageId?: number }) {
    const router = useRouter();

    const [title, setTitle] = useState('');
    const [slug, setSlug] = useState('');
    const [slugTouched, setSlugTouched] = useState(mode === 'edit');
    const [body, setBody] = useState('');
    const [showToc, setShowToc] = useState(false);
    const [isActive, setIsActive] = useState(true);
    const [metaTitle, setMetaTitle] = useState('');
    const [metaDescription, setMetaDescription] = useState('');

    const [loading, setLoading] = useState(mode === 'edit');
    const [saving, setSaving] = useState(false);
    const nameDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (mode !== 'edit' || !pageId) return;
        api.get(`/admin/help-pages/${pageId}`).then(({ data }) => {
            const page = data.data;
            setTitle(page.title);
            setSlug(page.slug);
            setBody(page.body || '');
            setShowToc(Boolean(page.show_toc));
            setIsActive(Boolean(page.is_active));
            setMetaTitle(page.meta_title || '');
            setMetaDescription(page.meta_description || '');
            setLoading(false);
        }).catch(() => {
            toast.error('No se pudo cargar la página');
            setLoading(false);
        });
    }, [mode, pageId]);

    const handleTitleChange = (value: string) => {
        setTitle(value);
        if (!slugTouched) {
            if (nameDebounce.current) clearTimeout(nameDebounce.current);
            nameDebounce.current = setTimeout(() => setSlug(slugify(value)), 150);
        }
    };

    const handleSlugChange = (value: string) => {
        setSlugTouched(true);
        setSlug(slugify(value));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) {
            toast.error('Agrega un título antes de guardar.');
            return;
        }
        setSaving(true);

        const payload = {
            title: title.trim(),
            slug: slug.trim() || undefined,
            body,
            meta_title: metaTitle.trim() || null,
            meta_description: metaDescription.trim() || null,
            show_toc: showToc,
            is_active: isActive,
        };

        try {
            if (mode === 'create') {
                await api.post('/admin/help-pages', payload);
                toast.success('Página de ayuda creada');
            } else {
                await api.put(`/admin/help-pages/${pageId}`, payload);
                toast.success('Página de ayuda actualizada');
            }
            router.push('/help-pages');
        } catch (error) {
            toast.error(handleError(error, 'No se pudo guardar la página'));
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
        <PermissionGate permission="edit_help_pages">
            <form onSubmit={handleSubmit} className="max-w-3xl mx-auto p-4 sm:p-6 pb-24 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            {mode === 'create' ? 'Nueva página de ayuda' : title || 'Editar página'}
                        </h1>
                        <p className="text-sm text-slate-500">Todas las páginas de este tipo comparten el mismo formulario y la misma plantilla pública.</p>
                    </div>
                    <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50 sm:w-auto"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Guardar página
                    </button>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 space-y-4">
                    <p className="text-sm font-extrabold text-slate-900">Datos generales</p>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Título de la página</label>
                        <input
                            type="text"
                            required
                            value={title}
                            onChange={(e) => handleTitleChange(e.target.value)}
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 ring-slate-900"
                            placeholder="Ej. Envíos y Entregas"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Slug (URL)</label>
                        <input
                            type="text"
                            value={slug}
                            onChange={(e) => handleSlugChange(e.target.value)}
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 ring-slate-900 font-mono"
                            placeholder="se genera automáticamente del título"
                        />
                        <p className="mt-1.5 text-[11px] text-slate-500">
                            Se verá en <span className="font-mono">castellasagarra.com/ayuda/{slug || '…'}</span>
                        </p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 space-y-4">
                    <p className="text-sm font-extrabold text-slate-900">Visibilidad</p>
                    <div className="flex flex-col gap-4 sm:flex-row sm:gap-8">
                        <ToggleField
                            label="Mostrar índice lateral"
                            hint="Recomendado en páginas largas como Términos y Condiciones."
                            checked={showToc}
                            onChange={setShowToc}
                        />
                        <ToggleField
                            label="Página activa"
                            hint="Si se desactiva, deja de verse en el sitio y en el Índice de Ayuda."
                            checked={isActive}
                            onChange={setIsActive}
                        />
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 space-y-3">
                    <p className="text-sm font-extrabold text-slate-900">Contenido</p>
                    <RichTextEditor value={body} onChange={setBody} placeholder="Escribe el contenido de la página…" />
                    <p className="text-[11px] text-slate-400">Mismo editor para todas las páginas de este tipo — solo cambia lo que escribas aquí.</p>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 space-y-4">
                    <p className="text-sm font-extrabold text-slate-900">SEO</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">Meta título</label>
                            <input
                                type="text"
                                value={metaTitle}
                                onChange={(e) => setMetaTitle(e.target.value)}
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 ring-slate-900"
                                placeholder="Título para buscadores"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">Meta descripción</label>
                            <input
                                type="text"
                                value={metaDescription}
                                onChange={(e) => setMetaDescription(e.target.value)}
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 ring-slate-900"
                                placeholder="Descripción para buscadores"
                            />
                        </div>
                    </div>
                </div>
            </form>
        </PermissionGate>
    );
}

function ToggleField({
    label,
    hint,
    checked,
    onChange,
}: {
    label: string;
    hint: string;
    checked: boolean;
    onChange: (value: boolean) => void;
}) {
    return (
        <label className="flex flex-1 items-start gap-3 cursor-pointer">
            <span
                onClick={() => onChange(!checked)}
                className={`relative mt-0.5 inline-flex h-[22px] w-[38px] flex-shrink-0 items-center rounded-full transition-colors ${
                    checked ? 'bg-slate-900' : 'bg-slate-300'
                }`}
            >
                <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                        checked ? 'translate-x-[19px]' : 'translate-x-[3px]'
                    }`}
                />
            </span>
            <span className="flex flex-col">
                <span className="text-xs font-bold text-slate-700">{label}</span>
                <span className="text-[11px] text-slate-400 max-w-[220px]">{hint}</span>
            </span>
        </label>
    );
}
