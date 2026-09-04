'use client';

import { useCallback, useState } from 'react';
import { Loader2, RefreshCw, X } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { handleError } from '@/lib/errorHandler';

type SyncPhase = 'confirm' | 'running' | 'done' | 'error';

type SyncResponse = {
  message?: string;
  created?: number;
  updated?: number;
  skipped?: number;
  failed?: number;
  total?: number;
};

type Props = {
  onCompleted?: () => void;
};

export default function MassStockSyncButton({ onCompleted }: Props) {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<SyncPhase>('confirm');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<SyncResponse | null>(null);

  const resetState = () => {
    setPhase('confirm');
    setErrorMessage(null);
    setResult(null);
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
    setErrorMessage(null);
    setResult(null);

    try {
      const { data } = await api.post<SyncResponse>('/admin/olympus/sync', {}, { timeout: 0 });
      setResult(data);
      setPhase('done');
      toast.success(
        data.message ??
          `Sincronización completada. Creados: ${data.created ?? 0}. Actualizados: ${data.updated ?? 0}.`,
      );
      onCompleted?.();
    } catch (err) {
      setPhase('error');
      setErrorMessage(handleError(err, 'Sincronizar productos'));
    }
  }, [onCompleted]);

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="bg-white border border-slate-300 text-slate-800 px-4 py-2.5 rounded-xl text-sm font-bold flex items-center hover:bg-slate-50 transition-all shadow-sm active:scale-95"
      >
        <RefreshCw className="w-4 h-4 mr-2 shrink-0" />
        Sincronizar Productos
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
                <h3 className="text-lg font-bold text-slate-900">Sincronización Olympus</h3>
                <p className="text-sm text-slate-500 mt-1">Catálogo e inventario desde el ERP</p>
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
                  Se consultará Olympus y se crearán o actualizarán productos. No cierres esta ventana hasta que finalice.
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
              <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                Sincronizando catálogo con Olympus…
              </div>
            ) : null}

            {phase === 'done' ? (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-emerald-700">
                  Sincronización completada
                </p>
                <p className="text-sm text-slate-600">
                  Creados: {(result?.created ?? 0).toLocaleString('es-SV')}. Actualizados:{' '}
                  {(result?.updated ?? 0).toLocaleString('es-SV')}.
                </p>
                {(result?.skipped ?? 0) > 0 || (result?.failed ?? 0) > 0 ? (
                  <p className="text-xs text-slate-500">
                    Omitidos: {result?.skipped ?? 0}. Errores: {result?.failed ?? 0}.
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
