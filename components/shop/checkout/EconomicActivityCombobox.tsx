'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import api from '@/lib/axios';

export type EconomicActivityOption = {
  id: number;
  code: string;
  description: string;
};

type EconomicActivityComboboxProps = {
  value: EconomicActivityOption | null;
  onChange: (value: EconomicActivityOption | null) => void;
  inputClassName?: string;
};

export default function EconomicActivityCombobox({
  value,
  onChange,
  inputClassName,
}: EconomicActivityComboboxProps) {
  const [query, setQuery] = useState(value ? `${value.code} — ${value.description}` : '');
  const [options, setOptions] = useState<EconomicActivityOption[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      setQuery(`${value.code} — ${value.description}`);
    }
  }, [value]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setOptions([]);
      return;
    }

    // Si el texto coincide exactamente con la selección actual, no buscar de nuevo.
    if (value && `${value.code} — ${value.description}` === query) {
      return;
    }

    const t = window.setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get<{ data?: EconomicActivityOption[] }>('/economic-activities', {
          params: { q, limit: 25 },
        });
        setOptions(Array.isArray(res.data?.data) ? res.data.data : []);
        setOpen(true);
      } catch {
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 280);

    return () => window.clearTimeout(t);
  }, [query, value]);

  return (
    <div ref={wrapRef} className="relative">
      <label className="block text-[13px] font-medium mb-1">Giro / Actividad económica *</label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(null);
            setOpen(true);
          }}
          onFocus={() => {
            if (options.length > 0) setOpen(true);
          }}
          placeholder="Buscar: calzado, deporte, comercio…"
          className={`${inputClassName ?? ''} pl-9 pr-9`}
          autoComplete="off"
        />
        {loading ? (
          <Loader2 className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-400" />
        ) : null}
      </div>

      {open && options.length > 0 ? (
        <ul className="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-sm border border-gray-200 bg-white shadow-lg">
          {options.map((opt) => (
            <li key={opt.id}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                onClick={() => {
                  onChange(opt);
                  setQuery(`${opt.code} — ${opt.description}`);
                  setOpen(false);
                }}
              >
                <span className="font-semibold text-slate-900">{opt.code}</span>
                <span className="mt-0.5 block text-xs text-gray-600">{opt.description}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
