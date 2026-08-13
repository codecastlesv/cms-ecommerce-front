'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { Save, ArrowLeft, Percent, CalendarClock, BadgePercent } from 'lucide-react';
import { handleError } from '@/lib/errorHandler';

type CouponFormProps = {
  mode: 'create' | 'edit';
  initialData?: {
    id?: number;
    code: string;
    percentage: number;
    starts_at: string | null;
    ends_at: string | null;
    is_active: boolean;
  };
};

export default function CouponForm({ mode, initialData }: CouponFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    code: initialData?.code ?? '',
    percentage: initialData?.percentage?.toString() ?? '',
    starts_at: initialData?.starts_at?.slice(0, 16) ?? '',
    ends_at: initialData?.ends_at?.slice(0, 16) ?? '',
    is_active: initialData?.is_active ?? true,
  });

  const inputClass =
    "w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-900 bg-white focus:ring-2 focus:ring-slate-900 outline-none";
  const labelClass =
    "block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const { name, value, type, checked } = e.target;

  setForm(prev => ({
    ...prev,
    [name]: type === 'checkbox' ? checked : value,
  }));
};

  const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const payload = {
            ...form,
            percentage: Number(form.percentage),
            starts_at: form.starts_at || null,
            ends_at: form.ends_at || null,
            };

            if (mode === 'create') {
            await api.post('/admin/coupons', payload);
            toast.success('Cupón creado');
            } else {
            await api.put(`/admin/coupons/${initialData?.id}`, payload);
            toast.success('Cupón actualizado');
            }

            router.push('/coupons');
            router.refresh();
        } catch (e) {
            toast.error(handleError(e, 'Error al guardar el cupón'));
        } finally {
            setSaving(false);
        }
    };


  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto pb-20 p-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-2 hover:bg-white rounded-full transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <h1 className="text-2xl font-bold text-slate-900">
            {mode === 'create'
              ? 'Nuevo Cupón'
              : `Editar cupón: ${form.code || '...'}`}
          </h1>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-slate-800 flex items-center shadow-lg shadow-slate-900/20 disabled:opacity-50 text-sm"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
          <h3 className="font-bold text-lg mb-2 flex items-center">
            <BadgePercent className="w-5 h-5 mr-2 text-blue-600" />
            Información del Cupón
          </h3>

          <div>
            <label className={labelClass}>Nombre del cupón</label>
            <input
              name="code"
              value={form.code}
              onChange={handleChange}
              className={inputClass}
              placeholder="Ej: DESCUENTO10"
              required
            />
          </div>

          <div>
            <label className={labelClass}>Porcentaje de descuento</label>
            <div className="relative">
              <Percent className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="number"
                name="percentage"
                min={1}
                max={100}
                value={form.percentage}
                onChange={handleChange}
                className={`${inputClass} pl-9`}
                placeholder="10"
                required
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
          <h3 className="font-bold text-lg mb-2 flex items-center">
            <CalendarClock className="w-5 h-5 mr-2 text-orange-500" />
            Vigencia
          </h3>

          <div>
            <label className={labelClass}>Fecha de inicio</label>
            <input
              type="datetime-local"
              name="starts_at"
              value={form.starts_at}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Fecha de fin</label>
            <input
              type="datetime-local"
              name="ends_at"
              value={form.ends_at}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <label className="flex items-center justify-between cursor-pointer p-3 border border-slate-300 rounded-xl hover:bg-slate-50 transition">
            <span className="font-bold text-sm text-slate-700">Cupón activo</span>
            <input
              type="checkbox"
              name="is_active"
              checked={form.is_active}
              onChange={handleChange}
              className="toggle-checkbox"
            />
          </label>
        </div>
      </div>
    </form>
  );
}