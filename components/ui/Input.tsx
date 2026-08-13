import { UseFormRegisterReturn } from "react-hook-form";

interface InputProps {
    label: string;
    type?: string;
    placeholder?: string;
    registration: UseFormRegisterReturn;
    error?: string;
    sanitize?: (val: string) => string;
    disabled?: boolean;
}

export const Input = ({ label, type = "text", placeholder, registration, error, sanitize, disabled = false }: InputProps) => {
    const inputId = registration.name;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (sanitize) {
            e.target.value = sanitize(e.target.value);
        }
        registration.onChange(e);
    };

    return (
        <div>
            <label htmlFor={inputId} className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                {label}
            </label>
            <input
                id={inputId}
                type={type}
                placeholder={placeholder}
                disabled={disabled}
                {...registration}
                onChange={sanitize ? handleChange : registration.onChange}
                className={`w-full px-4 py-2.5 border rounded-xl text-sm outline-none transition
                    ${error ? 'border-red-500 focus:ring-2 focus:ring-red-200' : 'border-slate-300 focus:ring-2 focus:ring-slate-900'}
                    ${disabled ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white'}
                `}
            />
            {error && <p className="text-red-500 text-[10px] mt-1 font-bold">{error}</p>}
        </div>
    );
};