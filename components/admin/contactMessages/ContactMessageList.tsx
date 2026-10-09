'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/axios';
import { handleError } from '@/lib/errorHandler';
import PermissionGate from '@/components/auth/PermissionGate';
import { usePermission } from '@/hooks/usePermission';
import { PaginatedResponse } from '@/types';
import Pagination from '@/components/ui/Pagination';
import { useDebounce } from '@/hooks/useDebounce';
import { formatDateDMY } from '@/utils/date';

type MessageStatus = 'pendiente' | 'atendido';

interface ContactMessage {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    subject: string;
    message: string;
    status: MessageStatus;
    created_at: string;
}

const SUBJECTS = ['Consulta general', 'Estado de un pedido', 'Garantías', 'Devoluciones', 'Ventas corporativas / mayoreo', 'Otro'];

const STATUS_LABELS: Record<MessageStatus, string> = {
    pendiente: 'Pendiente',
    atendido: 'Atendido',
};

const STATUS_CLASSES: Record<MessageStatus, string> = {
    pendiente: 'bg-red-50 text-red-700',
    atendido: 'bg-green-50 text-green-700',
};

export default function ContactMessageList() {
    const { can } = usePermission();
    const canEdit = can('edit_contact_messages');
    const queryClient = useQueryClient();

    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [subjectFilter, setSubjectFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const debouncedSearch = useDebounce(search, 300);

    const params = useMemo(() => {
        const p: Record<string, string | number> = { page };
        if (debouncedSearch.trim()) p.search = debouncedSearch.trim();
        if (subjectFilter) p.subject = subjectFilter;
        if (statusFilter) p.status = statusFilter;
        return p;
    }, [page, debouncedSearch, subjectFilter, statusFilter]);

    const { data, isLoading } = useQuery<PaginatedResponse<ContactMessage>>({
        queryKey: ['contact-messages', params],
        queryFn: async () => {
            const res = await api.get('/admin/contact-messages', { params });
            return res.data;
        },
        staleTime: 30000,
        placeholderData: (previous) => previous,
    });

    const updateStatus = useMutation({
        mutationFn: async ({ id, status }: { id: number; status: MessageStatus }) => {
            const res = await api.patch(`/admin/contact-messages/${id}/status`, { status });
            return res.data;
        },
        onSuccess: (_data, variables) => {
            queryClient.setQueryData<PaginatedResponse<ContactMessage>>(['contact-messages', params], (old) =>
                old
                    ? { ...old, data: old.data.map((m) => (m.id === variables.id ? { ...m, status: variables.status } : m)) }
                    : old
            );
            toast.success('Estado actualizado');
        },
        onError: (error) => toast.error(handleError(error, 'No se pudo actualizar el estado')),
    });

    const messages = data?.data ?? [];

    return (
        <PermissionGate permission="view_contact_messages">
            <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Mensajes de Contacto</h1>
                    <p className="text-sm text-slate-500">Lo que llega desde el formulario público de Contáctanos.</p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex flex-wrap gap-3 items-center">
                        <div className="relative flex-1 min-w-[220px]">
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar por nombre, correo o mensaje…"
                                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 ring-slate-900 transition-shadow"
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setPage(1);
                                }}
                            />
                        </div>

                        <select
                            className="px-3 py-2 text-xs font-medium bg-white border border-slate-200 rounded-xl shadow-sm outline-none cursor-pointer text-slate-600 focus:ring-2 focus:ring-slate-200"
                            value={subjectFilter}
                            onChange={(e) => {
                                setSubjectFilter(e.target.value);
                                setPage(1);
                            }}
                        >
                            <option value="">Todos los motivos</option>
                            {SUBJECTS.map((s) => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>

                        <select
                            className="px-3 py-2 text-xs font-medium bg-white border border-slate-200 rounded-xl shadow-sm outline-none cursor-pointer text-slate-600 focus:ring-2 focus:ring-slate-200"
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setPage(1);
                            }}
                        >
                            <option value="">Todos los estados</option>
                            <option value="pendiente">Pendiente</option>
                            <option value="atendido">Atendido</option>
                        </select>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 border-b border-slate-100">
                                    <th className="px-4 py-3 font-bold">Contacto</th>
                                    <th className="px-4 py-3 font-bold">Motivo</th>
                                    <th className="px-4 py-3 font-bold">Mensaje</th>
                                    <th className="px-4 py-3 font-bold whitespace-nowrap">Fecha</th>
                                    <th className="px-4 py-3 font-bold">Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                                            <Loader2 className="w-5 h-5 animate-spin inline-block" />
                                        </td>
                                    </tr>
                                ) : messages.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                                            No hay mensajes con estos filtros.
                                        </td>
                                    </tr>
                                ) : (
                                    messages.map((m) => (
                                        <tr key={m.id} className="border-b border-slate-50 last:border-none hover:bg-slate-50/60">
                                            <td className="px-4 py-3 align-top">
                                                <div className="font-semibold text-slate-900">{m.name}</div>
                                                <div className="text-xs text-slate-400">{m.email}</div>
                                                {m.phone ? <div className="text-xs text-slate-400">{m.phone}</div> : null}
                                            </td>
                                            <td className="px-4 py-3 align-top">
                                                <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700">
                                                    {m.subject}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 align-top text-xs text-slate-600 max-w-80">
                                                <p className="line-clamp-2">{m.message}</p>
                                            </td>
                                            <td className="px-4 py-3 align-top text-xs text-slate-500 whitespace-nowrap">
                                                {formatDateDMY(m.created_at)}
                                            </td>
                                            <td className="px-4 py-3 align-top">
                                                {canEdit ? (
                                                    <select
                                                        value={m.status}
                                                        disabled={updateStatus.isPending}
                                                        onChange={(e) =>
                                                            updateStatus.mutate({ id: m.id, status: e.target.value as MessageStatus })
                                                        }
                                                        className={`rounded-full border-0 px-2.5 py-1 text-[11px] font-bold outline-none cursor-pointer ${STATUS_CLASSES[m.status]}`}
                                                    >
                                                        {(Object.keys(STATUS_LABELS) as MessageStatus[]).map((status) => (
                                                            <option key={status} value={status}>
                                                                {STATUS_LABELS[status]}
                                                            </option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ${STATUS_CLASSES[m.status]}`}>
                                                        {STATUS_LABELS[m.status]}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
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
