'use client';

import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import ShopCustomerAuthForm from '@/components/shop/auth/ShopCustomerAuthForm';

interface AccountAuthPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AccountAuthPanel({ isOpen, onClose }: AccountAuthPanelProps) {
  const [mounted, setMounted] = useState(false);
  const emailRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const t = window.setTimeout(() => {
      emailRef.current?.focus();
    }, 320);
    return () => window.clearTimeout(t);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!mounted) return null;

  const panel = (
    <div
      className={`fixed inset-0 z-[74] transition-[opacity,visibility] duration-500 ease-[cubic-bezier(0.33,1,0.36,1)] ${
        isOpen ? 'pointer-events-auto visible opacity-100' : 'pointer-events-none invisible opacity-0'
      }`}
      aria-hidden={!isOpen}
    >
      {/* overlay */}
      <div
        className={`absolute inset-0 bg-black/55 transition-opacity duration-500 ease-out ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
        aria-hidden
      />

      {/* drawer derecho — fixed + alto completo para no dejar hueco abajo */}
      <aside
        className={`pointer-events-auto fixed inset-y-0 right-0 z-[75] flex w-full max-w-[min(100vw,440px)] flex-col shadow-[0_0_80px_-12px_rgba(0,0,0,0.9)] transition-transform duration-500 ease-[cubic-bezier(0.33,1,0.36,1)] ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex min-h-[100dvh] w-full flex-1 flex-col overflow-hidden border-l border-white/15 bg-black">
          <header className="relative flex shrink-0 items-start justify-end gap-4 px-7 pb-2 pt-6 sm:px-9">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2.5 text-white/70 transition hover:bg-white hover:text-black"
              aria-label="Cerrar"
            >
              <X className="h-6 w-6 stroke-[2]" />
            </button>
          </header>

          <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden px-7 pb-12 pt-4 sm:px-9">
            <ShopCustomerAuthForm
              emailInputRef={emailRef}
              onSuccess={() => {
                onClose();
              }}
            />
          </div>
        </div>
      </aside>
    </div>
  );

  return createPortal(panel, document.body);
}
