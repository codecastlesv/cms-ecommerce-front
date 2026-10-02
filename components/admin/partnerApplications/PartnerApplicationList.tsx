'use client';

import { Fragment, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, Download, Loader2, Tags, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/axios';
import { handleError } from '@/lib/errorHandler';
import PermissionGate from '@/components/auth/PermissionGate';
import { usePermission } from '@/hooks/usePermission';
import { PaginatedResponse } from '@/types';
import Pagination from '@/components/ui/Pagination';
import { useDebounce } from '@/hooks/useDebounce';
import { formatDateDMY } from '@/utils/date';

type PartnerType = 'distribuidor' | 'instalador';
type LegalType = 'natural' | 'juridica';
type PartnerStatus = 'pendiente' | 'contactado' | 'aprobado' | 'descartado';

interface PartnerApplication {
    id: number;
    type: PartnerType;
    applicant_name: string;
    contact_name: string | null;
    legal_type: LegalType;
    email: string;
    phone: string;
    location: string | null;
    product_lines: string[] | null;
    tax_registration: string | null;
    service_offered: string | null;
    service_area: string[] | null;
    status: PartnerStatus;
    created_at: string;
}

const STATUS_LABELS: Record<PartnerStatus, string> = {
    pendiente: 'Pendiente',
    contactado: 'Contactado',
    aprobado: 'Aprobado',
    descartado: 'Descartado',
};

const ZONE_LABELS: Record<string, string> = {
    zona_occidental: 'Zona Occidental',
    zona_central: 'Zona Central',
    zona_paracentral: 'Zona Paracentral',
    zona_oriental: 'Zona Oriental',
};

const STATUS_CLASSES: Record<PartnerStatus, string> = {
    pendiente: 'bg-slate-100 text-slate-600',
    contactado: 'bg-blue-50 text-blue-700',
    aprobado: 'bg-green-50 text-green-700',
    descartado: 'bg-red-50 text-red-700',
};

function TypeBadge({ type }: { type: PartnerType }) {
    const isDistribuidor = type === 'distribuidor';
    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ${
                isDistribuidor ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-50 text-amber-700'
            }`}
        >
            {isDistribuidor ? 'Distribuidor' : 'Instalador'}
        </span>
    );
}

function DetailCell({
    app,
    expanded,
    onToggleLines,
}: {
    app: PartnerApplication;
    expanded: boolean;
    onToggleLines: () => void;
}) {
    if (app.type === 'distribuidor') {
        return (
            <div className="text-xs text-slate-600 max-w-60">
                <div>{app.location}</div>
                {app.tax_registration ? <div className="text-slate-400">NIT/IVA: {app.tax_registration}</div> : null}
                {app.product_lines && app.product_lines.length > 0 ? (
                    <button
                        type="button"
                        onClick={onToggleLines}
                        aria-expanded={expanded}
                        className="mt-1 inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[10.5px] font-semibold text-indigo-700 transition hover:bg-indigo-100"
                    >
                        <Tags className="h-3 w-3" />
                        {app.product_lines.length} {app.product_lines.length === 1 ? 'línea' : 'líneas'}
                        <motion.span
                            animate={{ rotate: expanded ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                            className="flex"
                        >
                            <ChevronDown className="h-3 w-3" />
                        </motion.span>
                    </button>
                ) : null}
            </div>
        );
    }

    const zones = (app.service_area ?? []).map((z) => ZONE_LABELS[z] ?? z).join(', ');

    return (
        <div className="text-xs text-slate-600 max-w-60">
            {app.tax_registration ? <div className="text-slate-400">Reg. fiscal: {app.tax_registration}</div> : null}
            {zones ? <div className="text-slate-400">{zones}</div> : null}
            <div className="line-clamp-2">{app.service_offered}</div>
        </div>
    );
}

export default function PartnerApplicationList() {
    const { can } = usePermission();
    const canEdit = can('edit_partner_applications');
    const queryClient = useQueryClient();

    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [typeFilter, setTypeFilter] = useState('');
    const [legalFilter, setLegalFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [exporting, setExporting] = useState(false);
    const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
    const debouncedSearch = useDebounce(search, 300);

    const toggleExpand = (id: number) => {
        setExpandedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const params = useMemo(() => {
        const p: Record<string, string | number> = { page };
        if (debouncedSearch.trim()) p.search = debouncedSearch.trim();
        if (typeFilter) p.type = typeFilter;
        if (legalFilter) p.legal_type = legalFilter;
        if (statusFilter) p.status = statusFilter;
        return p;
    }, [page, debouncedSearch, typeFilter, legalFilter, statusFilter]);

    const { data, isLoading } = useQuery<PaginatedResponse<PartnerApplication>>({
        queryKey: ['partner-applications', params],
        queryFn: async () => {
            const res = await api.get('/admin/partner-applications', { params });
            return res.data;
        },
        staleTime: 30000,
        placeholderData: (previous) => previous,
    });

    const updateStatus = useMutation({
        mutationFn: async ({ id, status }: { id: number; status: PartnerStatus }) => {
            const res = await api.patch(`/admin/partner-applications/${id}/status`, { status });
            return res.data;
        },
        onSuccess: (_data, variables) => {
            queryClient.setQueryData<PaginatedResponse<PartnerApplication>>(
                ['partner-applications', params],
                (old) =>
                    old
                        ? {
                              ...old,
                              data: old.data.map((app) =>
                                  app.id === variables.id ? { ...app, status: variables.status } : app
                              ),
                          }
                        : old
            );
            toast.success('Estado actualizado');
        },
        onError: (error) => {
            toast.error(handleError(error, 'No se pudo actualizar el estado'));
        },
    });

    const handleExport = async () => {
        setExporting(true);
        try {
            const res = await api.get('/admin/partner-applications/export-excel', {
                params,
                responseType: 'blob',
            });
            const url = URL.createObjectURL(res.data);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'solicitudes_alianza.xlsx';
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
        } catch (error) {
            toast.error(handleError(error, 'No se pudo descargar el Excel'));
        } finally {
            setExporting(false);
        }
    };

    const applications = data?.data ?? [];

    return (
        <PermissionGate permission="view_partner_applications">
            <div className="max-w-7xl mx-auto p-6 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Distribuidores e Instaladores</h1>
                        <p className="text-sm text-slate-500">
                            Solicitudes de alianza recibidas desde el sitio web.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={handleExport}
                        disabled={exporting}
                        className="inline-flex items-center gap-2 rounded-xl bg-green-700 px-4 py-2.5 text-sm font-bold text-white transition hover:brightness-105 disabled:opacity-60"
                    >
                        {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        Descargar Excel
                    </button>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex flex-wrap gap-3 items-center">
                        <div className="relative flex-1 min-w-[220px]">
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar por nombre, email o teléfono"
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
                            value={typeFilter}
                            onChange={(e) => {
                                setTypeFilter(e.target.value);
                                setPage(1);
                            }}
                        >
                            <option value="">Todos los tipos</option>
                            <option value="distribuidor">Distribuidor</option>
                            <option value="instalador">Instalador</option>
                        </select>

                        <select
                            className="px-3 py-2 text-xs font-medium bg-white border border-slate-200 rounded-xl shadow-sm outline-none cursor-pointer text-slate-600 focus:ring-2 focus:ring-slate-200"
                            value={legalFilter}
                            onChange={(e) => {
                                setLegalFilter(e.target.value);
                                setPage(1);
                            }}
                        >
                            <option value="">Natural o jurídica</option>
                            <option value="natural">Natural</option>
                            <option value="juridica">Jurídica</option>
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
                            {(Object.keys(STATUS_LABELS) as PartnerStatus[]).map((status) => (
                                <option key={status} value={status}>
                                    {STATUS_LABELS[status]}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 border-b border-slate-100">
                                    <th className="px-4 py-3 font-bold">Tipo</th>
                                    <th className="px-4 py-3 font-bold">Solicitante</th>
                                    <th className="px-4 py-3 font-bold">Contacto</th>
                                    <th className="px-4 py-3 font-bold">Detalle</th>
                                    <th className="px-4 py-3 font-bold">Estado</th>
                                    <th className="px-4 py-3 font-bold whitespace-nowrap">Fecha</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                                            <Loader2 className="w-5 h-5 animate-spin inline-block" />
                                        </td>
                                    </tr>
                                ) : applications.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                                            No hay solicitudes con estos filtros.
                                        </td>
                                    </tr>
                                ) : (
                                    applications.map((app) => {
                                        const isExpanded = expandedIds.has(app.id);
                                        const hasLines = app.type === 'distribuidor' && (app.product_lines?.length ?? 0) > 0;

                                        return (
                                            <Fragment key={app.id}>
                                                <tr className="border-b border-slate-50 last:border-none hover:bg-slate-50/60">
                                                    <td className="px-4 py-3 align-top">
                                                        <TypeBadge type={app.type} />
                                                    </td>
                                                    <td className="px-4 py-3 align-top">
                                                        <div className="font-semibold text-slate-900">{app.applicant_name}</div>
                                                        <div className="text-xs text-slate-400">
                                                            {app.legal_type === 'natural' ? 'Persona natural' : 'Persona jurídica'}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 align-top text-xs text-slate-600">
                                                        {app.contact_name ? (
                                                            <div className="font-semibold text-slate-700">{app.contact_name}</div>
                                                        ) : null}
                                                        <div>{app.email}</div>
                                                        <div className="text-slate-400">{app.phone}</div>
                                                    </td>
                                                    <td className="px-4 py-3 align-top">
                                                        <DetailCell
                                                            app={app}
                                                            expanded={isExpanded}
                                                            onToggleLines={() => toggleExpand(app.id)}
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3 align-top">
                                                        {canEdit ? (
                                                            <select
                                                                value={app.status}
                                                                disabled={updateStatus.isPending}
                                                                onChange={(e) =>
                                                                    updateStatus.mutate({
                                                                        id: app.id,
                                                                        status: e.target.value as PartnerStatus,
                                                                    })
                                                                }
                                                                className={`rounded-full border-0 px-2.5 py-1 text-[11px] font-bold outline-none cursor-pointer ${STATUS_CLASSES[app.status]}`}
                                                            >
                                                                {(Object.keys(STATUS_LABELS) as PartnerStatus[]).map((status) => (
                                                                    <option key={status} value={status}>
                                                                        {STATUS_LABELS[status]}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        ) : (
                                                            <span
                                                                className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ${STATUS_CLASSES[app.status]}`}
                                                            >
                                                                {STATUS_LABELS[app.status]}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 align-top text-xs text-slate-500 whitespace-nowrap">
                                                        {formatDateDMY(app.created_at)}
                                                    </td>
                                                </tr>

                                                <AnimatePresence initial={false}>
                                                    {hasLines && isExpanded ? (
                                                        <motion.tr
                                                            initial={{ opacity: 0 }}
                                                            animate={{ opacity: 1 }}
                                                            exit={{ opacity: 0 }}
                                                            transition={{ duration: 0.2 }}
                                                            className="border-b border-slate-50 last:border-none bg-slate-50/40"
                                                        >
                                                            <td colSpan={6} className="px-4 py-0">
                                                                <motion.div
                                                                    initial={{ height: 0 }}
                                                                    animate={{ height: 'auto' }}
                                                                    exit={{ height: 0 }}
                                                                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                                                                    className="overflow-hidden"
                                                                >
                                                                    <div className="flex flex-wrap gap-1.5 py-3">
                                                                        {app.product_lines?.map((line) => (
                                                                            <span
                                                                                key={line}
                                                                                className="inline-flex items-center rounded-full bg-white border border-indigo-100 px-2.5 py-1 text-[11px] font-medium text-indigo-700"
                                                                            >
                                                                                {line}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                </motion.div>
                                                            </td>
                                                        </motion.tr>
                                                    ) : null}
                                                </AnimatePresence>
                                            </Fragment>
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
