'use client';

import { useEffect, useState } from 'react';
import { X, Search } from 'lucide-react';
import { iconMap } from '@/lib/icon-map';

interface ContentBlockItem {
    id?: number;
    icon?: string | null;
    eyebrow?: string | null;
    title?: string | null;
    description?: string | null;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: { icon: string; eyebrow: string; title: string; description: string }) => Promise<void>;
    initialItem?: ContentBlockItem | null;
}

const EMPTY = { icon: 'LayoutList', eyebrow: '', title: '', description: '' };

export default function ContentBlockItemModal({ isOpen, onClose, onSave, initialItem }: Props) {
    const [formData, setFormData] = useState(EMPTY);
    const [iconSearch, setIconSearch] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setFormData({
                icon: initialItem?.icon || 'LayoutList',
                eyebrow: initialItem?.eyebrow || '',
                title: initialItem?.title || '',
                description: initialItem?.description || '',
            });
            setIconSearch('');
        }
    }, [isOpen, initialItem]);

    if (!isOpen) return null;

    const filteredIcons = Object.keys(iconMap).filter((k) => k.toLowerCase().includes(iconSearch.toLowerCase()));
    const SelectedIcon = iconMap[formData.icon];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await onSave(formData);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <h3 className="font-bold text-slate-900">{initialItem?.id ? 'Editar item' : 'Nuevo item'}</h3>
                    <button onClick={onClose} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-full">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-bold text-slate-500 uppercase">Ícono</span>
                            {SelectedIcon ? (
                                <span className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                                    <SelectedIcon className="w-4 h-4" />
                                </span>
                            ) : null}
                        </div>
                        <div className="relative mb-2">
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={iconSearch}
                                onChange={(e) => setIconSearch(e.target.value)}
                                placeholder="Buscar ícono..."
                                className="w-full border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/5"
                            />
                        </div>
                        <div className="grid grid-cols-8 gap-2 h-32 overflow-y-auto pr-1">
                            {filteredIcons.map((iconKey) => {
                                const IconComp = iconMap[iconKey];
                                return (
                                    <button
                                        key={iconKey}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, icon: iconKey })}
                                        className={`flex items-center justify-center p-2 rounded-lg border transition ${formData.icon === iconKey ? 'border-slate-900 bg-slate-50 ring-2 ring-slate-100' : 'border-transparent hover:bg-slate-50'}`}
                                    >
                                        <IconComp className="w-5 h-5 text-slate-600" />
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                                Texto chico (opcional)
                            </label>
                            <input
                                type="text"
                                value={formData.eyebrow}
                                onChange={(e) => setFormData({ ...formData, eyebrow: e.target.value })}
                                placeholder="Ej: 1988"
                                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black/5"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                                Título / Valor
                            </label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Ej: Confianza / +35"
                                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black/5"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                            Descripción (opcional)
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full border border-slate-200 rounded-lg p-3 text-sm h-20 outline-none focus:ring-2 focus:ring-black/5"
                            placeholder="Texto descriptivo..."
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition">
                            Cancelar
                        </button>
                        <button type="submit" disabled={saving} className="px-5 py-2.5 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition disabled:opacity-50">
                            {saving ? 'Guardando...' : 'Guardar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
