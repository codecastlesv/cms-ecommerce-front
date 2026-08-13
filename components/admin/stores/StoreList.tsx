'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/axios';
import { Store as StoreIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useConfirm } from '@/components/providers/ConfirmDialogProvider';
import { handleError } from '@/lib/errorHandler';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    rectSortingStrategy,
    sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { SortableStoreCard } from './SortableStoreCard';

type StoreRow = {
    id: number;
    name: string;
    alias?: string | null;
    code: string;
    address: string;
    city: string;
    email?: string;
    image?: string | null;
    is_active?: boolean;
    is_pickup_enabled?: boolean;
    priority_order?: number;
};

export default function StoreList() {
    const [stores, setStores] = useState<StoreRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [savingOrder, setSavingOrder] = useState(false);
    const confirm = useConfirm();

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    useEffect(() => {
        api.get('/admin/stores').then(({ data }) => {
            const list = Array.isArray(data) ? data : [];
            setStores(
                [...list].sort(
                    (a, b) =>
                        (a.priority_order ?? 0) - (b.priority_order ?? 0) || a.id - b.id
                )
            );
            setLoading(false);
        });
    }, []);

    const persistOrder = async (ordered: StoreRow[]) => {
        setSavingOrder(true);
        try {
            const items = ordered.map((store, index) => ({
                id: store.id,
                order: index + 1,
            }));
            await api.post('/admin/stores/reorder', { items });
            toast.success('Prioridad de despacho actualizada');
        } catch (error) {
            toast.error(handleError(error, 'Error al guardar el orden'));
        } finally {
            setSavingOrder(false);
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        setStores((items) => {
            const oldIndex = items.findIndex((item) => item.id === active.id);
            const newIndex = items.findIndex((item) => item.id === over.id);
            if (oldIndex < 0 || newIndex < 0) return items;

            const next = arrayMove(items, oldIndex, newIndex).map((store, index) => ({
                ...store,
                priority_order: index + 1,
            }));
            void persistOrder(next);
            return next;
        });
    };

    const handleDelete = async (id: number) => {
        confirm({
            title: 'Eliminar Sucursal',
            message: '¿Estás seguro que deseas eliminar la sucursal?',
            confirmText: 'Sí, Salir',
            variant: 'danger',
            onConfirm: async () => {
                try {
                    await api.delete(`/admin/stores/${id}`);
                    setStores((prev) => prev.filter((s) => s.id !== id));
                    toast.success('Sucursal eliminada');
                } catch (error) {
                    toast.error(handleError(error, 'Error al eliminar'));
                }
            },
        });
    };

    return (
        <div className="max-w-7xl mx-auto p-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Sucursales</h1>
                    <p className="text-sm text-slate-500">
                        Arrastra las tarjetas para definir la prioridad de despacho a domicilio (La #1 tendrá mayor
                        prioridad).
                        {savingOrder ? (
                            <span className="ml-2 text-amber-600 font-medium">Guardando orden…</span>
                        ) : null}
                    </p>
                </div>
                <Link
                    href="stores/create"
                    className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-800 flex items-center shadow-lg shadow-slate-900/20"
                >
                    <StoreIcon className="w-4 h-4 mr-2" /> Nueva Sucursal
                </Link>
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={stores.map((s) => s.id)} strategy={rectSortingStrategy}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {stores.map((store, index) => (
                            <SortableStoreCard
                                key={store.id}
                                store={store}
                                priorityRank={index + 1}
                                onDelete={handleDelete}
                            />
                        ))}

                        {stores.length === 0 && !loading ? (
                            <Link
                                href="stores/create"
                                className="border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center text-slate-400 hover:border-slate-400 hover:text-slate-600 transition h-64"
                            >
                                <StoreIcon className="w-8 h-8 mb-2" />
                                <span className="font-bold text-sm">Crear primera sucursal</span>
                            </Link>
                        ) : null}
                    </div>
                </SortableContext>
            </DndContext>
        </div>
    );
}
