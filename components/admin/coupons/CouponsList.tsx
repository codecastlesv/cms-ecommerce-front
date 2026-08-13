'use client';

import { useState } from 'react';
import Link from 'next/link';
import api from '@/lib/axios';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Percent, Tag, Search, Loader2, Edit2, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { PaginatedResponse } from '@/types';
import { Coupon } from '@/types/coupon';
import { formatDate } from '@/utils/date';
import { formatTime } from '@/utils/time';
import { useConfirm } from '@/components/providers/ConfirmDialogProvider';
import { handleError } from '@/lib/errorHandler';

export default function CouponList() {
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

    const confirm = useConfirm();

    const { data, isLoading, isError, refetch } = useQuery<PaginatedResponse<Coupon>>({
        queryKey: ['coupons', page, search],
        queryFn: async () => {
            const params = new URLSearchParams({ page: page.toString() });
            if (search) params.append('search', search);

            const res = await api.get('/admin/coupons', { params });
            return res.data;
        },
        staleTime: 60000,
    });

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Cupones</h1>
                    <p className="text-sm text-slate-500">Gestiona los cupones de descuento.</p>
                </div>

                <Link
                    href="/coupons/new"
                    className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-800"
                >
                    <Plus className="w-4 h-4" />
                    Nuevo cupón
                </Link>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex gap-4 items-center">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar cupón"
                            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 ring-slate-900 transition-shadow"
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Código</th>
                                <th className="px-6 py-4">Descuento</th>
                                <th className="px-6 py-4">Vigencia</th>
                                <th className="px-6 py-4">Estado</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center">
                                        <Loader2 className="animate-spin w-8 h-8 text-slate-300 mx-auto" />
                                    </td>
                                </tr>
                            ) : isError ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-red-500">
                                        Error al cargar cupones
                                    </td>
                                </tr>
                            ) : data?.data.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-slate-500">
                                        No hay cupones
                                    </td>
                                </tr>
                            ) : (
                                data?.data.map((coupon) => {
                                    const isExpired =
                                        coupon.ends_at && new Date(coupon.ends_at) < new Date();

                                    return (
                                        <tr key={coupon.id} className="hover:bg-slate-50 transition group">
                                            <td className="px-6 py-4 font-bold text-slate-900 flex items-center gap-2">
                                                <Tag className="w-4 h-4 text-slate-400" />
                                                {coupon.code}
                                            </td>

                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center gap-1 text-green-800 font-semibold">
                                                    {coupon.percentage}
                                                    <Percent className="w-4 h-4 text-green-800" />
                                                </span>
                                            </td>

                                            <td className="px-6 py-4 text-sm text-slate-500">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-4 h-4" />

                                                    {!coupon.starts_at && !coupon.ends_at
                                                        ? 'Sin fin'
                                                        : coupon.starts_at && coupon.ends_at
                                                            ? `${formatDate(coupon.starts_at)} ${formatTime(coupon.starts_at)} al ${formatDate(coupon.ends_at)} ${formatTime(coupon.ends_at)}`
                                                            : coupon.starts_at
                                                                ? `Desde ${formatDate(coupon.starts_at)} ${formatTime(coupon.starts_at)}`
                                                                : `Hasta ${formatDate(coupon.ends_at)} ${formatTime(coupon.ends_at)}`
                                                    }
                                                </div>
                                            </td>

                                            <td className="px-6 py-4">
                                                {coupon.is_active && !isExpired ? (
                                                    <span className="text-xs font-bold px-2 py-1 rounded-md bg-green-100 text-green-700">
                                                        Activo
                                                    </span>
                                                ) : (
                                                    <span className="text-xs font-bold px-2 py-1 rounded-md bg-red-100 text-red-700">
                                                        Inactivo / Vencido
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Link
                                                        href={`/coupons/${coupon.id}`}
                                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </Link>

                                                    <button
                                                        onClick={async () => {
                                                            confirm({
                                                                title: '¿Eliminar cupón?',
                                                                message: 'Esta acción eliminará el cupón. Es irreversible.',
                                                                variant: 'danger',
                                                                confirmText: 'Sí, eliminar',
                                                                onConfirm: async () => {
                                                                    try {
                                                                        await api.delete(`/admin/coupons/${coupon.id}`);
                                                                        toast.success('Cupón eliminado');
                                                                        refetch();
                                                                    } catch (error) {
                                                                        toast.error(handleError(error, 'Eliminar Cupón'));
                                                                    }
                                                                }
                                                            });
                                                            
                                                        }}
                                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
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
        </div>
    );
}