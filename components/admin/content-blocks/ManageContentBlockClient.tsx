'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Loader2, Save } from 'lucide-react';
import { DndContext, closestCenter, useSensor, useSensors, PointerSensor, KeyboardSensor } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { SortableContentBlockItem } from './SortableContentBlockItem';
import ContentBlockItemModal from './ContentBlockItemModal';
import { useConfirm } from '@/components/providers/ConfirmDialogProvider';
import { usePermission } from '@/hooks/usePermission';

interface ContentBlockItem {
    id: number;
    icon?: string | null;
    eyebrow?: string | null;
    title?: string | null;
    description?: string | null;
}

interface ContentBlockGroup {
    id: number;
    key: string;
    name: string;
    intro_text?: string | null;
    items: ContentBlockItem[];
}

export default function ManageContentBlockClient({ groupKey }: { groupKey: string }) {
    const router = useRouter();
    const confirm = useConfirm();
    const { can } = usePermission();
    const canEdit = can('edit_content_blocks');

    const [localItems, setLocalItems] = useState<ContentBlockItem[]>([]);
    const [introText, setIntroText] = useState('');
    const [savingIntro, setSavingIntro] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<ContentBlockItem | null>(null);

    const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

    const { data: group, isLoading, refetch } = useQuery<ContentBlockGroup>({
        queryKey: ['content-block-group', groupKey],
        queryFn: async () => {
            const { data } = await api.get(`/admin/content-blocks/${groupKey}`);
            return data;
        }
    });

    useEffect(() => {
        if (group?.items) setLocalItems(group.items);
        if (group) setIntroText(group.intro_text || '');
    }, [group]);

    const handleDragEnd = (event: any) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            setLocalItems((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over?.id);
                const newOrder = arrayMove(items, oldIndex, newIndex);
                saveOrder(newOrder);
                return newOrder;
            });
        }
    };

    const saveOrder = async (items: ContentBlockItem[]) => {
        try {
            const payload = items.map((item, index) => ({ id: item.id, order: index + 1 }));
            await api.post(`/admin/content-blocks/${groupKey}/items/reorder`, { items: payload });
            toast.success('Orden guardado');
        } catch {
            toast.error('Error al ordenar');
        }
    };

    const handleSaveIntro = async () => {
        setSavingIntro(true);
        try {
            await api.put(`/admin/content-blocks/${groupKey}`, { intro_text: introText });
            toast.success('Texto guardado');
        } catch {
            toast.error('Error al guardar');
        } finally {
            setSavingIntro(false);
        }
    };

    const handleOpenCreate = () => {
        setEditingItem(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (item: ContentBlockItem) => {
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const handleSaveItem = async (data: { icon: string; eyebrow: string; title: string; description: string }) => {
        try {
            if (editingItem?.id) {
                await api.put(`/admin/content-blocks/${groupKey}/items/${editingItem.id}`, data);
            } else {
                await api.post(`/admin/content-blocks/${groupKey}/items`, data);
            }
            toast.success('Guardado');
            setIsModalOpen(false);
            refetch();
        } catch {
            toast.error('Error al guardar el item');
        }
    };

    const handleDelete = (id: number) => {
        confirm({
            title: '¿Eliminar item?',
            message: 'Esta acción no se puede deshacer.',
            confirmText: 'Sí, Eliminar',
            variant: 'danger',
            onConfirm: async () => {
                try {
                    await api.delete(`/admin/content-blocks/${groupKey}/items/${id}`);
                    toast.success('Eliminado');
                    refetch();
                } catch {
                    toast.error('Error al eliminar');
                }
            },
        });
    };

    if (isLoading || !group) {
        return <div className="p-20 text-center"><Loader2 className="animate-spin inline" /> Cargando...</div>;
    }

    return (
        <div className="max-w-5xl mx-auto p-6 pb-20 space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="p-2 hover:bg-white rounded-full"><ArrowLeft className="w-5 h-5" /></button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">{group.name}</h1>
                        <p className="text-sm text-slate-500 font-mono">{group.key}</p>
                    </div>
                </div>
                {canEdit && (
                    <button onClick={handleOpenCreate} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center hover:bg-slate-800">
                        <Plus className="w-4 h-4 mr-2" /> Agregar item
                    </button>
                )}
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3">
                <label className="block text-sm font-bold text-slate-800">Texto introductorio (opcional)</label>
                <p className="text-xs text-slate-500">
                    Párrafo fijo que se muestra arriba de los items de esta sección (ej. el texto de &quot;Nuestra historia&quot;).
                </p>
                <textarea
                    value={introText}
                    onChange={(e) => setIntroText(e.target.value)}
                    disabled={!canEdit}
                    className="w-full border border-slate-200 rounded-lg p-3 text-sm h-28 outline-none focus:ring-2 focus:ring-black/5 disabled:bg-slate-50"
                />
                {canEdit && (
                    <div className="flex justify-end">
                        <button onClick={handleSaveIntro} disabled={savingIntro} className="px-4 py-2 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition disabled:opacity-50 flex items-center gap-2">
                            <Save className="w-4 h-4" /> {savingIntro ? 'Guardando...' : 'Guardar texto'}
                        </button>
                    </div>
                )}
            </div>

            <div className="space-y-3">
                {localItems.length === 0 ? (
                    <div className="text-center py-10 text-sm text-slate-400 border border-dashed border-slate-200 rounded-xl">
                        Sin items todavía. Agrega el primero.
                    </div>
                ) : (
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={localItems} strategy={verticalListSortingStrategy}>
                            {localItems.map((item) => (
                                <SortableContentBlockItem
                                    key={item.id}
                                    item={item}
                                    onEdit={handleOpenEdit}
                                    onDelete={handleDelete}
                                />
                            ))}
                        </SortableContext>
                    </DndContext>
                )}
            </div>

            <ContentBlockItemModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveItem}
                initialItem={editingItem}
            />
        </div>
    );
}
