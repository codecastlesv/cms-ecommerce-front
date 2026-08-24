"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';

type CartItem = {
  quantity?: number;
  price?: number | string;
};

type CartIconProps = {
  onOpen?: () => void;
  /** Ícono solo (móvil) o ícono + etiquetas (desktop, mock ferretería). */
  variant?: 'icon' | 'labeled';
};

const ACCENT_RED = '#E30613';

function formatMoney(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
}

export default function CartIcon({ onOpen, variant = 'icon' }: CartIconProps) {
  const [itemCount, setItemCount] = useState(0);
  const [subtotal, setSubtotal] = useState(0);
  const [mounted, setMounted] = useState(false);

  const [isBumping, setIsBumping] = useState(false);
  const [floaters, setFloaters] = useState<number[]>([]);

  const prevCount = useRef(0);

  const triggerAnimation = () => {
    setIsBumping(true);
    setTimeout(() => setIsBumping(false), 300);

    const id = Date.now();
    setFloaters((prev) => [...prev, id]);

    setTimeout(() => {
      setFloaters((prev) => prev.filter((f) => f !== id));
    }, 1000);
  };

  useEffect(() => {
    setMounted(true);

    const readCart = () => {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]') as CartItem[];
      const totalItems = cart.reduce((acc, item) => acc + (item.quantity || 1), 0);
      const total = cart.reduce(
        (acc, item) => acc + Number(item.price || 0) * (item.quantity || 1),
        0,
      );
      return { totalItems, total };
    };

    const initial = readCart();
    prevCount.current = initial.totalItems;
    setItemCount(initial.totalItems);
    setSubtotal(initial.total);

    const updateCount = () => {
      const { totalItems, total } = readCart();

      if (totalItems > prevCount.current) {
        triggerAnimation();
      }

      prevCount.current = totalItems;
      setItemCount(totalItems);
      setSubtotal(total);
    };

    window.addEventListener('cartUpdated', updateCount);
    return () => window.removeEventListener('cartUpdated', updateCount);
  }, []);

  const iconInner = (
    <>
      <style>{`
        @keyframes float-up-fade {
          0% { opacity: 0; transform: translateY(0) scale(0.5); }
          20% { opacity: 1; transform: translateY(-10px) scale(1.3); }
          100% { opacity: 0; transform: translateY(-35px) scale(1); }
        }
        .animate-float-up {
          animation: float-up-fade 1s ease-out forwards;
        }
      `}</style>

      <ShoppingCart className="h-6 w-6 stroke-[1.5]" />

      {mounted && (
        <span
          className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-0.5 text-[10px] font-bold text-white shadow-sm"
          style={{ backgroundColor: ACCENT_RED }}
        >
          {itemCount}
        </span>
      )}

      {floaters.map((id) => (
        <span
          key={id}
          className="pointer-events-none absolute right-0 top-0 z-50 select-none text-sm font-black animate-float-up"
          style={{ color: ACCENT_RED }}
        >
          +1
        </span>
      ))}
    </>
  );

  if (variant === 'labeled') {
    const labeledClass = `font-helvetica flex items-center gap-2 rounded-md px-1.5 py-1 transition hover:bg-black/5 ${
      isBumping ? 'scale-[1.02]' : ''
    }`;

    const labeledInner = (
      <>
        <span className="relative flex shrink-0 items-center justify-center text-slate-900">
          {iconInner}
        </span>
        <span className="hidden min-w-0 text-left leading-tight min-[992px]:block">
          <span className="block text-base font-bold text-slate-900">Carrito</span>
          <span className="block text-base text-slate-600">
            {mounted ? formatMoney(subtotal) : '$0.00'}
          </span>
        </span>
      </>
    );

    if (onOpen) {
      return (
        <button
          type="button"
          onClick={() => onOpen()}
          aria-label="Abrir carrito"
          aria-haspopup="dialog"
          className={labeledClass}
        >
          {labeledInner}
        </button>
      );
    }

    return (
      <Link href="/cart" className={labeledClass}>
        {labeledInner}
      </Link>
    );
  }

  const className = `font-helvetica relative flex shrink-0 items-center justify-center rounded-full p-1.5 transition-all duration-300 hover:bg-black hover:text-white md:p-2 ${
    isBumping ? 'scale-110 bg-gray-100 text-black' : 'scale-100'
  }`;

  if (onOpen) {
    return (
      <button
        type="button"
        onClick={() => onOpen()}
        aria-label="Abrir carrito"
        aria-haspopup="dialog"
        className={className}
      >
        {iconInner}
      </button>
    );
  }

  return (
    <Link href="/cart" className={className}>
      {iconInner}
    </Link>
  );
}
