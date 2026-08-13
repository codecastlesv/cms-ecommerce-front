import { useState, useEffect } from "react";
import { formatDate } from "@/utils/date";
import { toast } from 'sonner';

interface EditableInputProps {
    label: string;
    value: string;
    type?: string;
    onSave: (val: string) => Promise<void>;
    placeholder?: string;
    loading?: boolean;
    sanitize?: (val: string) => string;
    maxDateToday?: boolean;
    formatDisplay?: (val: string) => string;
}

export const EditableInput = ({ label, value, type='text', onSave, loading = false, placeholder = "", sanitize, maxDateToday = false, formatDisplay}: EditableInputProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [inputValue, setInputValue] = useState(value);
    const displayValue = type === "date"
    ? formatDisplay?.(value) ?? formatDate(value)
    : value || 'No registrado';

    useEffect(() => {
        setInputValue(value);
    }, [value]);

    const handleSave = async () => {
        let val = inputValue;
    
        if (sanitize) val = sanitize(val);
        
        if (type === "date") {
            const selectedDate = new Date(val);
            const today = new Date();

            selectedDate.setHours(0, 0, 0, 0);
            today.setHours(0, 0, 0, 0);

            if (selectedDate > today) {
                toast.error("La fecha no puede ser mayor a hoy");
                return;
            }
        }
        await onSave(val);
        setIsEditing(false);
    };

    const maxAttr = type === "date" && maxDateToday ? new Date().toISOString().split('T')[0] : undefined;

    return (
        <div>
            <label className="text-slate-400 text-xs">{label}</label>
            {!isEditing ? (
                <div className="flex items-center justify-between mt-1">
                    <p className="font-medium text-slate-800">{displayValue}</p>
                    <button onClick={() => setIsEditing(true)} className="text-blue-600 text-xs">Editar</button>
                </div>
            ) : (
                <div className="flex gap-2 mt-1">
                    <input
                        type={type}
                        placeholder={placeholder}
                        value={inputValue}
                        max={maxAttr}
                        onChange={(e) => setInputValue(e.target.value)}
                        className="border rounded px-3 py-1 text-sm w-full"
                    />
                    <button onClick={handleSave} disabled={loading} className="bg-blue-800 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                        Guardar
                    </button>
                    <button onClick={() => setIsEditing(false)} className="px-3 py-1 text-sm text-slate-500">
                        Cancelar
                    </button>
                </div>
            )}
        </div>
    );
};

