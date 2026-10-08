'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Loader2, Link2, Package } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/axios';
import { handleError } from '@/lib/errorHandler';
import PermissionGate from '@/components/auth/PermissionGate';
import { usePermission } from '@/hooks/usePermission';
import { PaginatedResponse } from '@/types';
import Pagination from '@/components/ui/Pagination';
import { useDebounce } from '@/hooks/useDebounce';
import { formatDateDMY } from '@/utils/date';

interface CampaignRow {
    id: number;
    name: string;
    slug: string;
    starts_at: string | null;
    ends_at: string | null;
    is_active: boolean;
    products_count: number;
    links_count: number;
}

function statusOf(row: CampaignRow): { label: string; className: string } {
    if (!row.is_active) return { label: 'Inactiva', className: 'bg-red-50 text-red-700' };
    if (row.ends_at && new Date(row.ends_at) < new Date()) return { label: 'Finalizada', className: 'bg-slate-100 text-slate-600' };
    if (row.starts_at && new Date(row.starts_at) > new Date()) return { label: 'Programada', className: 'bg-blue-50 text-blue-700' };
    return { label: 'Activa', className: 'bg-green-50 text-green-700' };
}

export default function CampaignList() {
    const { can } = usePermission();
    const canEdit = can('edit_campaigns');
    const queryClient = useQueryClient();

    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const debouncedSearch = useDebounce(search, 300);

    const params = useMemo(() => {
        const p: Record<string, string | number> = { page };
        if (debouncedSearch.trim()) p.search = debouncedSearch.trim();
        return p;
    }, [page, debouncedSearch]);

    const { data, isLoading } = useQuery<PaginatedResponse<CampaignRow>>({
        queryKey: ['campaigns', params],
        queryFn: async () => {
            const res = await api.get('/admin/campaigns', { params });
            return res.data;
        },
        staleTime: 30000,
        placeholderData: (previous) => previous,
    });

    const toggleStatus = useMutation({
        mutationFn: async (id: number) => {
            const res = await api.patch(`/admin/campaigns/${id}/toggle-status`);
            return res.data;
        },
        onSuccess: (res) => {
            queryClient.setQueryData<PaginatedResponse<CampaignRow>>(['campaigns', params], (old) =>
                old
                    ? { ...old, data: old.data.map((c) => (c.id === res.data.id ? { ...c, is_active: res.data.is_active } : c)) }
                    : old
            );
            toast.success(res.message);
        },
        onError: (error) => toast.error(handleError(error, 'No se pudo cambiar el estado')),
    });

    const campaigns = data?.data ?? [];

    return (
        <PermissionGate permission="view_campaigns">
            <div className="max-w-7xl mx-auto p-6 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Campañas</h1>
                        <p className="text-sm text-slate-500">Promociones con landing, enlaces de canal y seguimiento en GA.</p>
                    </div>
                    {canEdit ? (
                        <Link
                            href="/campaigns/create"
                            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
                        >
                            <Plus className="w-4 h-4" /> Nueva Campaña
                        </Link>
                    ) : null}
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar campaña…"
                            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 ring-slate-900 transition-shadow"
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                        />
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 border-b border-slate-100">
                                    <th className="px-4 py-3 font-bold">Campaña</th>
                                    <th className="px-4 py-3 font-bold whitespace-nowrap">Vigencia</th>
                                    <th className="px-4 py-3 font-bold">Productos</th>
                                    <th className="px-4 py-3 font-bold">Enlaces</th>
                                    <th className="px-4 py-3 font-bold">Estado</th>
                                    <th className="px-4 py-3 font-bold"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                                            <Loader2 className="w-5 h-5 animate-spin inline-block" />
                                        </td>
                                    </tr>
                                ) : campaigns.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                                            No hay campañas todavía.
                                        </td>
                                    </tr>
                                ) : (
                                    campaigns.map((row) => {
                                        const status = statusOf(row);
                                        return (
                                            <tr key={row.id} className="border-b border-slate-50 last:border-none hover:bg-slate-50/60">
                                                <td className="px-4 py-3 align-top">
                                                    <div className="font-semibold text-slate-900">{row.name}</div>
                                                    <div className="text-xs text-slate-400">/promos/{row.slug}</div>
                                                </td>
                                                <td className="px-4 py-3 align-top text-xs text-slate-600 whitespace-nowrap">
                                                    {row.starts_at ? formatDateDMY(row.starts_at) : '—'} – {row.ends_at ? formatDateDMY(row.ends_at) : '—'}
                                                </td>
                                                <td className="px-4 py-3 align-top text-xs text-slate-600">
                                                    <span className="inline-flex items-center gap-1"><Package className="w-3.5 h-3.5 text-slate-400" /> {row.products_count}</span>
                                                </td>
                                                <td className="px-4 py-3 align-top text-xs text-slate-600">
                                                    <span className="inline-flex items-center gap-1"><Link2 className="w-3.5 h-3.5 text-slate-400" /> {row.links_count}</span>
                                                </td>
                                                <td className="px-4 py-3 align-top">
                                                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ${status.className}`}>
                                                        {status.label}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 align-top text-right">
                                                    <div className="inline-flex items-center gap-3 whitespace-nowrap">
                                                        {canEdit ? (
                                                            <Link href={`/campaigns/${row.id}`} className="text-xs font-bold text-[#304C94]">
                                                                Editar
                                                            </Link>
                                                        ) : null}
                                                        {canEdit ? (
                                                            <>
                                                                <span className="text-slate-200">·</span>
                                                                <button
                                                                    type="button"
                                                                    disabled={toggleStatus.isPending}
                                                                    onClick={() => toggleStatus.mutate(row.id)}
                                                                    className={`text-xs font-bold ${row.is_active ? 'text-red-600' : 'text-green-700'}`}
                                                                >
                                                                    {row.is_active ? 'Desactivar' : 'Activar'}
                                                                </button>
                                                            </>
                                                        ) : null}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    <Pagination meta={data} onPageChange={setPage} />
                </div>
            </div>
        </PermissionGate>
    );
}
