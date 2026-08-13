import { useState, useMemo, useEffect } from 'react';
import { X, Save, CheckSquare, CheckCircle2, Crown } from 'lucide-react';
import { Role, Permission } from '@/hooks/useSecurity';

interface RoleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: { id?: number; name: string; permissions: string[] }) => Promise<any>;
    roleToEdit: Role | null;
    allPermissions: Permission[];
}

export default function RoleModal({ isOpen, onClose, onSave, roleToEdit, allPermissions }: RoleModalProps) {
    const [name, setName] = useState('');
    const [selectedPerms, setSelectedPerms] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setName(roleToEdit?.name || '');
            setSelectedPerms(roleToEdit?.permissions.map(p => p.name) || []);
        } else {
            setName('');
            setSelectedPerms([]);
        }
    }, [isOpen, roleToEdit]);

    const areAllSelected = useMemo(() => {
        return allPermissions.length > 0 && selectedPerms.length === allPermissions.length;
    }, [selectedPerms, allPermissions]);

    const toggleAll = () => {
        if (areAllSelected) setSelectedPerms([]);
        else setSelectedPerms(allPermissions.map(p => p.name));
    };

    const togglePerm = (permName: string) => {
        if (selectedPerms.includes(permName)) {
            setSelectedPerms(prev => prev.filter(p => p !== permName));
        } else {
            setSelectedPerms(prev => [...prev, permName]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await onSave({ id: roleToEdit?.id, name, permissions: selectedPerms });
            onClose();
        } catch (error) {
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    const isSystem = roleToEdit?.is_system;
    const isRoot = name === 'Admin';

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">

                <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
                    <div>
                        <h3 className="font-bold text-lg text-slate-900">
                            {roleToEdit ? 'Configurar Rol' : 'Crear Nuevo Rol'}
                        </h3>
                        {isRoot && <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-100 inline-flex items-center mt-1"><Crown className="w-3 h-3 mr-1" /> Acceso Root</span>}
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full"><X className="w-5 h-5 text-slate-400" /></button>
                </div>

                <form id="roleForm" onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nombre del Rol</label>
                        <input
                            type="text" required disabled={isSystem}
                            className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-slate-900/10 outline-none disabled:bg-slate-100 disabled:text-slate-400 font-bold"
                            value={name} onChange={e => setName(e.target.value)}
                        />
                    </div>

                    {isRoot ? (
                        <div className="bg-purple-50 border border-purple-100 rounded-xl p-6 text-center">
                            <CheckCircle2 className="w-10 h-10 text-purple-500 mx-auto mb-2" />
                            <h4 className="font-bold text-purple-900">Acceso Total</h4>
                            <p className="text-sm text-purple-700 mt-1">Este rol tiene permisos implícitos sobre todo el sistema.</p>
                        </div>
                    ) : (
                        <div>
                            <div className="flex justify-between items-center mb-3">
                                <label className="block text-xs font-bold text-slate-500 uppercase">Permisos Asignados ({selectedPerms.length})</label>
                                <button type="button" onClick={toggleAll} className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition-colors flex items-center">
                                    <CheckSquare className="w-3 h-3 mr-1" /> {areAllSelected ? 'Deseleccionar Todos' : 'Seleccionar Todos'}
                                </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto custom-scrollbar pr-2 border rounded-xl p-2 bg-slate-50/30">
                                {allPermissions.map((perm) => {
                                    const isChecked = selectedPerms.includes(perm.name);
                                    return (
                                        <div
                                            key={perm.id}
                                            onClick={() => togglePerm(perm.name)}
                                            className={`flex items-center p-2.5 border rounded-lg cursor-pointer transition-all hover:border-slate-400 select-none ${isChecked ? 'bg-white border-blue-300 shadow-sm' : 'border-transparent hover:bg-white'}`}
                                        >
                                            <div className={`w-4 h-4 rounded border flex items-center justify-center mr-3 transition-colors ${isChecked ? 'bg-slate-900 border-slate-900' : 'border-slate-300 bg-white'}`}>
                                                {isChecked && <CheckCircle2 className="w-3 h-3 text-white" />}
                                            </div>
                                            <span className="text-xs font-medium text-slate-700">{perm.name}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </form>

                <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50 rounded-b-2xl">
                    <button onClick={onClose} className="px-5 py-2.5 text-slate-600 hover:bg-slate-200 rounded-xl text-sm font-bold">Cancelar</button>
                    {!isRoot && (
                        <button type="submit" form="roleForm" disabled={isSaving} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 text-sm font-bold flex items-center shadow-lg disabled:opacity-50">
                            <Save className="w-4 h-4 mr-2" /> {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}