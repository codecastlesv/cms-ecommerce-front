'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Mail, Lock, Eye, EyeOff, Loader2, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
    const { login } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const getUserFriendlyError = (backendMessage: string) => {
        if (
            backendMessage.includes('SQLSTATE') ||
            backendMessage.includes('Connection refused') ||
            backendMessage.includes('SQL:') ||
            backendMessage.includes('500')
        ) {
            console.error("Error Crítico de Sistema:", backendMessage);
            return 'No hay conexión con el sistema. Por favor intenta más tarde.';
        }

        return backendMessage || 'Credenciales inválidas';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            const result = await login({ email, password });

            if (!result.success) {
                const safeMessage = getUserFriendlyError(result.message || '');
                setError(safeMessage);
                setIsSubmitting(false);
            }
        } catch (err) {
            setError('Ocurrió un error inesperado al iniciar sesión.');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">

                <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-slate-900/20">
                        <ShieldCheck className="w-7 h-7 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Galaxia CMS</h1>
                    <p className="text-gray-500 text-sm mt-2">Panel de Administración</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {error && (
                        <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-sm flex items-start animate-in fade-in slide-in-from-top-2">
                            <AlertTriangle className="w-5 h-5 mr-3 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-gray-500 uppercase ml-1">Correo Electrónico</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all bg-gray-50 focus:bg-white text-sm"
                                placeholder="usuario@galaxiadeportes.com"
                                required
                                disabled={isSubmitting}
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-gray-500 uppercase ml-1">Contraseña</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all bg-gray-50 focus:bg-white text-sm"
                                placeholder="••••••••"
                                required
                                disabled={isSubmitting}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                            >
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all duration-200 shadow-lg shadow-slate-900/20 flex items-center justify-center ${isSubmitting ? 'opacity-80 cursor-not-allowed' : 'active:scale-[0.98]'}`}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Validando...
                                </>
                            ) : (
                                'Iniciar Sesión'
                            )}
                        </button>
                    </div>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-xs text-gray-400">
                        © {new Date().getFullYear()} Galaxia Deportes. Acceso restringido.
                    </p>
                </div>
            </div>
        </div>
    );
}