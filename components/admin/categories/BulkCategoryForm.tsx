'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { ArrowLeft, Layers, AlertCircle, CheckCircle2, List } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { Category, LaravelResource } from '@/types';
import { handleError } from '@/lib/errorHandler';
import { useCatalog } from '@/components/providers/CatalogContext';

interface ParentOption {
    id: number;
    label: string;
    code: number;
}

export default function BulkCategoryForm() {
    const router = useRouter();
    const { refreshCatalog } = useCatalog();
    const [loading, setLoading] = useState(false);

    const [parents, setParents] = useState<ParentOption[]>([]);

    const [parentId, setParentId] = useState<string>('');
    const [rawNames, setRawNames] = useState<string>('');

    const namesList = useMemo(() => {
        if (!rawNames) return [];
        return rawNames
            .split(/\r?\n/)
            .map(line => line.trim())
            .filter(line => line.length > 0);
    }, [rawNames]);

    const currentParentLabel = useMemo(() => {
        if (!parentId) return 'Raíz (Nivel Principal)';
        const found = parents.find(p => String(p.id) === String(parentId));
        return found ? found.label : 'Desconocido';
    }, [parentId, parents]);

    useEffect(() => {
        const fetchParents = async () => {
            try {
                const { data } = await api.get<LaravelResource<Category[]>>('/admin/categories');

                if (data.data) {
                    setParents(data.data.map((p) => ({
                        id: p.id,
                        label: p.name,
                        code: p.code ?? 0
                    })));
                }
            } catch (error) {
                const msg = handleError(error, 'BulkCategoryForm Fetch');
                toast.error(msg);
            }
        };
        fetchParents();
    }, []);

    const handleSubmit = async () => {
        if (namesList.length === 0) {
            toast.error('La lista está vacía. Escribe al menos un nombre.');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                parent_id: parentId || null,
                names: rawNames
            };

            const response = await api.post('/admin/categories/bulk', payload);
            await refreshCatalog();
            toast.success(response.data.message);
            router.push('/categories');
        } catch (error) {
            const msg = handleError(error, 'BulkCategoryForm Submit');
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto p-6 pb-20">

            <div className="flex items-center gap-4 mb-8">
                <button onClick={() => router.back()} className="p-2 hover:bg-white rounded-full transition shadow-sm border border-transparent hover:border-slate-200">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Layers className="w-6 h-6 text-blue-600" /> Carga Masiva de Categorías
                    </h1>
                    <p className="text-sm text-slate-500">Copia listas desde Excel/Word y crea múltiples categorías en un click.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                <div className="lg:col-span-2 space-y-6">
                    <Card className="p-6 space-y-8 shadow-md">

                        <div className="relative z-20 space-y-3">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="bg-slate-900 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full">1</span>
                                <label className="text-sm font-bold text-slate-900">Selecciona la Categoría Padre</label>
                            </div>

                            <SearchableSelect
                                label=""
                                placeholder="Buscar padre (ej: Ropa Masculino)..."
                                options={parents}
                                value={parentId}
                                onChange={setParentId}
                            />

                            <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg text-xs text-blue-700 flex gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                {parentId
                                    ? <span>Las nuevas categorías se crearán DENTRO de <strong>{currentParentLabel}</strong>.</span>
                                    : <span>Las categorías se crearán en la <strong>RAÍZ</strong> (sin padre superior).</span>}
                            </div>
                        </div>

                        <hr className="border-slate-100" />

                        <div className="space-y-3">
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                    <span className="bg-slate-900 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full">2</span>
                                    <label className="text-sm font-bold text-slate-900">Pega la lista de nombres</label>
                                </div>
                                {namesList.length > 0 && (
                                    <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3" /> {namesList.length} detectados
                                    </span>
                                )}
                            </div>

                            <div className="relative group">
                                <textarea
                                    className="w-full h-96 p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none font-mono text-sm leading-relaxed shadow-inner transition-all resize-none"
                                    placeholder={`Ejemplo:\nCamisetas\nPantalones\nZapatos\nAccesorios`}
                                    value={rawNames}
                                    onChange={(e) => setRawNames(e.target.value)}
                                ></textarea>

                                <div className="absolute bottom-4 right-4 text-xs font-bold text-slate-500 bg-white/90 px-3 py-1.5 rounded-lg border shadow-sm backdrop-blur-sm pointer-events-none">
                                    {namesList.length} líneas válidas
                                </div>
                            </div>
                            <p className="text-xs text-slate-400 pl-1">Escribe un nombre por línea. Las líneas vacías se ignorarán.</p>
                        </div>
                    </Card>
                </div>

                <div className="space-y-6 lg:sticky lg:top-6 h-fit">
                    <Card className="p-0 overflow-hidden border-0 shadow-xl bg-slate-900 text-white">
                        <div className="p-6 border-b border-slate-700 bg-slate-800/50">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <List className="w-5 h-5 text-green-400" /> Resumen de Acción
                            </h3>
                        </div>

                        <div className="p-6 space-y-6">

                            <div className="flex flex-col gap-1 pb-4 border-b border-slate-700/50">
                                <span className="text-xs text-slate-400 uppercase tracking-wider font-bold">Destino</span>
                                <span className="font-bold text-lg text-white truncate" title={currentParentLabel}>
                                    {currentParentLabel}
                                </span>
                            </div>

                            <div className="flex flex-col gap-1 pb-4 border-b border-slate-700/50">
                                <span className="text-xs text-slate-400 uppercase tracking-wider font-bold">Total a crear</span>
                                <div className="flex items-baseline gap-2">
                                    <span className={`font-bold text-4xl ${namesList.length > 0 ? 'text-green-400' : 'text-slate-600'}`}>
                                        {namesList.length}
                                    </span>
                                    <span className="text-sm text-slate-400">categorías</span>
                                </div>
                            </div>


                            <div className="pt-2">
                                <button
                                    onClick={handleSubmit}
                                    disabled={loading || namesList.length === 0}
                                    className={`
                                        w-full py-4 rounded-xl font-bold flex items-center justify-center transition-all shadow-lg
                                        ${namesList.length > 0 && !loading
                                            ? 'bg-white text-slate-900 hover:bg-blue-50 active:scale-95'
                                            : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'}
                                    `}
                                >
                                    {loading ? (
                                        <span className="flex items-center gap-2 animate-pulse">Guardando...</span>
                                    ) : (
                                        'Confirmar Creación'
                                    )}
                                </button>
                            </div>
                        </div>
                    </Card>

                    <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 shadow-sm">
                        <h4 className="font-bold text-xs text-yellow-800 uppercase mb-2 flex items-center gap-2">
                            <AlertCircle className="w-3.5 h-3.5" /> Importante
                        </h4>
                        <p className="text-xs text-yellow-700 leading-relaxed text-justify">
                            El sistema generará códigos automáticos (ej: 1001, 1002) continuando la secuencia del padre seleccionado. Revisa la ortografía antes de confirmar.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}