'use client';

import { useEffect, useState } from 'react';

function getRemaining(endsAt: string) {
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return null;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return { days, hours, minutes, seconds };
}

export default function CampaignCountdown({ endsAt }: { endsAt: string }) {
  const [remaining, setRemaining] = useState(() => getRemaining(endsAt));

  useEffect(() => {
    const timer = setInterval(() => setRemaining(getRemaining(endsAt)), 1000);
    return () => clearInterval(timer);
  }, [endsAt]);

  if (!remaining) return null;

  return (
    <div className="absolute right-4 top-4 z-[3] flex gap-1.5 rounded-xl bg-[#08204E]/35 px-3 py-2.5 backdrop-blur-sm sm:right-6 sm:top-6">
      <div className="min-w-[36px] text-center text-white [text-shadow:0_1px_6px_rgba(0,0,0,0.55)]">
        <div className="font-helvetica text-lg font-extrabold tabular-nums">{String(remaining.days).padStart(2, '0')}</div>
        <div className="font-helvetica text-[9px] uppercase tracking-wide text-[#E4EAF6]">Días</div>
      </div>
      <div className="min-w-[36px] text-center text-white [text-shadow:0_1px_6px_rgba(0,0,0,0.55)]">
        <div className="font-helvetica text-lg font-extrabold tabular-nums">{String(remaining.hours).padStart(2, '0')}</div>
        <div className="font-helvetica text-[9px] uppercase tracking-wide text-[#E4EAF6]">Hrs</div>
      </div>
      <div className="min-w-[36px] text-center text-white [text-shadow:0_1px_6px_rgba(0,0,0,0.55)]">
        <div className="font-helvetica text-lg font-extrabold tabular-nums">{String(remaining.minutes).padStart(2, '0')}</div>
        <div className="font-helvetica text-[9px] uppercase tracking-wide text-[#E4EAF6]">Min</div>
      </div>
      <div className="min-w-[36px] text-center text-white [text-shadow:0_1px_6px_rgba(0,0,0,0.55)]">
        <div className="font-helvetica text-lg font-extrabold tabular-nums">{String(remaining.seconds).padStart(2, '0')}</div>
        <div className="font-helvetica text-[9px] uppercase tracking-wide text-[#E4EAF6]">Seg</div>
      </div>
    </div>
  );
}
