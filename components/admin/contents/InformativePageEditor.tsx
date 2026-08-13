'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { toast } from 'sonner';
import {
    ArrowLeft,
    Save,
    Loader2,
    FileText,
    Search,
    Eye,
    AlertTriangle,
    Trash2,
    Upload,
} from 'lucide-react';
import { InformativePageDetail, LaravelResource } from '@/types';
import { handleError } from '@/lib/errorHandler';

const LONG_TEXT_THRESHOLD = 200;

const FormSection = ({
    children,
    title,
    icon: Icon,
}: {
    children: React.ReactNode;
    title: string;
    icon?: React.ElementType;
}) => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
            {Icon && <Icon className="w-4 h-4 text-slate-800" />}
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">{title}</h3>
        </div>
        <div className="p-6">{children}</div>
    </div>
);

function formatFieldLabel(key: string): string {
    return key
        .replace(/_/g, ' ')
        .split(' ')
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
}

function isImageFieldKey(key: string): boolean {
    const k = key.toLowerCase();
    if (
        k === 'imagen' ||
        k === 'image' ||
        k === 'logo' ||
        k === 'og_image' ||
        k === 'imagen_url' ||
        k === 'image_url'
    ) {
        return true;
    }
    if (k.startsWith('imagen_') || k.startsWith('image_') || k.startsWith('logo_')) {
        return true;
    }
    if (k.endsWith('_imagen') || k.endsWith('_image') || k.endsWith('_logo') || k.endsWith('_image_url')) {
        return true;
    }
    return k.includes('imagen') && (k.includes('url') || k.includes('fondo') || k.includes('foto'));
}

function pathKey(path: (string | number)[]): string {
    return path.map(String).join('.');
}

function appendContentToFormData(
    formData: FormData,
    node: unknown,
    pendingFiles: Map<string, File>,
    prefix = 'content',
    path: (string | number)[] = [],
): void {
    if (Array.isArray(node)) {
        node.forEach((item, index) => {
            appendContentToFormData(formData, item, pendingFiles, `${prefix}[${index}]`, [...path, index]);
        });
        return;
    }

    if (node !== null && typeof node === 'object') {
        Object.entries(node as Record<string, unknown>).forEach(([key, value]) => {
            appendContentToFormData(formData, value, pendingFiles, `${prefix}[${key}]`, [...path, key]);
        });
        return;
    }

    const pending = pendingFiles.get(pathKey(path));
    if (pending) {
        formData.append(prefix, pending);
        return;
    }

    if (typeof node === 'boolean') {
        formData.append(prefix, node ? '1' : '0');
        return;
    }

    if (node !== null && node !== undefined) {
        formData.append(prefix, String(node));
    }
}

function updateAtPath(
    root: unknown,
    path: (string | number)[],
    value: unknown
): unknown {
    if (path.length === 0) return value;
    const [head, ...rest] = path;

    if (Array.isArray(root)) {
        const i = typeof head === 'number' ? head : Number(head);
        const next = [...root];
        const el = next[i];
        next[i] = rest.length === 0 ? value : updateAtPath(el, rest, value);
        return next;
    }

    if (root !== null && typeof root === 'object') {
        const o = root as Record<string, unknown>;
        const k = String(head);
        const nextVal = rest.length === 0 ? value : updateAtPath(o[k], rest, value);
        return { ...o, [k]: nextVal };
    }

    return root;
}

