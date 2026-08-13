'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/axios';
import { Edit2, Trash2, Plus, Star, Search, Loader2, Layers, CheckSquare, Square } from 'lucide-react';
import { toast } from 'sonner';
import { useConfirm } from '@/components/providers/ConfirmDialogProvider';
import { usePermission } from '@/hooks/usePermission';
import { LaravelResource, Sport } from '@/types';
import { handleError } from '@/lib/errorHandler';
import { useCatalog } from '@/components/providers/CatalogContext';

export default function SportList() {
    const [sports, setSports] = useState<Sport[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    const confirm = useConfirm();
    const { can } = usePermission();
    const { refreshCatalog } = useCatalog();

    const fetchSports = async () => {
        setLoading(true);
        try {
            const { data } = await api.get<LaravelResource<Sport[]>>('/admin/sports');
            setSports(data.data);
            setSelectedIds([]);
        } catch (error) {
            toast.error(handleError(error, 'Cargar Deportes'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchSports(); }, []);


    const filtered = sports.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

    const toggleSelectAll = () => {
        if (selectedIds.length === filtered.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filtered.map(s => s.id));
        }
    };

    const toggleSelectOne = (id: number) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(prev => prev.filter(item => item !== id));
        } else {
            setSelectedIds(prev => [...prev, id]);
        }
    };


    const handleDelete = (id: number) => {
        if (!can('delete_sports')) return;
        confirm({
            title: '¿Eliminar deporte?',
            message: 'Esta acción es irreversible.',
            variant: 'danger',
            onConfirm: async () => {
                try {
                    await api.delete(`/admin/sports/${id}`);
                    await refreshCatalog();
                    toast.success('Deporte eliminado');
                    fetchSports();
                } catch (error) {
                    toast.error(handleError(error, 'Eliminar Deporte'));
                }
            }
        });
    };

    const handleBulkDelete = () => {
        if (!can('delete_sports')) return;
        confirm({
            title: `¿Eliminar ${selectedIds.length} deportes?`,
            message: 'Se eliminarán todos los deportes seleccionados.',
            variant: 'danger',
            onConfirm: async () => {
                try {
                    await api.post('/admin/sports/bulk-delete', { ids: selectedIds });
                    await refreshCatalog();
                    toast.success('Deportes eliminados');
                    fetchSports();
                } catch (error) {
                    toast.error(handleError(error, 'Eliminación Masiva'));
                }
            }
        });
    };

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-6 relative pb-24">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Deportes</h1>
                    <p className="text-sm text-slate-500">{sports.length} deportes registrados</p>
                </div>

                <div className="flex gap-2">
                    {can('create_sports') && (
                        <Link href="/sports/bulk" className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold flex items-center hover:bg-slate-50 transition-all shadow-sm">
                            <Layers className="w-4 h-4 mr-2" /> Carga Masiva
                        </Link>
                    )}
                    {can('create_sports') && (
                        <Link href="/sports/create" className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center hover:bg-slate-800 shadow-lg active:scale-95 transition-all">
                            <Plus className="w-4 h-4 mr-2" /> Nuevo
                        </Link>
                    )}
                </div>
            </div>

            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                    type="text"
                    placeholder="Buscar deporte..."
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 ring-slate-900 shadow-sm"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                        <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
                            <tr>
                                <th className="px-4 py-3 w-10 text-center">
                                    <button onClick={toggleSelectAll} className="text-slate-400 hover:text-slate-600">
                                        {selectedIds.length > 0 && selectedIds.length === filtered.length
                                            ? <CheckSquare className="w-5 h-5 text-blue-600" />
                                            : <Square className="w-5 h-5" />}
                                    </button>
                                </th>
                                <th className="px-6 py-3 w-20">Icono</th>
                                <th className="px-6 py-3">Nombre</th>
                                <th className="px-6 py-3 text-center w-24">Destacado</th>
                                <th className="px-6 py-3 text-center w-24">Productos</th>
                                <th className="px-6 py-3 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={6} className="p-8 text-center"><Loader2 className="animate-spin inline text-slate-400 w-8 h-8" /></td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={6} className="p-8 text-center text-slate-500">No se encontraron resultados.</td></tr>
                            ) : (
                                filtered.map(sport => {
                                    const isSelected = selectedIds.includes(sport.id);
                                    return (
                                        <tr key={sport.id} className={`hover:bg-slate-50 transition-colors group ${isSelected ? 'bg-blue-50/50' : ''}`}>
                                            <td className="px-4 py-3 text-center">
                                                <button onClick={() => toggleSelectOne(sport.id)} className="text-slate-300 hover:text-blue-500">
                                                    {isSelected
                                                        ? <CheckSquare className="w-5 h-5 text-blue-600" />
                                                        : <Square className="w-5 h-5" />}
                                                </button>
                                            </td>
                                            <td className="px-6 py-3">
                                                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center overflow-hidden border border-slate-200 shrink-0">
                                                    {sport.icon ? (
                                                        <img src={sport.icon} alt={sport.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-[10px] text-slate-400 font-bold">N/A</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-3">
                                                <div className="font-bold text-slate-800">{sport.name}</div>
                                                <div className="text-xs text-slate-400 font-mono">/{sport.slug}</div>
                                            </td>
                                            <td className="px-6 py-3 text-center">
                                                {sport.is_featured && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 mx-auto" />}
                                            </td>
                                            <td className="px-6 py-3 text-center text-sm font-bold text-slate-600">
                                                {sport.products_count || 0}
                                            </td>
                                            <td className="px-6 py-3 text-right">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {can('edit_sports') && (
                                                        <Link href={`/sports/${sport.id}`} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                            <Edit2 className="w-4 h-4" />
                                                        </Link>
                                                    )}
                                                    {can('delete_sports') && (
                                                        <button onClick={() => handleDelete(sport.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedIds.length > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-6 animate-in slide-in-from-bottom-4 z-50">
                    <span className="text-sm font-bold">{selectedIds.length} seleccionados</span>
                    <div className="h-4 w-px bg-slate-700"></div>
                    {can('delete_sports') && (
                        <button
                            onClick={handleBulkDelete}
                            className="flex items-center gap-2 text-sm font-bold text-red-400 hover:text-red-300 transition-colors"
                        >
                            <Trash2 className="w-4 h-4" /> Eliminar Selección
                        </button>
                    )}
                    <button onClick={() => setSelectedIds([])} className="text-slate-500 hover:text-white transition-colors">
                        <span className="sr-only">Cancelar</span>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            )}
        </div>
    );
}