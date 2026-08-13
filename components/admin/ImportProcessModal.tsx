'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Loader2 } from 'lucide-react';

export type ImportErrorItem = {
    row?: number;
    name?: string;
    sku?: string;
    style_code?: string;
    color?: string;
    friendly_error?: string;
    filename?: string;
    /** Compatibilidad legacy */
    item?: string;
    error?: string;
};

type ImportProcessModalProps = {
    open: boolean;
    mode: 'loading' | 'results';
    loadingMessage: string;
    processed?: number;
    errors?: ImportErrorItem[];
    summaryMessage?: string;
    resultVariant?: 'excel' | 'zip';
    onAccept: () => void;
};

function resolveErrorReason(err: ImportErrorItem): string {
    return err.friendly_error?.trim() || err.error?.trim() || 'Error desconocido';
}

function sanitizeStyleCode(code?: string): string {
    if (!code?.trim()) return '';
    return code.trim().replace(/^FAM-/i, '');
}

function resolveStyleColor(err: ImportErrorItem): string {
    const style = sanitizeStyleCode(err.style_code);
    const color = err.color?.trim();
    const parts = [style, color].filter(Boolean);
    return parts.length > 0 ? parts.join(' · ') : '—';
}

export default function ImportProcessModal({
    open,
    mode,
    loadingMessage,
    processed,
    errors = [],
    summaryMessage,
    resultVariant = 'excel',
    onAccept,
}: ImportProcessModalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!open || !mounted) {
        return null;
    }

    const isWideResults = resultVariant === 'excel' || resultVariant === 'zip';
    const hasErrors = errors.length > 0;

    return createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/55 p-4 backdrop-blur-[1px]">
            <div
                className={`w-full rounded-xl border border-slate-200 bg-white shadow-2xl ${isWideResults ? 'max-w-5xl' : 'max-w-xl'}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="import-process-modal-title"
            >
                {mode === 'loading' ? (
                    <div className="flex flex-col items-center gap-4 px-8 py-10 text-center">
                        <Loader2 className="h-10 w-10 animate-spin text-slate-800" aria-hidden />
                        <p id="import-process-modal-title" className="max-w-sm text-sm font-medium leading-relaxed text-slate-700">
                            {loadingMessage}
                        </p>
                    </div>
                ) : (
                    <div className={`${isWideResults ? 'p-7' : 'p-6'}`}>
                        <h3 id="import-process-modal-title" className="mb-2 text-lg font-bold text-slate-900">
                            Resultado de importación
                        </h3>
                        {summaryMessage ? (
                            <p className="mb-4 text-sm text-slate-600">{summaryMessage}</p>
                        ) : null}
                        {processed !== undefined ? (
                            <p className="mb-3 text-sm font-semibold text-emerald-700">
                                Procesados correctamente: {processed}
                            </p>
                        ) : null}
                        {hasErrors ? (
                            <>
                                <p className="mb-2 text-sm font-semibold text-rose-700">
                                    Errores ({errors.length})
                                </p>

                                <div className="max-h-96 overflow-auto rounded-lg border border-slate-200">
                                    {resultVariant === 'zip' ? (
                                        <table className="w-full min-w-[640px] text-left text-sm">
                                            <thead className="sticky top-0 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                                                <tr>
                                                    <th className="px-3 py-2.5">Archivo</th>
                                                    <th className="px-3 py-2.5 whitespace-nowrap">Código de estilo detectado</th>
                                                    <th className="min-w-[220px] px-3 py-2.5">Motivo del error</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {errors.map((err, index) => (
                                                    <tr key={`zip-err-${err.filename ?? err.item ?? index}`}>
                                                        <td className="px-3 py-2.5 align-top font-mono text-xs text-slate-800">
                                                            {err.filename?.trim() || err.item?.trim() || '—'}
                                                        </td>
                                                        <td className="px-3 py-2.5 align-top text-slate-800">
                                                            {sanitizeStyleCode(err.style_code) || '—'}
                                                        </td>
                                                        <td className="px-3 py-2.5 align-top leading-relaxed text-rose-700">
                                                            {resolveErrorReason(err)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <table className="w-full min-w-[720px] text-left text-sm">
                                            <thead className="sticky top-0 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                                                <tr>
                                                    <th className="px-3 py-2.5 whitespace-nowrap">Fila</th>
                                                    <th className="px-3 py-2.5">Producto</th>
                                                    <th className="px-3 py-2.5 whitespace-nowrap">SKU</th>
                                                    <th className="px-3 py-2.5 whitespace-nowrap">Estilo / Color</th>
                                                    <th className="min-w-[220px] px-3 py-2.5">Motivo del error</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {errors.map((err, index) => (
                                                    <tr key={`excel-err-${err.row ?? index}-${err.sku ?? index}`}>
                                                        <td className="px-3 py-2.5 align-top tabular-nums text-slate-800">
                                                            {err.row ?? '—'}
                                                        </td>
                                                        <td className="px-3 py-2.5 align-top text-slate-800">
                                                            {err.name?.trim() || '—'}
                                                        </td>
                                                        <td className="px-3 py-2.5 align-top font-mono text-xs text-slate-800">
                                                            {err.sku?.trim() || '—'}
                                                        </td>
                                                        <td className="px-3 py-2.5 align-top text-slate-700">
                                                            {resolveStyleColor(err)}
                                                        </td>
                                                        <td className="px-3 py-2.5 align-top leading-relaxed text-rose-700">
                                                            {resolveErrorReason(err)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>

                                {resultVariant === 'excel' ? (
                                    <div className="mt-3 flex gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
                                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
                                        <p>
                                            Por favor, revisa y corrige la data de tu archivo de Excel en los puntos señalados para obtener un éxito total en la siguiente subida.
                                        </p>
                                    </div>
                                ) : null}

                                {resultVariant === 'zip' ? (
                                    <div className="mt-3 flex gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
                                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
                                        <p>
                                        Por favor, revisa si estos códigos de estilo existen en tu catálogo de productos o verifica si el archivo tiene un error de dedo en su nombre.
                                        </p>
                                    </div>
                                ) : null}
                            </>
                        ) : (
                            <p className="text-sm text-emerald-600">Sin errores reportados.</p>
                        )}
                        <button
                            type="button"
                            onClick={onAccept}
                            className="mt-6 w-full rounded-lg bg-black py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
                        >
                            Aceptar
                        </button>
                    </div>
                )}
            </div>
        </div>,
        document.body,
    );
}