function ImageUploadField({
    value,
    pendingFile,
    onFileSelect,
    onClear,
    label,
}: {
    value: string;
    pendingFile?: File;
    onFileSelect: (file: File | null) => void;
    onClear: () => void;
    label: string;
}) {
    const [objectPreview, setObjectPreview] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        if (!pendingFile) {
            setObjectPreview(null);
            return undefined;
        }
        const url = URL.createObjectURL(pendingFile);
        setObjectPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [pendingFile]);

    const applyFile = (file: File | undefined | null) => {
        if (!file || !file.type.startsWith('image/')) return;
        onFileSelect(file);
    };

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        applyFile(e.target.files?.[0]);
        e.target.value = '';
    };

    const previewSrc = objectPreview || value;
    const showPreview = Boolean(previewSrc?.trim());
    const canRemove = showPreview || Boolean(pendingFile);

    return (
        <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1 block">
                {label}
            </label>
            <div className="flex flex-col sm:flex-row gap-4 items-start">
                <div className="flex flex-col gap-2 w-full sm:w-56 shrink-0">
                    <div
                        className={`relative aspect-video w-full overflow-hidden rounded-lg border-2 border-dashed bg-slate-50 transition-colors group ${
                            isDragging ? 'border-slate-900 bg-slate-100' : 'border-slate-300 hover:border-slate-400'
                        }`}
                        onDragEnter={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsDragging(true);
                        }}
                        onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsDragging(true);
                        }}
                        onDragLeave={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsDragging(false);
                        }}
                        onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsDragging(false);
                            applyFile(e.dataTransfer.files?.[0]);
                        }}
                    >
                        {showPreview ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={previewSrc} alt={label} className="h-full w-full object-cover" />
                        ) : (
                            <div className="flex h-full flex-col items-center justify-center gap-1 text-slate-400 px-3 text-center">
                                <Upload className="h-7 w-7 mb-1" />
                                <span className="text-xs font-bold">Arrastra o selecciona</span>
                                <span className="text-[10px]">JPG, PNG o WebP · máx. 5MB</span>
                            </div>
                        )}

                        <label className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/50 text-sm font-bold text-white opacity-0 transition-opacity group-hover:opacity-100">
                            {showPreview ? 'Cambiar imagen' : 'Subir imagen'}
                            <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
                        </label>
                    </div>

                    {canRemove ? (
                        <button
                            type="button"
                            onClick={onClear}
                            className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 transition-colors hover:bg-red-100"
                        >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden />
                            Quitar imagen
                        </button>
                    ) : null}
                </div>

                <div className="flex-1 min-w-0 space-y-1 pt-1">
                    {pendingFile ? (
                        <p className="text-xs text-emerald-700 font-medium">
                            Nueva imagen: {pendingFile.name} (se guardará como WebP al actualizar)
                        </p>
                    ) : value?.trim() ? (
                        <p className="text-xs text-slate-500">Imagen actual cargada. Pasa el cursor para cambiarla.</p>
                    ) : (
                        <p className="text-xs text-slate-400">Sin imagen. Arrastra un archivo o haz clic en el recuadro.</p>
                    )}
                </div>
            </div>
        </div>
    );
}

