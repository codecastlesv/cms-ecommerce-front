'use client';

import { useCallback, useState } from 'react';
import { Loader2, RefreshCw, X } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { handleError } from '@/lib/errorHandler';

/** Productos por grupo. Bajo a propósito: cada producto puede tener varios SKUs y Brilo pagina por bodega. */
const BATCH_LIMIT = 20;

type SyncPhase = 'confirm' | 'running' | 'done' | 'error';

type BatchResponse = {
  status?: string;
  page?: number;
  limit?: number;
  total?: number;
  total_pages?: number;
  has_more?: boolean;
  processed?: number;
  products_synced?: number;
  inventory_rows?: number;
  skipped?: number;
};

type Props = {
  onCompleted?: () => void;
};

export default function MassStockSyncButton({ onCompleted }: Props) {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<SyncPhase>('confirm');
  const [processed, setProcessed] = useState(0);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [failedPages, setFailedPages] = useState<number[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resetState = () => {
    setPhase('confirm');
    setProcessed(0);
    setTotal(0);
    setCurrentPage(0);
    setTotalPages(0);
    setFailedPages([]);
    setErrorMessage(null);
  };

  const closeModal = () => {
    if (phase === 'running') return;
    setOpen(false);
    resetState();
  };

  const openModal = () => {
    resetState();
    setOpen(true);
  };

  const runSync = useCallback(async () => {
    setPhase('running');
    setProcessed(0);
    setFailedPages([]);
    setErrorMessage(null);

    let page = 1;
    let pages = 1;
    let cumulative = 0;
    let catalogTotal = 0;
    const failed: number[] = [];

    try {
      while (page <= pages) {
        setCurrentPage(page);

        try {
          const { data } = await api.post<BatchResponse>(
            '/admin/products/sync-batch',
            { page, limit: BATCH_LIMIT },
            { timeout: 180_000 }
          );

          catalogTotal = Number(data.total ?? catalogTotal);
          pages = Math.max(1, Number(data.total_pages ?? pages));
          cumulative += Number(data.processed ?? 0);

          setTotal(catalogTotal);
          setTotalPages(pages);
          setProcessed(Math.min(cumulative, catalogTotal || cumulative));
        } catch (err) {
          failed.push(page);
          setFailedPages([...failed]);
          console.error(`sync-batch page ${page} failed`, err);

          // Si falla la página 1 y aún no conocemos el total, abortar
          if (page === 1 && catalogTotal === 0) {
            setPhase('error');
            setErrorMessage(handleError(err, 'Sincronizar stock'));
            return;
          }
        }

        page += 1;
      }

      setFailedPages(failed);

      if (failed.length > 0 && cumulative === 0) {
        setPhase('error');
        setErrorMessage(
          `No se pudo sincronizar ningún grupo de productos. Grupos fallidos: ${failed.join(', ')}.`
        );
        return;
      }

      setPhase('done');
      if (failed.length > 0) {
        toast.warning(
          `Sincronización parcial: ${failed.length} grupo(s) fallaron (${failed.join(', ')}).`
        );
      } else {
        toast.success('Sincronización de stock completada');
      }
      onCompleted?.();
    } catch (err) {
      setPhase('error');
      setErrorMessage(handleError(err, 'Sincronizar stock'));
    }
  }, [onCompleted]);

  const percent =
    total > 0 ? Math.min(100, Math.round((processed / total) * 100)) : phase === 'done' ? 100 : 0;

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="bg-white border border-slate-300 text-slate-800 px-4 py-2.5 rounded-xl text-sm font-bold flex items-center hover:bg-slate-50 transition-all shadow-sm active:scale-95"
      >
        <RefreshCw className="w-4 h-4 mr-2 shrink-0" />
        Sincronizar Stock Completo
      </button>

      {open ? (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/45"
            aria-label="Cerrar"
            disabled={phase === 'running'}
            onClick={closeModal}
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative z-10 w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl p-6 space-y-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Sincronización Masiva</h3>
                <p className="text-sm text-slate-500 mt-1">Stock desde Brilo ERP por grupos</p>
              </div>
              {phase !== 'running' ? (
                <button
                  type="button"
                  onClick={closeModal}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : null}
            </div>

            {phase === 'confirm' ? (
              <>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Este proceso conectará con Brilo ERP para actualizar el stock de todos los productos.
                  Por favor, no cierres esta ventana hasta que finalice.
                </p>
                <p className="text-xs text-slate-400">
                  Se procesarán {BATCH_LIMIT} productos por grupo para evitar timeouts.
                </p>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => void runSync()}
                    className="px-4 py-2.5 rounded-xl text-sm font-bold bg-slate-900 text-white hover:bg-slate-800"
                  >
                    Iniciar Sincronización
                  </button>
                </div>
              </>
            ) : null}

            {phase === 'running' ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  Sincronizando {processed.toLocaleString('es-SV')}
                  {total > 0 ? ` / ${total.toLocaleString('es-SV')}` : ''} productos…
                </div>
                <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-slate-900 transition-all duration-300"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500">
                  Grupo {currentPage}
                  {totalPages > 0 ? ` de ${totalPages}` : ''} · {percent}%
                </p>
                {failedPages.length > 0 ? (
                  <p className="text-xs text-amber-700">
                    Grupos con error (se continúa): {failedPages.join(', ')}
                  </p>
                ) : null}
              </div>
            ) : null}

            {phase === 'done' ? (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-emerald-700">
                  ✅ Sincronización completada con éxito
                </p>
                <p className="text-sm text-slate-600">
                  Procesados: {processed.toLocaleString('es-SV')}
                  {total > 0 ? ` de ${total.toLocaleString('es-SV')}` : ''} productos.
                </p>
                {failedPages.length > 0 ? (
                  <p className="text-xs text-amber-700">
                    Algunos grupos fallaron: {failedPages.join(', ')}. Podés reintentar más tarde.
                  </p>
                ) : null}
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2.5 rounded-xl text-sm font-bold bg-slate-900 text-white hover:bg-slate-800"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            ) : null}

            {phase === 'error' ? (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-red-700">No se pudo completar la sincronización</p>
                <p className="text-sm text-slate-600">{errorMessage}</p>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Cerrar
                  </button>
                  <button
                    type="button"
                    onClick={() => void runSync()}
                    className="px-4 py-2.5 rounded-xl text-sm font-bold bg-slate-900 text-white hover:bg-slate-800"
                  >
                    Reintentar
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
