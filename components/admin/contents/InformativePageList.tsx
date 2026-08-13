'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/axios';
import { Edit2, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { InformativePageListItem } from '@/types';
import { handleError } from '@/lib/errorHandler';

export default function InformativePageList() {
    const [pages, setPages] = useState<InformativePageListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const fetchPages = async () => {
        setLoading(true);
        try {
            const { data } = await api.get<{ data: InformativePageListItem[] }>('/admin/informative-pages');
            setPages(data.data);
        } catch (error) {
            toast.error(handleError(error, 'Cargar páginas'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPages();
    }, []);

    const filtered = pages.filter((p) => {
        const q = search.toLowerCase();
        return (
            p.title.toLowerCase().includes(q) ||
            p.slug.toLowerCase().includes(q)
        );
    });

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-6 relative pb-24">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Contenidos</h1>
                    <p className="text-sm text-slate-500">{pages.length} páginas registradas</p>
                </div>
            </div>

            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                    type="text"
                    placeholder="Buscar por título o slug..."
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
                                <th className="px-6 py-3">Jerarquía</th>
                                <th className="px-6 py-3 w-40">Estado</th>
                                <th className="px-6 py-3 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={3} className="p-8 text-center">
                                        <Loader2 className="animate-spin inline text-slate-400 w-8 h-8" />
                                    </td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="p-8 text-center text-slate-500">
                                        No se encontraron resultados.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((page) => (
                                    <tr
                                        key={page.slug}
                                        className="hover:bg-slate-50 transition-colors group"
                                    >
                                        <td className="px-6 py-3">
                                            <div className="font-bold text-slate-800">{page.title}</div>
                                            <div className="text-xs text-slate-400 font-mono">/{page.slug}</div>
                                        </td>
                                        <td className="px-6 py-3">
                                            {page.is_active ? (
                                                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                                                    Visible
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600 ring-1 ring-inset ring-slate-500/20">
                                                    Borrador
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Link
                                                    href={`/contents/${encodeURIComponent(page.slug)}`}
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </Link>
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
    );
}
