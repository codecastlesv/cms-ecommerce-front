import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PaginatedResponse } from '@/types';

interface PaginationProps {
    meta: (PaginatedResponse<any> & {
        has_more?: boolean;
        next_page_url?: string | null;
        prev_page_url?: string | null;
    }) | undefined | null;
    onPageChange: (page: number) => void;
    /** Solo Anterior/Siguiente (compatible con Laravel simplePaginate). */
    simple?: boolean;
}

export default function Pagination({ meta, onPageChange, simple = false }: PaginationProps) {
    if (!meta) return null;

    if (simple) {
        const currentPage = meta.current_page ?? 1;
        const hasPrev = Boolean(meta.prev_page_url) || currentPage > 1;
        const hasNext =
            Boolean(meta.next_page_url) ||
            Boolean(meta.has_more) ||
            (typeof meta.last_page === 'number' && currentPage < meta.last_page);

        if (!hasPrev && !hasNext) {
            return null;
        }

        return (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-xl">
                <div className="text-xs text-slate-500 font-medium">
                    Página <span className="font-bold text-slate-900">{currentPage}</span>
                    {meta.from != null && meta.to != null ? (
                        <>
                            {' '}
                            · mostrando{' '}
                            <span className="font-bold text-slate-900">{meta.from}</span>–
                            <span className="font-bold text-slate-900">{meta.to}</span>
                        </>
                    ) : null}
                </div>

                <div className="flex gap-2">
                    <button
                        type="button"
                        disabled={!hasPrev}
                        onClick={() => onPageChange(currentPage - 1)}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 transition shadow-sm"
                        aria-label="Página anterior"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Anterior
                    </button>

                    <button
                        type="button"
                        disabled={!hasNext}
                        onClick={() => onPageChange(currentPage + 1)}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 transition shadow-sm"
                        aria-label="Página siguiente"
                    >
                        Siguiente
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        );
    }

    if (meta.last_page <= 1) return null;

    return (
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-xl">
            <div className="text-xs text-slate-500 font-medium">
                Mostrando <span className="font-bold text-slate-900">{meta.from || 0}</span> a{' '}
                <span className="font-bold text-slate-900">{meta.to || 0}</span> de{' '}
                <span className="font-bold text-slate-900">{meta.total}</span> resultados
            </div>

            <div className="flex gap-2">
                <button
                    type="button"
                    disabled={meta.current_page === 1}
                    onClick={() => onPageChange(meta.current_page - 1)}
                    className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 transition shadow-sm"
                    aria-label="Página anterior"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>

                <span className="px-4 py-2 text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-lg shadow-sm min-w-[100px] text-center">
                    Página {meta.current_page} de {meta.last_page}
                </span>

                <button
                    type="button"
                    disabled={meta.current_page === meta.last_page}
                    onClick={() => onPageChange(meta.current_page + 1)}
                    className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 transition shadow-sm"
                    aria-label="Página siguiente"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
