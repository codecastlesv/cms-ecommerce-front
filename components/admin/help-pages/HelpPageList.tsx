'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Loader2, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/axios';
import { handleError } from '@/lib/errorHandler';
import PermissionGate from '@/components/auth/PermissionGate';
import { usePermission } from '@/hooks/usePermission';

interface HelpPageRow {
    id: number;
    title: string;
    slug: string;
    body: string | null;
    meta_title: string | null;
    meta_description: string | null;
    show_toc: boolean;
    is_active: boolean;
}

export default function HelpPageList() {
    const { can } = usePermission();
    const canEdit = can('edit_help_pages');
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');

    const { data, isLoading } = useQuery<{ data: HelpPageRow[] }>({
        queryKey: ['help-pages'],
        queryFn: async () => {
            const res = await api.get('/admin/help-pages');
            return res.data;
        },
        staleTime: 30000,
    });

    const pages = useMemo(() => {
        const all = data?.data ?? [];
        const q = search.trim().toLowerCase();
        if (!q) return all;
        return all.filter((p) => p.title.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q));
    }, [data, search]);

    const toggleActive = useMutation({
        mutationFn: async (row: HelpPageRow) => {
            const res = await api.put(`/admin/help-pages/${row.id}`, {
                title: row.title,
                slug: row.slug,
                body: row.body,
                meta_title: row.meta_title,
                meta_description: row.meta_description,
                show_toc: row.show_toc,
                is_active: !row.is_active,
            });
            return res.data;
        },
        onSuccess: (res) => {
            queryClient.setQueryData<{ data: HelpPageRow[] }>(['help-pages'], (old) =>
                old ? { data: old.data.map((p) => (p.id === res.data.id ? res.data : p)) } : old
            );
            toast.success(res.message);
        },
        onError: (error) => toast.error(handleError(error, 'No se pudo cambiar el estado')),
    });

    const deletePage = useMutation({
        mutationFn: async (id: number) => {
            const res = await api.delete(`/admin/help-pages/${id}`);
            return res.data;
        },
        onSuccess: (_res, id) => {
            queryClient.setQueryData<{ data: HelpPageRow[] }>(['help-pages'], (old) =>
                old ? { data: old.data.filter((p) => p.id !== id) } : old
            );
            toast.success('Página eliminada');
        },
        onError: (error) => toast.error(handleError(error, 'No se pudo eliminar la página')),
    });

    const confirmDelete = (row: HelpPageRow) => {
        if (window.confirm(`¿Eliminar la página "${row.title}"? Esta acción no se puede deshacer.`)) {
            deletePage.mutate(row.id);
        }
    };

    return (
        <PermissionGate permission="view_help_pages">
            <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Páginas de Ayuda</h1>
                        <p className="text-sm text-slate-500">Envíos, devoluciones, garantías, términos y privacidad — todas en una sola tabla.</p>
                    </div>
                    {canEdit ? (
                        <Link
                            href="/help-pages/create"
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800 sm:w-auto"
                        >
                            <Plus className="w-4 h-4" /> Nueva página
                        </Link>
                    ) : null}
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar por título o slug…"
                            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 ring-slate-900 transition-shadow"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 border-b border-slate-100">
                                    <th className="px-4 py-3 font-bold">Página</th>
                                    <th className="px-4 py-3 font-bold whitespace-nowrap">Índice lateral</th>
                                    <th className="px-4 py-3 font-bold">Estado</th>
                                    <th className="px-4 py-3 font-bold"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-10 text-center text-slate-400">
                                            <Loader2 className="w-5 h-5 animate-spin inline-block" />
                                        </td>
                                    </tr>
                                ) : pages.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-10 text-center text-slate-400">
                                            No hay páginas de ayuda todavía.
                                        </td>
                                    </tr>
                                ) : (
                                    pages.map((row) => (
                                        <tr key={row.id} className="border-b border-slate-50 last:border-none hover:bg-slate-50/60">
                                            <td className="px-4 py-3 align-top">
                                                <div className="font-semibold text-slate-900">{row.title}</div>
                                                <div className="text-xs text-slate-400 font-mono">/ayuda/{row.slug}</div>
                                            </td>
                                            <td className="px-4 py-3 align-top">
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ${
                                                        row.show_toc ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-400'
                                                    }`}
                                                >
                                                    {row.show_toc ? 'Sí' : 'No'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 align-top">
                                                {canEdit ? (
                                                    <button
                                                        type="button"
                                                        disabled={toggleActive.isPending}
                                                        onClick={() => toggleActive.mutate(row)}
                                                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold transition ${
                                                            row.is_active ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'
                                                        }`}
                                                    >
                                                        {row.is_active ? 'Activa' : 'Inactiva'}
                                                    </button>
                                                ) : (
                                                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ${row.is_active ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                                        {row.is_active ? 'Activa' : 'Inactiva'}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 align-top text-right">
                                                <div className="inline-flex items-center gap-2 whitespace-nowrap">
                                                    {canEdit ? (
                                                        <>
                                                            <Link
                                                                href={`/help-pages/${row.id}`}
                                                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
                                                                title="Editar"
                                                            >
                                                                <Pencil className="w-3.5 h-3.5" />
                                                            </Link>
                                                            <button
                                                                type="button"
                                                                onClick={() => confirmDelete(row)}
                                                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                                                                title="Eliminar"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </>
                                                    ) : null}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </PermissionGate>
    );
}
