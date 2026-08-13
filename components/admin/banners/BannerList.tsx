'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { Plus, Trash2, Edit, ExternalLink, ImageIcon, Search, Filter } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { useConfirm } from '@/components/providers/ConfirmDialogProvider';
import Can from '@/components/auth/Can';
import Pagination from '@/components/ui/Pagination';
import { Banner } from '@/types';


interface BannerListProps {
    embedded?: boolean;
}

export default function BannerList({ embedded = false }: BannerListProps) {
    const confirm = useConfirm();

    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const { data, isLoading, refetch } = useQuery({
        queryKey: ['banners', page, search, statusFilter],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: page.toString(),
                search,
                status: statusFilter
            });
            const { data } = await api.get(`/admin/banners?${params.toString()}`);
            return data;
        },
        placeholderData: (previousData) => previousData
    });

    const banners = data?.data || [];
    const meta = data?.meta || {};

    const handleDelete = (id: number) => {
        confirm({
            title: '¿Eliminar Banner?',
            message: 'El banner se eliminará permanentemente.',
            variant: 'danger',
            onConfirm: async () => {
                try {
                    await api.delete(`/admin/banners/${id}`);
                    toast.success('Banner eliminado');
                    refetch();
                } catch (error) { toast.error('Error al eliminar'); }
            }
        });
    };

    return (
        <div className={embedded ? "" : "max-w-7xl mx-auto p-6 space-y-6"}>

            {!embedded && (
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Gestión de Banners</h1>
                        <p className="text-sm text-slate-500">Crea y administra los banners publicitarios.</p>
                    </div>
                    <Can permission="create_banners">
                        <Link href="/admin/banners/create" className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center hover:bg-slate-800 shadow-lg transition">
                            <Plus className="w-4 h-4 mr-2" /> Nuevo Banner
                        </Link>
                    </Can>
                </div>
            )}

            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar por título..."
                        className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    />
                </div>
                <div className="relative w-full md:w-48">
                    <Filter className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <select
                        className="w-full pl-9 pr-8 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm appearance-none bg-white"
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                    >
                        <option value="all">Todos</option>
                        <option value="active">Activos</option>
                        <option value="inactive">Inactivos</option>
                    </select>
                </div>
            </div>

            <Card className="overflow-hidden">
                {isLoading ? (
                    <div className="p-20 text-center text-slate-400">Cargando banners...</div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-4">Imagen</th>
                                        <th className="px-6 py-4">Información</th>
                                        <th className="px-6 py-4">CTA</th>
                                        <th className="px-6 py-4">Estado</th>
                                        <th className="px-6 py-4 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {banners.length > 0 ? (
                                        banners.map((banner: Banner) => (
                                            <tr key={banner.id} className="hover:bg-slate-50/50 transition">
                                                <td className="px-6 py-4">
                                                    <div className="w-24 h-14 bg-slate-100 rounded overflow-hidden border border-slate-200 relative">
                                                        {banner.images.desktop ? (
                                                            <img src={banner.images.desktop} alt={banner.title} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                                <ImageIcon className="w-6 h-6" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-slate-900">{banner.title}</div>
                                                    {banner.headline && <div className="text-xs text-slate-500 truncate max-w-[200px]">{banner.headline}</div>}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {banner.cta?.text ? (
                                                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200">
                                                            {banner.cta.text}
                                                        </span>
                                                    ) : <span className="text-slate-300 text-xs">-</span>}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {banner.is_active ? <Badge variant="success">Activo</Badge> : <Badge variant="neutral">Inactivo</Badge>}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Can permission="edit_banners">
                                                            <Link href={`/banners/${banner.id}`} className="p-1.5 hover:bg-slate-100 rounded text-slate-500 transition">
                                                                <Edit className="w-4 h-4" />
                                                            </Link>
                                                        </Can>
                                                        <Can permission="delete_banners">
                                                            <button onClick={() => handleDelete(banner.id)} className="p-1.5 hover:bg-red-50 rounded text-slate-400 hover:text-red-600 transition">
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </Can>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="text-center py-12 text-slate-400">
                                                No se encontraron resultados.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <Pagination meta={meta} onPageChange={setPage} />
                    </>
                )}
            </Card>
        </div>
    );
}