import { UseFormRegisterReturn } from "react-hook-form";

interface PhoneInputProps {
    registration: UseFormRegisterReturn;
    error?: string;
    label?: string;
    disabled?: boolean;
}

export const PhoneInput = ({ registration, error, label = "Teléfono", disabled = false }: PhoneInputProps) => {
    const inputId = registration.name;

    const handleInput = (e: React.FormEvent<HTMLInputElement>) => {
        let val = e.currentTarget.value.replace(/\D/g, '');
        if (val.length > 8) val = val.substring(0, 8);

        if (val.length > 4) {
            val = val.substring(0, 4) + '-' + val.substring(4);
        }

        e.currentTarget.value = val;
        registration.onChange(e);
    };

    return (
        <div>
            <label htmlFor={inputId} className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                {label}
            </label>
            <div className="relative">
                <div className={`absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center bg-slate-50 border-r border-slate-200 rounded-l-lg text-sm font-bold ${disabled ? 'text-slate-400' : 'text-slate-500'}`}>
                    +503
                </div>

                <input
                    id={inputId}
                    type="tel"
                    disabled={disabled}
                    {...registration}
                    onChange={handleInput}
                    placeholder="7777-8888"
                    maxLength={9}
                    className={`w-full border rounded-lg pl-16 pr-4 py-2.5 text-sm font-medium outline-none transition
                        ${error
                            ? 'border-red-500 focus:ring-2 focus:ring-red-100'
                            : 'border-slate-300 focus:ring-2 focus:ring-slate-900 focus:border-transparent'}
                        ${disabled ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white text-slate-900'} 
                    `}
                />
            </div>
            {error && <p className="text-red-500 text-[10px] mt-1 font-bold animate-pulse">{error}</p>}
        </div>
    );
};