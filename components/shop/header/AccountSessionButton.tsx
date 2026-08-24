'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { User } from 'lucide-react';
import api from '@/lib/axios';

function initialsFromName(name: string | null | undefined): string {
  const parts = (name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return 'FC';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
}

type Props = {
  onGuestClick: () => void;
  /** Ícono solo (móvil) o ícono + etiquetas (desktop). */
  variant?: 'icon' | 'labeled';
};

export default function AccountSessionButton({ onGuestClick, variant = 'icon' }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const refreshSession = useCallback(async () => {
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('shop_token') : null;
    if (!token) {
      setIsAuthenticated(false);
      setDisplayName(null);
      setMenuOpen(false);
      return;
    }

    setIsAuthenticated(true);
    try {
      const res = await api.get<{ name?: string; data?: { name?: string } }>('/shop/me');
      const payload = (res.data?.data ?? res.data) as { name?: string } | undefined;
      setDisplayName(payload?.name?.trim() || null);
    } catch {
      setDisplayName(null);
    }
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [pathname, refreshSession]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'shop_token') void refreshSession();
    };
    const onAuthChanged = () => {
      void refreshSession();
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('shop-auth-changed', onAuthChanged);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('shop-auth-changed', onAuthChanged);
    };
  }, [refreshSession]);

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      window.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const handleLogout = () => {
    localStorage.removeItem('shop_token');
    window.dispatchEvent(new Event('shop-auth-changed'));
    setIsAuthenticated(false);
    setDisplayName(null);
    setMenuOpen(false);
    router.push('/');
  };

  const menu = menuOpen ? (
    <div
      role="menu"
      className="absolute right-0 top-[calc(100%+0.5rem)] z-[70] min-w-[11.5rem] overflow-hidden rounded-lg border border-slate-200 bg-white py-1 font-helvetica shadow-lg"
    >
      <Link
        href="/account"
        role="menuitem"
        onClick={() => setMenuOpen(false)}
        className="block px-3.5 py-2.5 text-sm text-slate-800 transition hover:bg-slate-50"
      >
        Mi Perfil
      </Link>
      <Link
        href="/order"
        role="menuitem"
        onClick={() => setMenuOpen(false)}
        className="block px-3.5 py-2.5 text-sm text-slate-800 transition hover:bg-slate-50"
      >
        Mis Pedidos
      </Link>
      <button
        type="button"
        role="menuitem"
        onClick={handleLogout}
        className="block w-full px-3.5 py-2.5 text-left text-sm text-red-600 transition hover:bg-red-50"
      >
        Cerrar Sesión
      </button>
    </div>
  ) : null;

  if (!isAuthenticated) {
    if (variant === 'labeled') {
      return (
        <button
          type="button"
          aria-label="Cuenta"
          onClick={onGuestClick}
          className="flex items-center gap-2 rounded-md px-1.5 py-1 font-helvetica transition hover:bg-black/5"
        >
          <User className="h-6 w-6 shrink-0 stroke-[1.5] text-slate-900" />
          <span className="hidden min-w-0 text-left leading-tight min-[992px]:block">
            <span className="block text-base font-bold text-slate-900">Mi cuenta</span>
            <span className="block text-base text-slate-600">Iniciar sesión</span>
          </span>
        </button>
      );
    }

    return (
      <button
        type="button"
        aria-label="Cuenta"
        onClick={onGuestClick}
        className="flex-shrink-0 rounded-full p-1.5 font-helvetica transition hover:bg-gray-100 md:p-2"
      >
        <User className="h-[22px] w-[22px] stroke-[1.5] md:h-6 md:w-6" />
      </button>
    );
  }

  const initials = initialsFromName(displayName);

  if (variant === 'labeled') {
    return (
      <div ref={rootRef} className="relative flex-shrink-0 font-helvetica">
        <button
          type="button"
          aria-label="Cuenta activa"
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          onClick={() => setMenuOpen((o) => !o)}
          className="flex items-center gap-2 rounded-md px-1.5 py-1 transition hover:bg-black/5"
        >
          <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0B2340] text-[11px] font-semibold tracking-wide text-white">
            <span aria-hidden>{initials}</span>
            <span
              className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500"
              title="Sesión activa"
              aria-hidden
            />
          </span>
          <span className="hidden min-w-0 text-left leading-tight min-[992px]:block">
            <span className="block text-base font-bold text-slate-900">Mi cuenta</span>
            <span className="block max-w-[7rem] truncate text-base text-slate-600">
              {displayName || 'Sesión activa'}
            </span>
          </span>
        </button>
        {menu}
      </div>
    );
  }

  return (
    <div ref={rootRef} className="relative flex-shrink-0 font-helvetica">
      <button
        type="button"
        aria-label="Cuenta activa"
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        onClick={() => setMenuOpen((o) => !o)}
        className="relative flex h-8 w-8 items-center justify-center rounded-full bg-black text-[11px] font-semibold tracking-wide text-white transition hover:bg-zinc-800 md:h-8 md:w-8"
      >
        <span aria-hidden>{initials}</span>
        <span
          className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500"
          title="Sesión activa"
          aria-hidden
        />
      </button>
      {menu}
    </div>
  );
}
