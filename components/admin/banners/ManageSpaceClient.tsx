'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Loader2, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import AttachBannerModal from './AttachBannerModal';
import ScheduleModal from './ScheduleModal';
import { DndContext, closestCenter, useSensor, useSensors, PointerSensor, KeyboardSensor } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { SortableBannerItem } from './SortableBannerItem';
import { useConfirm } from '@/components/providers/ConfirmDialogProvider';

export default function ManageSpaceClient({ groupKey }: { groupKey: string }) {
    const router = useRouter();
    const confirm = useConfirm();

    const [isAttachModalOpen, setIsAttachModalOpen] = useState(false);
    const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
    const [selectedBannerForSchedule, setSelectedBannerForSchedule] = useState<any>(null);

    const [localBanners, setLocalBanners] = useState<any[]>([]);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

    const { data: group, isLoading, refetch } = useQuery({
        queryKey: ['banner-group', groupKey],
        queryFn: async () => {
            const { data } = await api.get(`/admin/banner-groups/${groupKey}`);
            return data;
        }
    });

    useEffect(() => {
        if (group?.banners) setLocalBanners(group.banners);
    }, [group]);

    const handleDragEnd = (event: any) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            setLocalBanners((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over?.id);
                const newOrder = arrayMove(items, oldIndex, newIndex);
                saveOrder(newOrder);
                return newOrder;
            });
        }
    };

    const saveOrder = async (items: any[]) => {
        try {
            const payload = items.map((item, index) => ({ id: item.id, order: index + 1 }));
            await api.post(`/admin/banner-groups/${groupKey}/reorder`, { items: payload });
            toast.success('Orden guardado');
        } catch { toast.error('Error al ordenar'); }
    };

    const handleOpenSchedule = (banner: any) => {
        setSelectedBannerForSchedule(banner);
        setScheduleModalOpen(true);
    };

    const performDetach = async (ids: number[]) => {
        try {
            await api.post(`/admin/banner-groups/${groupKey}/detach`, { banner_ids: ids });
            toast.success('Banners quitados');
            refetch();
            setSelectedIds([]);
        } catch { toast.error('Error al quitar'); }
    };

    const handleDetachOne = (id: number) => confirm({ title: '¿Quitar banner?', message: '¿Estás seguro de que deseas quitar este banner?', variant: 'danger', onConfirm: () => performDetach([id]) });
    const handleBulkDetach = () => confirm({ title: '¿Quitar seleccionados?', message: '¿Estás seguro de que deseas quitar los banners seleccionados?', variant: 'danger', onConfirm: () => performDetach(selectedIds) });
    const toggleSelect = (id: number) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

    if (isLoading) return <div className="p-20 text-center"><Loader2 className="animate-spin inline" /> Cargando...</div>;

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="p-2 hover:bg-white rounded-full"><ArrowLeft className="w-5 h-5" /></button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">{group.name}</h1>
                        <p className="text-sm text-slate-500">Capacidad: {group.banners.length} / {group.max_items}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {selectedIds.length > 0 && (
                        <button onClick={handleBulkDetach} className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-sm font-bold flex items-center hover:bg-red-100">
                            <Trash2 className="w-4 h-4 mr-2" /> Quitar ({selectedIds.length})
                        </button>
                    )}
                    <button onClick={() => setIsAttachModalOpen(true)} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center hover:bg-slate-800">
                        <Plus className="w-4 h-4 mr-2" /> Agregar
                    </button>
                </div>
            </div>

            <div className="space-y-3">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={localBanners} strategy={verticalListSortingStrategy}>
                        {localBanners.map(banner => (
                            <SortableBannerItem
                                key={banner.id}
                                banner={banner}
                                onDetach={handleDetachOne}
                                isSelected={selectedIds.includes(banner.id)}
                                onToggleSelect={toggleSelect}
                                onSchedule={handleOpenSchedule}
                            />
                        ))}
                    </SortableContext>
                </DndContext>
            </div>

            <AttachBannerModal
                isOpen={isAttachModalOpen}
                onClose={() => setIsAttachModalOpen(false)}
                groupKey={groupKey}
                existingBannerIds={group.banners.map((b: any) => b.id)}
                onSuccess={refetch}
                maxItems={group.max_items}
            />

            {selectedBannerForSchedule && (
                <ScheduleModal
                    isOpen={scheduleModalOpen}
                    onClose={() => setScheduleModalOpen(false)}
                    groupKey={groupKey}
                    banner={selectedBannerForSchedule}
                    onSuccess={refetch}
                />
            )}
        </div>
    );
}