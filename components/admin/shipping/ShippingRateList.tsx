'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { Loader2, Pencil, Plus, Trash2, Truck, X } from 'lucide-react';
import { useConfirm } from '@/components/providers/ConfirmDialogProvider';
import { usePermission } from '@/hooks/usePermission';
import { handleError } from '@/lib/errorHandler';
import type { ShippingRate } from '@/types/shipping';

const schema = z.object({
  min_weight: z.coerce.number().min(0, 'Peso mínimo inválido'),
  max_weight: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? null : v),
    z.coerce.number().min(0).nullable()
  ),
  price: z.coerce.number().min(0, 'Precio inválido'),
}).superRefine((data, ctx) => {
  if (data.max_weight !== null && data.max_weight < data.min_weight) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'El peso máximo debe ser ≥ al mínimo',
      path: ['max_weight'],
    });
  }
});

//type FormData = z.infer<typeof schema>;

type FormInput = z.input<typeof schema>;
type FormData = z.output<typeof schema>;

function formatWeight(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return 'Sin límite';
  return `${Number(value).toFixed(2)} Lbs`;
}

function formatMoney(value: number | string): string {
  return `$${Number(value).toFixed(2)}`;
}

export default function ShippingRateList() {
  const confirm = useConfirm();
  const { can } = usePermission();
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormInput, unknown, FormData>({
    resolver: zodResolver(schema),
    defaultValues: { min_weight: 0, max_weight: null, price: 0 },
  });

  const fetchRates = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<{ data: ShippingRate[] }>('/admin/shipping-rates');
      setRates(data.data ?? []);
    } catch (error) {
      toast.error(handleError(error, 'Cargar rangos de envío'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    reset({ min_weight: 0, max_weight: null, price: 0 });
    setFormOpen(true);
  };

  const openEdit = (rate: ShippingRate) => {
    setEditingId(rate.id);
    reset({
      min_weight: Number(rate.min_weight),
      max_weight: rate.max_weight === null || rate.max_weight === undefined
        ? null
        : Number(rate.max_weight),
      price: Number(rate.price),
    });
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
    reset({ min_weight: 0, max_weight: null, price: 0 });
  };

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      const payload = {
        min_weight: data.min_weight,
        max_weight: data.max_weight,
        price: data.price,
      };

      if (editingId) {
        await api.put(`/admin/shipping-rates/${editingId}`, payload);
        toast.success('Rango actualizado');
      } else {
        await api.post('/admin/shipping-rates', payload);
        toast.success('Rango creado');
      }
      closeForm();
      fetchRates();
    } catch (error) {
      toast.error(handleError(error, editingId ? 'Actualizar rango' : 'Crear rango'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (rate: ShippingRate) => {
    if (!can('delete_shipping_rates')) return;
    confirm({
      title: '¿Eliminar rango de envío?',
      message: `Se eliminará el rango ${formatWeight(rate.min_weight)} – ${formatWeight(rate.max_weight)}.`,
      variant: 'danger',
      onConfirm: async () => {
        try {
          await api.delete(`/admin/shipping-rates/${rate.id}`);
          toast.success('Rango eliminado');
          fetchRates();
        } catch (error) {
          toast.error(handleError(error, 'Eliminar rango'));
        }
      },
    });
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6 pb-24">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Truck className="w-6 h-6" />
            Rangos de envío
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Define precios de envío según el peso total del pedido (Lbs).
          </p>
        </div>
        {can('create_shipping_rates') && (
          <button
            type="button"
            onClick={openCreate}
            className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center hover:bg-slate-800 shadow-lg active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo rango
          </button>
        )}
      </div>

      {formOpen && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              {editingId ? 'Editar rango' : 'Nuevo rango'}
            </h2>
            <button type="button" onClick={closeForm} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                Peso mínimo (Lbs) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                {...register('min_weight')}
                className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-black/5"
              />
              {errors.min_weight && (
                <p className="text-xs text-red-600">{errors.min_weight.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                Peso máximo (Lbs)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Vacío = sin límite"
                {...register('max_weight')}
                className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-black/5"
              />
              {errors.max_weight && (
                <p className="text-xs text-red-600">{errors.max_weight.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                Precio ($) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                {...register('price')}
                className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-black/5"
              />
              {errors.price && (
                <p className="text-xs text-red-600">{errors.price.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={saving}
              className="h-[42px] bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {editingId ? 'Guardar' : 'Crear'}
            </button>
          </form>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[640px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
              <tr>
                <th className="px-6 py-3">Peso mínimo</th>
                <th className="px-6 py-3">Peso máximo</th>
                <th className="px-6 py-3">Precio</th>
                <th className="px-6 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center">
                    <Loader2 className="animate-spin inline text-slate-400 w-8 h-8" />
                  </td>
                </tr>
              ) : rates.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">
                    No hay rangos configurados. El checkout usará el precio por default de $3.50.
                  </td>
                </tr>
              ) : (
                rates.map((rate) => (
                  <tr key={rate.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      {formatWeight(rate.min_weight)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {formatWeight(rate.max_weight)}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900">
                      {formatMoney(rate.price)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {can('edit_shipping_rates') && (
                          <button
                            type="button"
                            onClick={() => openEdit(rate)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        )}
                        {can('delete_shipping_rates') && (
                          <button
                            type="button"
                            onClick={() => handleDelete(rate)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
