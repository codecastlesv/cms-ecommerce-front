'use client';

import { useRef, useState } from 'react';
import api from '@/lib/axios';
import { FileArchive, Loader2 } from 'lucide-react';
import { handleError } from '@/lib/errorHandler';
import { createThrottledUploadProgressReporter } from '@/lib/uploadProgressThrottle';
import ImportProcessModal, { type ImportErrorItem } from '@/components/admin/ImportProcessModal';

export interface ZipImagesImportQueuedResponse {
    success: boolean;
    batch_id: string;
    status: string;
    message: string;
}

export interface ZipImagesImportStatusResponse {
    success: boolean;
    status: 'queued' | 'processing' | 'completed' | 'failed';
    processed_correctly?: number;
    processed?: number;
    skipped?: number;
    errors?: ImportErrorItem[];
    message?: string;
}

type ZipImagesImportButtonProps = {
    onSuccess?: () => void;
};

const POLL_INTERVAL_MS = 2500;
const MAX_POLL_ATTEMPTS = 720;

async function pollZipImportStatus(batchId: string): Promise<ZipImagesImportStatusResponse> {
    for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
        const { data } = await api.get<ZipImagesImportStatusResponse>(
            `/admin/products/import-images-zip/${batchId}`,
        );

        if (data.status === 'completed' || data.status === 'failed') {
            return data;
        }

        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }

    throw new Error('El procesamiento tardó demasiado. Revisa el estado más tarde.');
}

export default function ZipImagesImportButton({ onSuccess }: ZipImagesImportButtonProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'loading' | 'results'>('loading');
    const [loadingMessage, setLoadingMessage] = useState('Subiendo imágenes al servidor, por favor espera...');
    const [processed, setProcessed] = useState(0);
    const [errors, setErrors] = useState<ImportErrorItem[]>([]);
    const [summaryMessage, setSummaryMessage] = useState<string | undefined>();

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.name.toLowerCase().endsWith('.zip')) {
            handleError(new Error('Selecciona un archivo .zip válido.'), 'Importar ZIP de fotos');
            if (inputRef.current) inputRef.current.value = '';
            return;
        }

        setLoading(true);
        setModalOpen(true);
        setModalMode('loading');
        setLoadingMessage('Subiendo imágenes al servidor, por favor espera...');
        setErrors([]);
        setProcessed(0);
        setSummaryMessage(undefined);

        try {
            const formData = new FormData();
            formData.append('zip', file);

            const reportUploadProgress = createThrottledUploadProgressReporter((pct) => {
                setLoadingMessage(`Subiendo imágenes al servidor (${pct}%), por favor espera...`);
            });

            const uploadRes = await api.post<ZipImagesImportQueuedResponse>(
                '/admin/products/import-images-zip',
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
            ).catch((error: unknown) => {
                const axiosError = error as {
                    response?: {
                        status?: number;
                        data?: {
                            message?: string;
                            errors?: ImportErrorItem[];
                            processed_correctly?: number;
                        };
                    };
                };

                const status = axiosError.response?.status;
                const data = axiosError.response?.data as {
                    message?: string;
                    errors?: ImportErrorItem[];
                    processed_correctly?: number;
                    error_code?: string;
                } | undefined;

                if (status === 413 || data?.error_code === 'POST_TOO_LARGE') {
                    setProcessed(0);
                    setErrors(
                        data?.errors?.length
                            ? data.errors
                            : [{
                                filename: file.name,
                                style_code: '',
                                friendly_error:
                                    data?.message
                                    ?? 'El archivo ZIP supera el límite de subida del servidor (post_max_size).',
                            }],
                    );
                    setSummaryMessage(data?.message ?? 'No se pudo subir el ZIP por tamaño excesivo.');
                    setModalMode('results');
                    return null;
                }

                throw error;
            });

            if (!uploadRes) {
                return;
            }

            const batchId = uploadRes.data.batch_id;
            if (!batchId) {
                throw new Error('No se recibió identificador de lote del servidor.');
            }

            setLoadingMessage('Procesando imágenes en segundo plano, por favor no cierres la ventana...');

            const finalStatus = await pollZipImportStatus(batchId);

            const importErrors = finalStatus.errors ?? [];
            const processedCount = finalStatus.processed_correctly ?? finalStatus.processed ?? 0;

            if (finalStatus.status === 'failed' && importErrors.length === 0 && processedCount === 0) {
                throw new Error(finalStatus.message ?? 'El procesamiento del ZIP falló.');
            }

            setProcessed(processedCount);
            setErrors(importErrors);
            setSummaryMessage(
                finalStatus.message
                    ?? (importErrors.length > 0
                        ? `Importación finalizada con ${processedCount} imagen(es) correcta(s) y ${importErrors.length} error(es).`
                        : `Importación ZIP finalizada. ${processedCount} imagen(es) procesada(s).`),
            );
            setModalMode('results');
        } catch (error) {
            const axiosError = error as {
                response?: {
                    status?: number;
                    data?: ZipImagesImportStatusResponse & {
                        error_code?: string;
                        errors?: ImportErrorItem[];
                    };
                };
            };
            const statusData = axiosError.response?.data;
            const statusCode = axiosError.response?.status;

            if (
                statusData?.errors?.length
                || statusData?.processed_correctly !== undefined
                || statusData?.processed !== undefined
                || statusCode === 413
                || statusData?.error_code === 'POST_TOO_LARGE'
            ) {
                setProcessed(statusData?.processed_correctly ?? statusData?.processed ?? 0);
                setErrors(
                    statusData?.errors?.length
                        ? statusData.errors
                        : [{
                            filename: 'archivo.zip',
                            style_code: '',
                            friendly_error: statusData?.message ?? 'Error al procesar la importación del ZIP.',
                        }],
                );
                setSummaryMessage(statusData?.message);
                setModalMode('results');
            } else {
                setModalOpen(false);
                handleError(error, 'Importar ZIP de fotos');
            }
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
                resultVariant="zip"
                onAccept={handleAccept}
            />
            <input
                ref={inputRef}
                type="file"
                accept=".zip,application/zip,application/x-zip-compressed"
                className="hidden"
                onChange={handleFileChange}
                disabled={loading}
            />
            <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={loading}
                className="bg-white border border-slate-300 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-bold flex items-center hover:bg-slate-50 transition-all shadow-sm active:scale-95 disabled:opacity-60 disabled:pointer-events-none min-w-[11rem]"
            >
                {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin shrink-0" />
                ) : (
                    <FileArchive className="w-4 h-4 mr-2 shrink-0" />
                )}
                {loading ? 'Importando…' : 'Importar ZIP de Fotos'}
            </button>
        </>
    );
}
