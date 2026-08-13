"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';

type CartItem = {
  quantity?: number;
};

type CartIconProps = {
  onOpen?: () => void;
};

export default function CartIcon({ onOpen }: CartIconProps) {
  const [itemCount, setItemCount] = useState(0);
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

    const initialCart = JSON.parse(localStorage.getItem('cart') || '[]');
    const initialItems = initialCart.reduce((acc: number, item: CartItem) => acc + (item.quantity || 1), 0);
    prevCount.current = initialItems;
    setItemCount(initialItems);

    const updateCount = () => {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      const totalItems = cart.reduce((acc: number, item: CartItem) => acc + (item.quantity || 1), 0);

      if (totalItems > prevCount.current) {
        triggerAnimation();
      }

      prevCount.current = totalItems;
      setItemCount(totalItems);
    };

    window.addEventListener('cartUpdated', updateCount);
    return () => window.removeEventListener('cartUpdated', updateCount);
  }, []);

  const className = `p-1.5 md:p-2 hover:bg-black hover:text-white rounded-full transition-all duration-300 relative flex items-center justify-center shrink-0 ${
    isBumping ? 'scale-110 bg-gray-100 text-black' : 'scale-100'
  }`;

  const inner = (
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

      <ShoppingBag className="h-[22px] w-[22px] stroke-[1.5] md:h-6 md:w-6" />

      {mounted && itemCount >= 0 && (
        <span className="absolute top-0.5 right-0.5 md:top-1 md:right-1 bg-amber-500 text-[10px] text-white font-bold w-4 h-4 flex items-center justify-center rounded-full shadow-sm">
          {itemCount}
        </span>
      )}

      {floaters.map((id) => (
        <span
          key={id}
          className="absolute top-0 right-0 text-amber-500 font-black text-sm pointer-events-none animate-float-up z-50 select-none"
        >
          +1
        </span>
      ))}
    </>
  );

  if (onOpen) {
    return (
      <button
        type="button"
        onClick={() => onOpen()}
        aria-label="Abrir carrito"
        aria-haspopup="dialog"
        className={className}
      >
        {inner}
      </button>
    );
  }

  return (
    <Link href="/cart" className={className}>
      {inner}
    </Link>
  );
}
