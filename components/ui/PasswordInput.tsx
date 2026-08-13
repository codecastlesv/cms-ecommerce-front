import { useState } from "react";
import { UseFormRegisterReturn } from "react-hook-form";
import { Eye, EyeOff, Lock } from "lucide-react";

interface PasswordInputProps {
    label: string;
    placeholder?: string;
    registration: UseFormRegisterReturn;
    error?: string;
    disabled?: boolean;
}

export const PasswordInput = ({ label, placeholder, registration, error, disabled = false }: PasswordInputProps) => {
    const [show, setShow] = useState(false);
    const inputId = registration.name;

    return (
        <div>
            <label htmlFor={inputId} className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                {label}
            </label>
            <div className="relative">
                <div className="absolute left-3 top-3 text-slate-400">
                    <Lock className="w-4 h-4" />
                </div>
                <input
                    id={inputId}
                    type={show ? "text" : "password"}
                    placeholder={placeholder}
                    disabled={disabled}
                    {...registration}
                    className={`w-full border rounded-lg pl-10 pr-10 py-2.5 text-sm outline-none transition
                        ${error ? 'border-red-500 focus:ring-red-200' : 'border-slate-300 focus:ring-2 focus:ring-slate-900'}
                        ${disabled ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white'}
                    `}
                />
                <button
                    type="button"
                    onClick={() => setShow(!show)}
                    disabled={disabled}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
            </div>
            {error && <p className="text-red-500 text-[10px] mt-1 font-bold">{error}</p>}
        </div>
    );
};