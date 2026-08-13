'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { ArrowLeft, Layers, CheckCircle2, List } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { handleError } from '@/lib/errorHandler';
import { useCatalog } from '@/components/providers/CatalogContext';

export default function BulkSportForm() {
    const router = useRouter();
    const { refreshCatalog } = useCatalog();
    const [loading, setLoading] = useState(false);
    const [rawNames, setRawNames] = useState<string>('');

    const namesList = useMemo(() => {
        if (!rawNames) return [];
        return rawNames
            .split(/\r?\n/)
            .map(line => line.trim())
            .filter(line => line.length > 0);
    }, [rawNames]);

    const handleSubmit = async () => {
        if (namesList.length === 0) {
            toast.error('La lista está vacía');
            return;
        }

        setLoading(true);
        try {
            await api.post('/admin/sports/bulk', { names: rawNames });
            await refreshCatalog();
            toast.success('Deportes creados correctamente');
            router.push('/sports');
        } catch (error) {
            toast.error(handleError(error, 'Bulk Sport Create'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto p-6">
            <div className="flex items-center gap-4 mb-8">
                <button onClick={() => router.back()} className="p-2 hover:bg-white rounded-full transition shadow-sm">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Layers className="w-6 h-6 text-blue-600" /> Carga Masiva de Deportes
                    </h1>
                    <p className="text-sm text-slate-500">Copia y pega una lista desde Excel o Word.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Card className="p-6 space-y-4">
                        <label className="text-sm font-bold text-slate-900">Pega la lista de nombres (Uno por línea)</label>
                        <div className="relative">
                            <textarea
                                className="w-full h-96 p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none font-mono text-sm leading-relaxed shadow-inner resize-none"
                                placeholder={`Fútbol\nBaloncesto\nTenis\nNatación\n...`}
                                value={rawNames}
                                onChange={(e) => setRawNames(e.target.value)}
                            ></textarea>
                            <div className="absolute bottom-4 right-4 text-xs font-bold text-slate-500 bg-white/90 px-3 py-1.5 rounded-lg border shadow-sm pointer-events-none">
                                {namesList.length} líneas
                            </div>
                        </div>
                    </Card>
                </div>

                <div className="space-y-6 lg:sticky lg:top-6 h-fit">
                    <Card className="p-0 overflow-hidden bg-slate-900 text-white border-0">
                        <div className="p-6 border-b border-slate-700 bg-slate-800/50">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <List className="w-5 h-5 text-green-400" /> Resumen
                            </h3>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="flex justify-between items-center pb-4 border-b border-slate-700/50">
                                <span className="text-slate-400 uppercase text-xs font-bold">Total a crear</span>
                                <span className="text-4xl font-bold text-green-400">{namesList.length}</span>
                            </div>
                            <button
                                onClick={handleSubmit}
                                disabled={loading || namesList.length === 0}
                                className="w-full bg-white text-slate-900 py-3.5 rounded-xl font-bold hover:bg-blue-50 transition-all active:scale-95 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Procesando...' : 'Confirmar Creación'}
                            </button>
                        </div>
                    </Card>

                    <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 text-xs text-yellow-800">
                        <CheckCircle2 className="w-4 h-4 mb-2" />
                        Los Slugs se generarán automáticamente. Se omitirán nombres duplicados exactos.
                    </div>
                </div>
            </div>
        </div>
    );
}