'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, AlertCircle } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { handleError } from '@/lib/errorHandler';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    groupKey: string;
    banner: any;
    onSuccess: () => void;
}

export default function ScheduleModal({ isOpen, onClose, groupKey, banner, onSuccess }: Props) {
    const [startAt, setStartAt] = useState('');
    const [endAt, setEndAt] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const getLocalNowISO = () => {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        return now.toISOString().slice(0, 16);
    };

    const formatDbDate = (dateStr: string) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().slice(0, 16);
    };

    useEffect(() => {
        if (isOpen && banner) {
            setStartAt(banner.pivot?.start_at ? formatDbDate(banner.pivot.start_at) : '');
            setEndAt(banner.pivot?.end_at ? formatDbDate(banner.pivot.end_at) : '');
            setError('');
        }
    }, [isOpen, banner]);

    const handleSave = async () => {
        if (startAt && endAt && startAt >= endAt) {
            setError('La fecha de fin debe ser posterior al inicio.');
            return;
        }

        setLoading(true);
        try {
            await api.put(`/admin/banner-groups/${groupKey}/items/${banner.id}`, {
                start_at: startAt || null,
                end_at: endAt || null,
                is_active: true
            });
            toast.success('Programación guardada. El banner se mostrará según las fechas.');
            onSuccess();
            onClose();
        } catch (error) {
            toast.error(handleError(error,'Error al guardar la programación'));
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">

                <div className="p-4 border-b flex justify-between items-center bg-slate-50 rounded-t-2xl">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-600" /> Programar Visibilidad
                    </h3>
                    <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
                </div>

                <div className="p-6 space-y-5">
                    <div className="bg-blue-50 text-blue-700 text-xs p-3 rounded-lg border border-blue-100 flex gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <div>
                            <p className="font-bold mb-1">Modo Automático</p>
                            <p>El banner se activará y desactivará automáticamente según estas fechas. El formato es 24 horas.</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-slate-700 block mb-1.5">Fecha de Inicio</label>
                            <input
                                type="datetime-local"
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                                value={startAt}
                                onChange={(e) => {
                                    setStartAt(e.target.value);
                                    if (endAt && e.target.value >= endAt) setEndAt('');
                                    setError('');
                                }}
                                min={getLocalNowISO()}
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-700 block mb-1.5">Fecha de Fin</label>
                            <input
                                type="datetime-local"
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-100 font-mono"
                                value={endAt}
                                onChange={(e) => { setEndAt(e.target.value); setError(''); }}
                                min={startAt || getLocalNowISO()}
                                disabled={!startAt}
                            />
                        </div>
                    </div>

                    {error && <p className="text-xs text-red-600 font-bold text-center bg-red-50 p-2 rounded animate-pulse">{error}</p>}
                </div>

                <div className="p-4 border-t flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-lg">Cancelar</button>
                    <button onClick={handleSave} disabled={loading} className="bg-slate-900 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-slate-800 disabled:opacity-50">
                        {loading ? 'Guardando...' : 'Confirmar'}
                    </button>
                </div>
            </div>
        </div>
    );
}