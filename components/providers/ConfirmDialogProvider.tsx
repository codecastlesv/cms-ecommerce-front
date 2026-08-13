'use client';
import { createContext, useContext, useState, ReactNode } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmOptions {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'info';
    onConfirm: () => Promise<void> | void;
}

const ConfirmContext = createContext<((options: ConfirmOptions) => void) | null>(null);

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [options, setOptions] = useState<ConfirmOptions | null>(null);
    const [loading, setLoading] = useState(false);

    const confirm = (opts: ConfirmOptions) => {
        setOptions(opts);
        setIsOpen(true);
    };

    const handleConfirm = async () => {
        if (!options) return;
        setLoading(true);
        try {
            await options.onConfirm();
            setIsOpen(false);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ConfirmContext.Provider value={confirm}>
            {children}
            {isOpen && options && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden scale-100 animate-in zoom-in-95">
                        <div className="p-6 text-center">
                            <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${options.variant === 'danger' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">{options.title}</h3>
                            <p className="text-sm text-slate-500 leading-relaxed">{options.message}</p>
                        </div>
                        <div className="p-4 bg-slate-50 flex gap-3 justify-center border-t border-slate-100">
                            <button disabled={loading} onClick={() => setIsOpen(false)} className="px-4 py-2 text-slate-600 font-bold text-sm hover:bg-white rounded-lg transition">
                                {options.cancelText || 'Cancelar'}
                            </button>
                            <button disabled={loading} onClick={handleConfirm} className={`px-6 py-2 text-white font-bold text-sm rounded-lg shadow-lg transition flex items-center ${options.variant === 'danger' ? 'bg-red-600 hover:bg-red-700 shadow-red-900/20' : 'bg-slate-900 hover:bg-slate-800'}`}>
                                {loading ? 'Procesando...' : (options.confirmText || 'Confirmar')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ConfirmContext.Provider>
    );
}

export const useConfirm = () => {
    const context = useContext(ConfirmContext);
    if (!context) throw new Error('useConfirm must be used within ConfirmDialogProvider');
    return context;
};