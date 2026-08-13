'use client';

import { useEffect, useState, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/axios';
import { toast } from 'sonner';
import {
    ArrowLeft, Save, Plus, Trash2, GripVertical, X, Image as ImageIcon,
    Zap, Search, Link as LinkIcon, AlertCircle, Layers, ListFilter, ChevronDown, Check, Filter
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import PermissionGate from '@/components/auth/PermissionGate';
import { usePermission } from '@/hooks/usePermission';
import { Attribute, LaravelResource } from '@/types';
import { CategorySearch } from '@/components/admin/attributes/CategorySearch';
import { handleError } from '@/lib/errorHandler';
import { useCatalog } from '@/components/providers/CatalogContext';

const schema = z.object({
    name: z.string().min(1, "Nombre requerido"),
    type: z.enum(['select', 'color', 'button', 'text']),
    is_variant: z.boolean(),
    is_filterable: z.boolean(),
    values: z.array(z.object({
        id: z.number().optional(),
        value: z.string().min(1, "Valor requerido"),
        color_hex: z.string().optional(),
        secondary_color_hex: z.string().optional(),
        swatch_image: z.string().optional().nullable(),
        swatch_file: z.any().optional(),
        category_codes: z.array(z.number()).optional(),
        remove_swatch: z.string().optional(),
    })).min(1, "Agrega al menos un valor"),
});

type FormData = z.infer<typeof schema>;

export default function AttributeForm({ attributeId }: { attributeId?: string }) {
    const router = useRouter();
    const { can } = usePermission();
    const { refreshCatalog } = useCatalog();
    const [loading, setLoading] = useState(false);

    const [bulkCategoryCodes, setBulkCategoryCodes] = useState<number[]>([]);
    const [bulkValuesText, setBulkValuesText] = useState('');
    const [isBulkOpen, setIsBulkOpen] = useState(false);

    const [viewFilterText, setViewFilterText] = useState('');
    const [viewFilterCategory, setViewFilterCategory] = useState<number[]>([]);

    const hasPermission = attributeId ? can('edit_attributes') : can('create_attributes');

    const { register, control, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: { type: 'select', is_variant: false, is_filterable: false, values: [{ value: '', category_codes: [] }] }
    });

    const { fields, append, remove } = useFieldArray({ control, name: 'values' });
    const watchType = watch('type');
    const formValues = watch('values');

    useEffect(() => {
        if (attributeId) {
            api.get<LaravelResource<Attribute>>(`/admin/attributes/${attributeId}`)
                .then(({ data }) => {
                    const attr = data.data;
                    reset({
                        name: attr.name,
                        type: attr.type,
                        is_variant: attr.is_variant,
                        is_filterable: attr.is_filterable,
                        values: attr.values.map(v => ({
                            id: v.id,
                            value: v.value,
                            color_hex: v.color_hex || '',
                            secondary_color_hex: v.secondary_color_hex || '',
                            swatch_image: v.swatch_image_url,
                            category_codes: v.category_codes || [],
                        }))
                    });
                })
                .catch(err => toast.error(handleError(err, 'Cargar')));
        }
    }, [attributeId, reset]);

    const handleBulkAdd = () => {
        if (!bulkValuesText.trim()) return toast.warning("Ingresa valores separados por coma");

        const valuesToAdd = bulkValuesText.split(/[,\n]+/).map(s => s.trim()).filter(s => s !== '');

        if (valuesToAdd.length === 0) return;

        valuesToAdd.forEach(val => {
            append({
                value: val,
                category_codes: bulkCategoryCodes,
                color_hex: '#000000',
                secondary_color_hex: '',
                remove_swatch: '0'
            });
        });

        toast.success(`${valuesToAdd.length} valores agregados`);
        setBulkValuesText('');
    };

    const onSubmit = async (data: FormData) => {
        if (!hasPermission) return;
        setLoading(true);

        const fd = new FormData();
        fd.append('name', data.name);
        fd.append('type', data.type);
        fd.append('is_variant', data.is_variant ? '1' : '0');
        fd.append('is_filterable', data.is_filterable ? '1' : '0');

        data.values.forEach((val, index) => {
            if (val.id) fd.append(`values[${index}][id]`, val.id.toString());
            fd.append(`values[${index}][value]`, val.value);
            if (val.color_hex) fd.append(`values[${index}][color_hex]`, val.color_hex);
            if (val.secondary_color_hex) fd.append(`values[${index}][secondary_color_hex]`, val.secondary_color_hex);

            if (val.swatch_file instanceof File) fd.append(`values[${index}][swatch]`, val.swatch_file);
            else if (val.remove_swatch === '1') fd.append(`values[${index}][remove_swatch]`, '1');

            const codes = val.category_codes || [];
            if (codes.length > 0) {
                codes.forEach((code, i) => {
                    fd.append(`values[${index}][category_codes][${i}]`, code.toString());
                });
            } else {
                fd.append(`values[${index}][category_codes]`, "");
            }
        });

        if (attributeId) fd.append('_method', 'PUT');

        try {
            await api.post(attributeId ? `/admin/attributes/${attributeId}` : '/admin/attributes', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            await refreshCatalog();
            toast.success('Guardado correctamente');
            router.push('/attributes');
        } catch (e) {
            toast.error(handleError(e, 'Guardar'));
        } finally {
            setLoading(false);
        }
    };

    const sortedIndices = useMemo(() => {
        return fields.map((field, i) => ({ index: i, val: formValues[i] }))
            .filter(item => {
                if (viewFilterText && !item.val.value.toLowerCase().includes(viewFilterText.toLowerCase())) return false;
                if (viewFilterCategory.length > 0 && !viewFilterCategory.some(c => item.val.category_codes?.includes(c))) return false;
                return true;
            })
            .map(item => item.index);
    }, [fields, formValues, viewFilterText, viewFilterCategory]);

    const handleFileChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const file = e.target.files[0];
            setValue(`values.${index}.swatch_file`, file);
            setValue(`values.${index}.swatch_image`, URL.createObjectURL(file));
            setValue(`values.${index}.remove_swatch`, '0');
        }
    };

    return (
        <PermissionGate permission={attributeId ? 'edit_attributes' : 'create_attributes'}>
            <form onSubmit={handleSubmit(onSubmit)} className="max-w-7xl mx-auto px-6 py-8 pb-32 font-sans">

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 sticky top-4 z-40 bg-white/90 backdrop-blur-xl p-4 rounded-xl border border-slate-200 shadow-lg shadow-slate-200/20">
                    <div className="flex items-center gap-4">
                        <button type="button" onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-lg transition text-slate-500 hover:text-black"><ArrowLeft className="w-5 h-5" /></button>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{attributeId ? 'Editar Atributo' : 'Nuevo Atributo'}</h1>
                            <div className="flex items-center gap-2 text-xs font-mono text-slate-500 mt-0.5">
                                <span className="bg-slate-100 px-1.5 rounded">{watchType.toUpperCase()}</span>
                                <span>• {fields.length} valores</span>
                            </div>
                        </div>
                    </div>
                    <button type="submit" disabled={loading} className="w-full sm:w-auto bg-black text-white px-6 py-2.5 rounded-lg font-bold text-sm hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg shadow-black/10 disabled:opacity-70">
                        {loading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <Save className="w-4 h-4" />} Guardar
                    </button>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">

                    <div className="xl:col-span-4 space-y-6">

                        <Card className="p-6 space-y-6">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                                <Filter className="w-3 h-3 text-slate-600" /> Configuración
                            </h3>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 ml-1">Nombre</label>
                                <input {...register('name')} placeholder="Ej: Talla, Material" className={`w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-2 focus:ring-black/5 focus:border-slate-400 block p-2.5 outline-none ${errors.name ? 'border-red-300' : ''}`} />
                                {errors.name && <p className="text-[10px] text-red-500 ml-1">{errors.name.message}</p>}
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-700 ml-1 block mb-2">Estilo Visual</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['select', 'button', 'color'].map(t => (
                                        <label key={t} className={`cursor-pointer border rounded-lg p-2 text-center text-xs font-bold transition-all ${watchType === t ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-white text-slate-500 hover:border-slate-300'}`}>
                                            <input type="radio" value={t} {...register('type')} className="hidden" /> {t.toUpperCase()}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100 space-y-3">
                                <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:border-slate-300 cursor-pointer transition-all bg-slate-50/50">
                                    <input type="checkbox" {...register('is_variant')} className="accent-black w-4 h-4 rounded" />
                                    <div>
                                        <span className="block text-sm font-bold text-slate-800">Es Variante</span>
                                        <span className="block text-[10px] text-slate-500">Genera SKUs (Precio/Stock). Ej: Tallas.</span>
                                    </div>
                                    <Layers className={`w-4 h-4 ml-auto ${watch('is_variant') ? 'text-black' : 'text-slate-300'}`} />
                                </label>

                                <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:border-slate-300 cursor-pointer transition-all bg-slate-50/50">
                                    <input type="checkbox" {...register('is_filterable')} className="accent-black w-4 h-4 rounded" />
                                    <div>
                                        <span className="block text-sm font-bold text-slate-800">Es Filtro</span>
                                        <span className="block text-[10px] text-slate-500">Visible en sidebar. Ej: Color, Tela.</span>
                                    </div>
                                    <ListFilter className={`w-4 h-4 ml-auto ${watch('is_filterable') ? 'text-black' : 'text-slate-300'}`} />
                                </label>
                            </div>
                        </Card>

                        <div className={`border rounded-xl transition-all duration-300 overflow-hidden ${isBulkOpen ? 'border-slate-300 bg-white shadow-lg' : 'border-slate-200 bg-slate-50'}`}>
                            <button type="button" onClick={() => setIsBulkOpen(!isBulkOpen)} className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-100 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${isBulkOpen ? 'bg-black text-white' : 'bg-slate-200 text-slate-500'}`}>
                                        <Zap className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h3 className={`text-sm font-bold ${isBulkOpen ? 'text-slate-900' : 'text-slate-600'}`}>Generador Masivo</h3>
                                        {!isBulkOpen && <p className="text-[10px] text-slate-400">Crear múltiples valores rápido</p>}
                                    </div>
                                </div>
                                <Search className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isBulkOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isBulkOpen && (
                                <div className="p-5 pt-0 space-y-5 animate-in slide-in-from-top-2">
                                    <div className="h-px bg-slate-100 mb-4" />

                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block flex items-center gap-1"><LinkIcon className="w-3 h-3" /> 1. Asociar Categorías (Opcional)</label>
                                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                                            <CategorySearch selectedCodes={bulkCategoryCodes} onSelectionChange={setBulkCategoryCodes} placeholder="Buscar categorías..." />
                                            <p className="text-[9px] text-slate-400 mt-1.5 px-1">Estas categorías se aplicarán a todos los valores creados abajo.</p>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">2. Lista de Valores</label>
                                        <textarea
                                            value={bulkValuesText}
                                            onChange={e => setBulkValuesText(e.target.value)}
                                            placeholder="Ej: XS, S, M, L, XL (separados por comas)"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-black/5 outline-none h-24 resize-none placeholder-slate-400"
                                        />
                                    </div>

                                    <button type="button" onClick={handleBulkAdd} className="w-full bg-slate-900 text-white py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-black transition shadow-md active:scale-95 flex items-center justify-center gap-2">
                                        <Plus className="w-3 h-3" /> Generar Valores
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="xl:col-span-8">
                        <Card className="min-h-[600px] flex flex-col relative border-slate-200 shadow-sm overflow-hidden">

                            <div className="p-3 border-b border-slate-100 bg-white/80 backdrop-blur sticky top-0 z-20 flex gap-3">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                                    <input placeholder="Filtrar valores..." value={viewFilterText} onChange={e => setViewFilterText(e.target.value)} className="w-full pl-9 border border-slate-200 rounded-lg py-2 text-xs outline-none focus:border-slate-400 bg-slate-50 focus:bg-white transition-all" />
                                </div>
                                <div className="w-1/3">
                                    <CategorySearch selectedCodes={viewFilterCategory} onSelectionChange={setViewFilterCategory} placeholder="Filtrar por categoría..." />
                                </div>
                                {(viewFilterText || viewFilterCategory.length > 0) && (
                                    <button type="button" onClick={() => { setViewFilterText(''); setViewFilterCategory([]); }} className="px-3 py-2 text-xs bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 font-bold transition">Limpiar</button>
                                )}
                            </div>

                            <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-[650px] bg-slate-50/30 custom-scrollbar">
                                {sortedIndices.length === 0 && (
                                    <div className="flex flex-col items-center justify-center h-64 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                                        <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
                                        <p className="text-sm font-medium text-slate-600">No hay valores visibles.</p>
                                    </div>
                                )}

                                {sortedIndices.map((originalIndex) => {
                                    const field = fields[originalIndex];
                                    const index = originalIndex;

                                    return (
                                        <div key={field.id} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group relative">
                                            <div className="text-slate-300 cursor-grab active:cursor-grabbing hidden sm:block"><GripVertical className="w-4 h-4" /></div>

                                            <div className="w-full sm:w-1/4 min-w-[140px]">
                                                <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">Valor</label>
                                                <input {...register(`values.${index}.value`)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all bg-slate-50 focus:bg-white" placeholder="Valor" />
                                                {errors.values?.[index]?.value && <p className="text-[9px] text-red-500 mt-1">{errors.values[index]?.value?.message}</p>}
                                            </div>

                                            <div className="flex-1 w-full">
                                                <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block flex items-center gap-1"><LinkIcon className="w-3 h-3" /> Categorías Asociadas</label>
                                                <CategorySearch
                                                    selectedCodes={watch(`values.${index}.category_codes`) || []}
                                                    onSelectionChange={(codes) => setValue(`values.${index}.category_codes`, codes)}
                                                    placeholder="Vincular a categorías..."
                                                />
                                            </div>

                                            {watchType === 'color' && (
                                                <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase mb-1">Color</span>
                                                        <div className="w-8 h-8 rounded-full border border-slate-200 overflow-hidden relative cursor-pointer shadow-sm">
                                                            <input type="color" {...register(`values.${index}.color_hex`)} className="absolute w-[150%] h-[150%] -top-2 -left-2 cursor-pointer" />
                                                        </div>
                                                    </div>
                                                    <div className="w-px h-8 bg-slate-200" />
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase mb-1">Textura</span>
                                                        <label className="w-8 h-8 flex items-center justify-center bg-white rounded-md border border-slate-200 cursor-pointer hover:border-black transition text-slate-400 shadow-sm overflow-hidden group/img relative">
                                                            {watch(`values.${index}.swatch_image`) ? (
                                                                <>
                                                                    <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${watch(`values.${index}.swatch_image`)})` }} />
                                                                    <button type="button" onClick={() => { setValue(`values.${index}.swatch_file`, undefined); setValue(`values.${index}.swatch_image`, null); setValue(`values.${index}.remove_swatch`, '1'); }} className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition text-white"><X className="w-3 h-3" /></button>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <ImageIcon className="w-4 h-4" />
                                                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(index, e)} />
                                                                </>
                                                            )}
                                                        </label>
                                                    </div>
                                                </div>
                                            )}

                                            <button type="button" onClick={() => remove(index)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition ml-auto"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    )
                                })}
                            </div>

                            <div className="p-4 bg-white border-t border-slate-100 sticky bottom-0 z-20">
                                <button type="button" onClick={() => append({ value: '', category_codes: [] })} className="w-full py-2.5 border-2 border-dashed border-slate-300 rounded-xl text-xs font-bold text-slate-500 hover:border-slate-500 hover:text-slate-800 transition uppercase tracking-wide flex justify-center items-center gap-2 bg-slate-50 hover:bg-white">
                                    <Plus className="w-4 h-4" /> Añadir Valor Manualmente
                                </button>
                            </div>
                        </Card>
                    </div>
                </div>
            </form>
        </PermissionGate>
    );
}