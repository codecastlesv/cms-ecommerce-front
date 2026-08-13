'use client';

import { useRef, useState } from 'react';
import api from '@/lib/axios';
import { FileSpreadsheet, Loader2 } from 'lucide-react';
import { handleError } from '@/lib/errorHandler';
import { createThrottledUploadProgressReporter } from '@/lib/uploadProgressThrottle';
import ImportProcessModal, { type ImportErrorItem } from '@/components/admin/ImportProcessModal';

type ExcelImportResponse = {
    success: boolean;
    processed: number;
    errors: ImportErrorItem[];
    message?: string;
};

type ExcelImportButtonProps = {
    onSuccess?: () => void;
};

export default function ExcelImportButton({ onSuccess }: ExcelImportButtonProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'loading' | 'results'>('loading');
    const [loadingMessage, setLoadingMessage] = useState('Subiendo archivo de productos, por favor espera...');
    const [processed, setProcessed] = useState(0);
    const [errors, setErrors] = useState<ImportErrorItem[]>([]);
    const [summaryMessage, setSummaryMessage] = useState<string | undefined>();

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setLoading(true);
        setModalOpen(true);
        setModalMode('loading');
        setLoadingMessage('Subiendo archivo de productos, por favor espera...');
        setErrors([]);
        setProcessed(0);
        setSummaryMessage(undefined);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const reportUploadProgress = createThrottledUploadProgressReporter((pct) => {
                setLoadingMessage(`Subiendo archivo de productos (${pct}%), por favor espera...`);
            });

            const res = await api.post<ExcelImportResponse>(
                '/admin/products/import-excel',
                formData,
                {
                    headers: { Accept: 'application/json' },
                    timeout: 0,
                    onUploadProgress: (event) => {
                        if (event.total && event.total > 0) {
                            reportUploadProgress.report(event.loaded, event.total);
                        }
                    },
                },
            );

            setLoadingMessage('Procesando archivo de productos, por favor no cierres la ventana...');

            setProcessed(res.data.processed ?? 0);
            setErrors(res.data.errors ?? []);
            setSummaryMessage(res.data.message);
            setModalMode('results');
        } catch (error) {
            setModalOpen(false);
            handleError(error, 'Importar Excel');
        } finally {
            setLoading(false);
            if (inputRef.current) {
                inputRef.current.value = '';
            }
        }
    };

    const handleAccept = () => {
        setModalOpen(false);
        onSuccess?.();
    };

    return (
        <>
            <ImportProcessModal
                open={modalOpen}
                mode={modalMode}
                loadingMessage={loadingMessage}
                processed={processed}
                errors={errors}
                summaryMessage={summaryMessage}
                resultVariant="excel"
                onAccept={handleAccept}
            />
            <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
                className="hidden"
                onChange={handleFileChange}
                disabled={loading}
            />
            <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={loading}
                className="bg-white border border-slate-300 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-bold flex items-center hover:bg-slate-50 transition-all shadow-sm active:scale-95 disabled:opacity-60 disabled:pointer-events-none"
            >
                {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                )}
                Importar Excel
            </button>
        </>
    );
}
