'use client';

import Link from 'next/link';
import api from '@/lib/axios';
import { Edit2, Trash2, Plus, Tag, Palette, List, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useConfirm } from '@/components/providers/ConfirmDialogProvider';
import { usePermission } from '@/hooks/usePermission';
import { useQuery } from '@tanstack/react-query';
import { Attribute, PaginatedResponse } from '@/types';
import { handleError } from '@/lib/errorHandler';
import { useCatalog } from '@/components/providers/CatalogContext';

export default function AttributeList() {
    const confirm = useConfirm();
    const { can } = usePermission();
    const { refreshCatalog } = useCatalog();

    const { data: attributes, isLoading, refetch, isError } = useQuery<Attribute[]>({
        queryKey: ['attributes'],
        queryFn: async () => {
            const res = await api.get<PaginatedResponse<Attribute>>('/admin/attributes');
            return Array.isArray(res.data) ? res.data : (res.data as any).data;
        },
        staleTime: 1000 * 60 * 5,
    });

    const handleDelete = (id: number) => {
        if (!can('delete_attributes')) return;
        confirm({
            title: '¿Eliminar atributo?',
            message: 'Esta acción es irreversible. Se eliminarán todas las variantes asociadas en los productos.',
            variant: 'danger',
            confirmText: 'Sí, Eliminar',
            onConfirm: async () => {
                try {
                    await api.delete(`/admin/attributes/${id}`);
                    await refreshCatalog();
                    toast.success('Atributo eliminado correctamente');
                    refetch();
                } catch (error) {
                    toast.error(handleError(error, 'Eliminar Atributo'));
                }
            }
        });
    };

    const getTypeBadge = (type: string) => {
        switch (type) {
            case 'color':
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200"><Palette className="w-3 h-3" /> COLOR</span>;
            case 'button':
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200"><Tag className="w-3 h-3" /> BOTÓN</span>;
            default:
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200"><List className="w-3 h-3" /> LISTA</span>;
        }
    };

    if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-slate-300" /></div>;
    if (isError) return <div className="p-8 text-center text-red-500">Error al cargar atributos.</div>;

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Atributos de Producto</h1>
                    <p className="text-sm text-slate-500">Gestiona las variantes disponibles (tallas, colores, materiales).</p>
                </div>
                {can('create_attributes') && (
                    <Link href="/attributes/create" className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center hover:bg-slate-800 shadow-lg shadow-slate-900/10 active:scale-95 transition-all">
                        <Plus className="w-4 h-4 mr-2" /> Nuevo Atributo
                    </Link>
                )}
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        <tr>
                            <th className="px-6 py-4">Nombre</th>
                            <th className="px-6 py-4 w-40">Tipo Visual</th>
                            <th className="px-6 py-4">Valores de Muestra</th>
                            <th className="px-6 py-4 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {attributes && attributes.length > 0 ? (
                            attributes.map(attr => (
                                <tr key={attr.id} className="hover:bg-slate-50/80 transition-colors group">
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-slate-800 text-sm">{attr.name}</p>
                                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {attr.id}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        {getTypeBadge(attr.type)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-1.5 flex-wrap items-center">
                                            {attr.values.slice(0, 5).map(val => (
                                                <span key={val.id} className="inline-flex items-center px-2 py-1 rounded-md border border-slate-200 bg-white text-xs text-slate-600 shadow-sm" title={val.value}>
                                                    {attr.type === 'color' && (
                                                        <span
                                                            className="w-2.5 h-2.5 rounded-full mr-1.5 border border-slate-200"
                                                            style={{
                                                                backgroundColor: val.color_hex || '#000',
                                                                backgroundImage: val.swatch_image_url ? `url(${val.swatch_image_url})` : undefined,
                                                                backgroundSize: 'cover'
                                                            }}
                                                        />
                                                    )}
                                                    {val.value}
                                                </span>
                                            ))}
                                            {attr.values.length > 5 && (
                                                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded ml-1">
                                                    +{attr.values.length - 5}
                                                </span>
                                            )}
                                            {attr.values.length === 0 && <span className="text-xs text-slate-400 italic">Sin valores</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {can('edit_attributes') && (
                                                <Link href={`/attributes/${attr.id}`} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                    <Edit2 className="w-4 h-4" />
                                                </Link>
                                            )}
                                            {can('delete_attributes') && (
                                                <button onClick={() => handleDelete(attr.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={4} className="p-12 text-center text-slate-400">
                                    <div className="flex flex-col items-center gap-2">
                                        <AlertTriangle className="w-8 h-8 opacity-20" />
                                        <p>No se encontraron atributos configurados.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}