function ContentValueEditor({
    value,
    path,
    onPatch,
    onFileSelect,
    pendingFiles,
    fieldLabel,
}: {
    value: unknown;
    path: (string | number)[];
    onPatch: (path: (string | number)[], next: unknown) => void;
    onFileSelect: (path: (string | number)[], file: File | null) => void;
    pendingFiles: Map<string, File>;
    fieldLabel: string;
}) {
    if (value === null || value === undefined) {
        return (
            <p className="text-sm text-slate-400 italic">Vacío</p>
        );
    }

    if (typeof value === 'boolean') {
        return (
            <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => onPatch(path, e.target.checked)}
                    className="rounded text-slate-900 focus:ring-slate-900"
                />
                <span className="text-sm font-medium text-slate-700">{fieldLabel}</span>
            </label>
        );
    }

    if (typeof value === 'number') {
        return (
            <div className="space-y-1.5 w-full">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                    {fieldLabel}
                </label>
                <input
                    type="number"
                    value={Number.isFinite(value) ? value : ''}
                    onChange={(e) => {
                        const v = e.target.value;
                        if (v === '') onPatch(path, 0);
                        else onPatch(path, Number(v));
                    }}
                    className="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-2 focus:ring-black/5 focus:border-slate-400 block p-2.5 outline-none"
                />
            </div>
        );
    }

    if (typeof value === 'string') {
        const leafKey = path[path.length - 1];
        if (typeof leafKey === 'string' && isImageFieldKey(leafKey)) {
            return (
                <ImageUploadField
                    label={fieldLabel}
                    value={value}
                    pendingFile={pendingFiles.get(pathKey(path))}
                    onFileSelect={(file) => onFileSelect(path, file)}
                    onClear={() => {
                        onFileSelect(path, null);
                        onPatch(path, '');
                    }}
                />
            );
        }
        const multiline = value.length > LONG_TEXT_THRESHOLD;
        if (multiline) {
            return (
                <div className="space-y-1.5 w-full">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                        {fieldLabel}
                    </label>
                    <textarea
                        value={value}
                        onChange={(e) => onPatch(path, e.target.value)}
                        rows={Math.min(16, Math.max(4, Math.ceil(value.length / 80)))}
                        className="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-2 focus:ring-black/5 focus:border-slate-400 block p-2.5 outline-none resize-y min-h-[100px]"
                    />
                </div>
            );
        }
        return (
            <div className="space-y-1.5 w-full">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                    {fieldLabel}
                </label>
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onPatch(path, e.target.value)}
                    className="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-2 focus:ring-black/5 focus:border-slate-400 block p-2.5 outline-none"
                />
            </div>
        );
    }

    if (Array.isArray(value)) {
        return (
            <div className="space-y-4 pl-3 border-l-2 border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    {fieldLabel}
                </span>
                {value.map((item, i) => (
                    <div key={`${path.join('.')}-${i}`} className="rounded-lg bg-slate-50/80 p-4 border border-slate-100">
                        <span className="text-xs font-bold text-slate-500 mb-3 block">#{i + 1}</span>
                        <ContentValueEditor
                            value={item}
                            path={[...path, i]}
                            onPatch={onPatch}
                            onFileSelect={onFileSelect}
                            pendingFiles={pendingFiles}
                            fieldLabel={`Ítem ${i + 1}`}
                        />
                    </div>
                ))}
            </div>
        );
    }

    if (typeof value === 'object') {
        return (
            <div className="space-y-4">
                {Object.entries(value as Record<string, unknown>).map(([k, v]) => (
                    <div key={k}>
                        <ContentValueEditor
                            value={v}
                            path={[...path, k]}
                            onPatch={onPatch}
                            onFileSelect={onFileSelect}
                            pendingFiles={pendingFiles}
                            fieldLabel={formatFieldLabel(k)}
                        />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <p className="text-xs text-amber-700">
            Tipo no soportado: {String(typeof value)}
        </p>
    );
}

export default function InformativePageEditor({ slug }: { slug: string }) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState<Record<string, unknown>>({});
    const [metaTitle, setMetaTitle] = useState('');
    const [metaDescription, setMetaDescription] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [pendingFiles, setPendingFiles] = useState<Map<string, File>>(() => new Map());

    const onPatch = useCallback((path: (string | number)[], next: unknown) => {
        setContent((prev) => updateAtPath(prev, path, next) as Record<string, unknown>);
    }, []);

    const onFileSelect = useCallback((path: (string | number)[], file: File | null) => {
        const key = pathKey(path);
        setPendingFiles((prev) => {
            const next = new Map(prev);
            if (file) {
                next.set(key, file);
            } else {
                next.delete(key);
            }
            return next;
        });
    }, []);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setLoading(true);
            try {
                const { data } = await api.get<LaravelResource<InformativePageDetail>>(
                    `/admin/informative-pages/${encodeURIComponent(slug)}`
                );
                if (cancelled) return;
                const p = data.data;
                setTitle(p.title);
                setContent(
                    p.content && typeof p.content === 'object' && !Array.isArray(p.content)
                        ? (JSON.parse(JSON.stringify(p.content)) as Record<string, unknown>)
                        : {}
                );
                const seo = p.seo || {};
                setMetaTitle(typeof seo.meta_title === 'string' ? seo.meta_title : '');
                setMetaDescription(typeof seo.meta_description === 'string' ? seo.meta_description : '');
                setIsActive(!!p.is_active);
            } catch (error) {
                if (!cancelled) toast.error(handleError(error, 'Cargar página'));
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        load();
        return () => {
            cancelled = true;
        };
    }, [slug]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const formData = new FormData();
            formData.append('title', title);
            formData.append('is_active', isActive ? '1' : '0');
            formData.append('seo[meta_title]', metaTitle);
            formData.append('seo[meta_description]', metaDescription);
            appendContentToFormData(formData, content, pendingFiles);
            // PHP no parsea bien multipart en PUT; mismo patrón que Marcas/Banners.
            formData.append('_method', 'PUT');

            const { data } = await api.post<{
                message?: string;
                data: InformativePageDetail;
            }>(`/admin/informative-pages/${encodeURIComponent(slug)}`, formData);

            const saved = data.data;
            setContent(
                saved.content && typeof saved.content === 'object' && !Array.isArray(saved.content)
                    ? (JSON.parse(JSON.stringify(saved.content)) as Record<string, unknown>)
                    : {}
            );
            setPendingFiles(new Map());
            toast.success(data.message || 'Página actualizada correctamente.');
        } catch (error) {
            toast.error(handleError(error, 'Guardar página'));
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
                <Loader2 className="w-10 h-10 animate-spin text-slate-400" />
                <p className="text-sm text-slate-500">Cargando editor…</p>
            </div>
        );
    }

    const sectionKeys = Object.keys(content);

    return (
        <form onSubmit={handleSubmit} className="max-w-5xl mx-auto p-6 pb-24">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                <div className="flex items-center gap-4 min-w-0">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="p-2 hover:bg-white rounded-full transition-colors shrink-0 border border-transparent hover:border-slate-200"
                    >
                        <ArrowLeft className="w-5 h-5 text-slate-600" />
                    </button>
                    <div className="min-w-0">
                        <h1 className="text-2xl font-bold text-slate-900 truncate">Editar contenido</h1>
                        <p className="text-sm text-slate-500 font-mono truncate">{slug}</p>
                    </div>
                </div>
                <button
                    type="submit"
                    disabled={saving}
                    className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 disabled:opacity-50 shadow-lg active:scale-95 transition-transform shrink-0"
                >
                    <Save className="w-4 h-4" />
                    {saving ? 'Guardando…' : 'Actualizar'}
                </button>
            </div>

            <FormSection title="General" icon={FileText}>
                <div className="space-y-5">
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                            Título de la página
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            className="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-2 focus:ring-black/5 focus:border-slate-400 block p-2.5 outline-none"
                        />
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={isActive}
                            onChange={(e) => setIsActive(e.target.checked)}
                            className="rounded text-slate-900 focus:ring-slate-900"
                        />
                        <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
                            <Eye className="w-4 h-4 text-slate-500" />
                            Página visible (publicada)
                        </span>
                    </label>
                </div>
            </FormSection>

            {sectionKeys.length === 0 ? (
                <FormSection title="Bloques de contenido" icon={FileText}>
                    <div className="flex gap-3 text-sm text-slate-600 bg-amber-50 border border-amber-100 rounded-lg p-4">
                        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                        No hay bloques en <code className="font-mono text-xs bg-white px-1 rounded">content</code>.
                        Añade estructura JSON desde el backend o base de datos.
                    </div>
                </FormSection>
            ) : (
                sectionKeys.map((key) => (
                    <FormSection key={key} title={formatFieldLabel(key)} icon={FileText}>
                        <ContentValueEditor
                            value={content[key]}
                            path={[key]}
                            onPatch={onPatch}
                            onFileSelect={onFileSelect}
                            pendingFiles={pendingFiles}
                            fieldLabel={formatFieldLabel(key)}
                        />
                    </FormSection>
                ))
            )}

            <FormSection title="SEO" icon={Search}>
                <div className="bg-blue-50 p-3 rounded-lg flex gap-3 text-xs text-blue-800 mb-5 border border-blue-100">
                    <Search className="w-5 h-5 shrink-0 text-blue-600" />
                    Meta título y descripción para buscadores (objeto <code className="font-mono">seo</code>).
                </div>
                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                            Meta title
                        </label>
                        <input
                            type="text"
                            value={metaTitle}
                            onChange={(e) => setMetaTitle(e.target.value)}
                            className="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-2 focus:ring-black/5 focus:border-slate-400 block p-2.5 outline-none"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                            Meta description
                        </label>
                        <textarea
                            value={metaDescription}
                            onChange={(e) => setMetaDescription(e.target.value)}
                            rows={3}
                            className="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-2 focus:ring-black/5 focus:border-slate-400 block p-2.5 outline-none resize-y min-h-[80px]"
                        />
                    </div>
                </div>
            </FormSection>

        </form>
    );
}
