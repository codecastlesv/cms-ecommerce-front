'use client';

import { useState, type RefObject } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { toast } from 'sonner';

function messageFrom422(data: Record<string, unknown> | undefined): string | null {
  if (!data) return null;
  const errs = data.errors;
  if (errs && typeof errs === 'object' && errs !== null) {
    const firstVal = Object.values(errs)[0];
    if (Array.isArray(firstVal) && firstVal.length > 0 && typeof firstVal[0] === 'string')
      return firstVal[0];
  }
  if (typeof data.message === 'string' && data.message.trim()) return data.message;
  return null;
}

interface ShopCustomerAuthFormProps {
  /** Si viene del panel lateral: ejecutar esto después de guardar token (cerrar drawer, etc.) */
  onSuccess?: () => void;
  emailInputRef?: RefObject<HTMLInputElement | null>;
}

export default function ShopCustomerAuthForm({
  onSuccess,
  emailInputRef,
}: ShopCustomerAuthFormProps) {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const trimmedEmail = email.trim();
      const trimmedName = name.trim();

      const endpoint = isRegister ? '/shop/register' : '/shop/login';
      const payload = isRegister
        ? {
            name: trimmedName,
            email: trimmedEmail,
            password,
            password_confirmation: password,
          }
        : { email: trimmedEmail, password };

      const { data } = await api.post(endpoint, payload);

      const token =
        typeof data?.token === 'string'
          ? data.token
          : typeof (data as { data?: { token?: string } })?.data?.token === 'string'
            ? (data as { data: { token: string } }).data.token
            : null;
      if (!token) {
        toast.error('Respuesta inválida del servidor (sin token).');
        return;
      }

      localStorage.setItem('shop_token', token);
      window.dispatchEvent(new Event('shop-auth-changed'));

      toast.success(isRegister ? 'Cuenta creada' : 'Bienvenido');

      if (onSuccess) {
        onSuccess();
      }
      router.push('/account');
    } catch (error: unknown) {
      let msg = 'No se pudo completar la acción. Revisa tus datos.';
      if (error && typeof error === 'object' && 'response' in error) {
        const r = (
          error as { response?: { status?: number; data?: Record<string, unknown> } }
        ).response;
        const parsed =
          typeof r?.data === 'object' && r?.data !== null ? messageFrom422(r.data) : null;
        if (parsed) msg = parsed;
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="galaxia-auth-form-inner">
      <div key={isRegister ? 'reg' : 'login'} className="galaxia-auth-form-pane">
        <h2 className="font-inter text-xl font-bold tracking-tight text-white sm:text-2xl">
          {isRegister ? 'Crear cuenta' : 'Acceder'}
        </h2>
        <p className="mt-2 text-sm font-medium tracking-wide text-white/85">
          {isRegister ? 'Únete a Castella Sagarra' : 'Castella Sagarra'}
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          {isRegister && (
            <label className="block">
              <span className="mb-2 block font-inter text-[11px] font-bold uppercase tracking-[0.22em] text-white">
                Nombre <span className="font-black text-white">*</span>
              </span>
              <input
                autoComplete="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre y apellido"
                className="w-full rounded-xl border border-white/25 bg-neutral-950 px-4 py-3.5 text-[15px] text-white outline-none placeholder:text-white/35 focus-visible:border-white focus-visible:ring-2 focus-visible:ring-white/30"
              />
            </label>
          )}

          <label className="block">
            <span className="mb-2 block font-inter text-[11px] font-bold uppercase tracking-[0.22em] text-white">
              Correo electrónico <span className="font-black text-white">*</span>
            </span>
            <input
              ref={emailInputRef}
              id="galaxia-auth-email"
              autoComplete="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              className="w-full rounded-xl border border-white/25 bg-neutral-950 px-4 py-3.5 text-[15px] text-white outline-none placeholder:text-white/35 focus-visible:border-white focus-visible:ring-2 focus-visible:ring-white/30"
            />
          </label>

          <label className="block">
            <span className="mb-2 block font-inter text-[11px] font-bold uppercase tracking-[0.22em] text-white">
              Contraseña <span className="font-black text-white">*</span>
            </span>
            {isRegister && (
              <p className="mb-2 text-xs font-medium text-white/70">Mínimo 8 caracteres</p>
            )}
            <input
              id="galaxia-auth-password"
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              type="password"
              required
              minLength={isRegister ? 8 : undefined}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-white/25 bg-neutral-950 px-4 py-3.5 text-[15px] text-white outline-none placeholder:text-white/35 focus-visible:border-white focus-visible:ring-2 focus-visible:ring-white/30"
            />
          </label>

          {!isRegister && (
            <div className="text-center">
              <button
                type="button"
                className="text-sm font-medium text-white underline decoration-white/50 underline-offset-4 transition hover:decoration-white"
                onClick={() =>
                  toast.info('Recuperación de contraseña disponible muy pronto')
                }
              >
                ¿Has olvidado tu contraseña?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-white px-6 py-3.5 font-inter text-sm font-black uppercase tracking-[0.22em] text-black shadow-[0_16px_40px_-12px_rgba(255,255,255,0.35)] transition hover:bg-neutral-200 active:scale-[0.99] disabled:opacity-50"
          >
            {loading ? 'Procesando…' : isRegister ? 'Registrar' : 'Ingresar'}
          </button>
        </form>

        <div className="mt-6">
          <button
            type="button"
            onClick={() => setIsRegister(!isRegister)}
            className="w-full rounded-full border-2 border-white bg-transparent px-6 py-3.5 font-inter text-sm font-bold uppercase tracking-[0.18em] text-white transition hover:bg-white hover:text-black"
          >
            {isRegister ? 'Ya tengo cuenta · Ingresar' : 'Crear una cuenta'}
          </button>
        </div>
      </div>
    </div>
  );
}
