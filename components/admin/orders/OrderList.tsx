'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/axios';
import { useQuery } from '@tanstack/react-query';
import { Calendar, User, Search, Loader2, Edit2 } from 'lucide-react';

import { PaginatedResponse } from '@/types';
import { Order } from '@/types/order';
import { getStatusConfig, ORDER_STATUS_SELECT_KEYS } from '@/utils/statusOrder';
import { formatDateDMY } from '@/utils/date';
import Pagination from '@/components/ui/Pagination';
import { useDebounce } from '@/hooks/useDebounce';

/** Número de documento Brilo (mfaNumDoc en respuesta, ej. OF01392). */
function resolveBriloMfaNumDoc(order: Order): string | null {
    const raw =
        order.brilo_mfa_num_doc ?? (order as { briloMfaNumDoc?: string }).briloMfaNumDoc;
    if (typeof raw !== 'string') {
        return null;
    }
    const trimmed = raw.trim();
    if (trimmed === '' || trimmed === '0') {
        return null;
    }

    return trimmed;
}

type OrdersListPayload = {
    data?: Order[];
    links?: {
        first?: string | null;
        last?: string | null;
        prev?: string | null;
        next?: string | null;
    };
    meta?: {
        current_page?: number;
        last_page?: number;
        per_page?: number;
        total?: number;
        from?: number | null;
        to?: number | null;
        path?: string;
    };
} & Partial<PaginatedResponse<Order>>;

function toSimplePaginationMeta(payload: OrdersListPayload | undefined) {
    if (!payload) {
        return null;
    }

    const meta = payload.meta;
    const links = payload.links;
    const currentPage = meta?.current_page ?? payload.current_page ?? 1;

    return {
        data: payload.data ?? [],
        current_page: currentPage,
        last_page: meta?.last_page ?? payload.last_page ?? 1,
        per_page: meta?.per_page ?? payload.per_page ?? 15,
        total: meta?.total ?? payload.total ?? 0,
        from: meta?.from ?? payload.from ?? 0,
        to: meta?.to ?? payload.to ?? 0,
        prev_page_url: links?.prev ?? payload.prev_page_url ?? undefined,
        next_page_url: links?.next ?? payload.next_page_url ?? undefined,
        has_more: Boolean(links?.next),
    };
}

export default function OrderList() {
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState('');
    const debouncedSearch = useDebounce(search, 200);

    const { data, isLoading, isError } = useQuery<OrdersListPayload>({
        queryKey: ['orders', page, debouncedSearch, statusFilter],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: page.toString(),
            });

            if (debouncedSearch.trim()) {
                params.append('search', debouncedSearch.trim());
            }
            if (statusFilter) {
                params.append('status', statusFilter);
            }

            const res = await api.get('/admin/orders', { params });
            return res.data;
        },
        staleTime: 60000,
        placeholderData: (previousData) => previousData,
    });

    const orders = data?.data ?? [];
    const paginationMeta = useMemo(() => toSimplePaginationMeta(data), [data]);

    return (
        <div className="max-w-7xl mx-auto">
            <div className="max-w-7xl mx-auto p-6 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Pedidos</h1>
                        <p className="text-sm text-slate-500">Gestiona los pedidos realizados.</p>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex gap-4 items-center">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar por N° pedido, UUID, ODF Brilo, cliente o email"
                                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 ring-slate-900 transition-shadow"
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setPage(1);
                                }}
                            />
                        </div>

                        <div className="relative min-w-[170px]">
                            <div
                                className={`absolute left-3 top-3.5 w-2 h-2 rounded-full ${
                                    statusFilter
                                        ? getStatusConfig(statusFilter).dotColor
                                        : 'bg-slate-300'
                                }`}
                            />

                            <select
                                className="w-full pl-7 pr-4 py-2 text-xs font-medium bg-white border border-slate-200 rounded-xl shadow-sm outline-none cursor-pointer text-slate-600 focus:ring-2 focus:ring-slate-200"
                                value={statusFilter}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value);
                                    setPage(1);
                                }}
                            >
                                <option value="">Estado: Todos</option>
                                {ORDER_STATUS_SELECT_KEYS.map((key) => (
                                    <option key={key} value={key}>
                                        {getStatusConfig(key).label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[920px]">
                            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-4 w-60">N° Pedido Web</th>
                                    <th className="px-6 py-4 w-36">Order ID (UUID)</th>
                                    <th className="px-6 py-4">ID Brilo ERP</th>
                                    <th className="px-6 py-4">Cliente</th>
                                    <th className="px-6 py-4">Total</th>
                                    <th className="px-6 py-4 text-center">Estado</th>
                                    <th className="px-6 py-4 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={7} className="p-12 text-center">
                                            <Loader2 className="animate-spin w-8 h-8 text-slate-300 mx-auto" />
                                        </td>
                                    </tr>
                                ) : isError ? (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-red-500">
                                            Error al cargar los pedidos.
                                        </td>
                                    </tr>
                                ) : orders.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-12 text-center text-slate-500">
                                            No se encontraron pedidos.
                                        </td>
                                    </tr>
                                ) : (
                                    orders.map((order) => {
                                        const statusConfig = getStatusConfig(order.status);
                                        const Icon = statusConfig.icon;
                                        const briloDoc = resolveBriloMfaNumDoc(order);
                                        const customerName =
                                            order.customer_name?.trim() ||
                                            order.user?.name?.trim() ||
                                            'Invitado';

                                        return (
                                            <tr
                                                key={order.id}
                                                className="hover:bg-slate-50 transition cursor-pointer group"
                                            >
                                                <td className="px-6 py-4">
                                                    <Link href={`/orders/${order.id}`} className="block">
                                                        <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                                            {order.number}
                                                        </span>
                                                        <div className="flex items-center text-xs text-slate-500 mt-1">
                                                            <Calendar className="w-3 h-3 mr-1" />
                                                            {formatDateDMY(order.created_at)}
                                                        </div>
                                                    </Link>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {order.uuid ? (
                                                        <span
                                                            className="block max-w-[120px] truncate font-mono text-xs text-gray-500"
                                                            title={order.uuid}
                                                        >
                                                            {order.uuid}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-slate-400">—</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {briloDoc ? (
                                                        <span
                                                            className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold tracking-wide text-slate-800"
                                                            title={`Documento Brilo: ${briloDoc}`}
                                                        >
                                                            {briloDoc}
                                                        </span>
                                                    ) : (
                                                        <span
                                                            className="text-xs text-slate-400"
                                                            title="Sin envío exitoso a Brilo o pendiente de sincronizar"
                                                        >
                                                            —
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center">
                                                        <User className="w-4 h-4 mr-2 text-slate-400" />
                                                        <span className="text-sm text-slate-800">
                                                            {customerName}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-xs text-slate-600">
                                                        $
                                                        {Number(order.total).toLocaleString('en-US', {
                                                            minimumFractionDigits: 2,
                                                        })}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={statusConfig.badgeClass}>
                                                        <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden />
                                                        {statusConfig.label}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3 text-right">
                                                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Link
                                                            href={`/orders/${order.id}`}
                                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="Ver detalle"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    <Pagination meta={paginationMeta} onPageChange={setPage} simple />
                </div>
            </div>
        </div>
    );
}
