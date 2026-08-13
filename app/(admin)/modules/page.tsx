'use client';

import { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import {
    Plus, Pencil, Trash2, Save, X, GripVertical,
    LayoutList, Shield, Link as LinkIcon, Search, FolderKanban
} from 'lucide-react';
import { iconMap } from '@/lib/icon-map';
import { useConfirm } from '@/components/providers/ConfirmDialogProvider';

export default function MenuManagerPage() {
    const confirm = useConfirm();
    const queryClient = useQueryClient();

    const [modules, setModules] = useState<any[]>([]);
    const [sectionsOrder, setSectionsOrder] = useState<string[]>([]);
    const [permissions, setPermissions] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [iconSearch, setIconSearch] = useState('');
    const [formData, setFormData] = useState({
        name: '', route: '', icon: 'LayoutList', section: 'Sistema', permission_name: '', is_active: true
    });


    const refreshSidebar = async () => {
        await queryClient.invalidateQueries({ queryKey: ['sidebar-menu'] });
    };

    const fetchData = async () => {
        try {
            const { data } = await api.get('/admin/modules');

            const rawModules = data.modules.sort((a: any, b: any) => a.order - b.order);
            setModules(rawModules);
            setPermissions(data.permissions);

            const distinctSections = Array.from(new Set(rawModules.map((m: any) => m.section))) as string[];

            if (data.section_order && Array.isArray(data.section_order) && data.section_order.length > 0) {
                const savedOrder = data.section_order;
                const cleanSavedOrder = savedOrder.filter((s: string) => distinctSections.includes(s));
                const newSections = distinctSections.filter(s => !cleanSavedOrder.includes(s));
                setSectionsOrder([...cleanSavedOrder, ...newSections]);
            } else {
                setSectionsOrder(distinctSections);
            }
        } catch (error) { toast.error('Error cargando menú'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const onDragEnd = async (result: DropResult) => {
        const { destination, source, type } = result;
        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        if (type === 'SECTION') {
            const newOrder = Array.from(sectionsOrder);
            const [moved] = newOrder.splice(source.index, 1);
            newOrder.splice(destination.index, 0, moved);

            setSectionsOrder(newOrder);

            try {
                await api.post('/admin/modules/reorder-sections', { sections: newOrder });
                await refreshSidebar();
            } catch (e) { toast.error('Error guardando orden de secciones'); }
            return;
        }

        if (type === 'MODULE') {
            const sourceSection = source.droppableId;
            const destSection = destination.droppableId;
            const allModules = [...modules];

            const sourceModules = allModules
                .filter(m => m.section === sourceSection)
                .sort((a, b) => a.order - b.order);

            const [movedItem] = sourceModules.splice(source.index, 1);

            if (sourceSection === destSection) {
                sourceModules.splice(destination.index, 0, movedItem);

                const otherModules = allModules.filter(m => m.section !== sourceSection);
                setModules([...otherModules, ...sourceModules]);

                const ids = sourceModules.map(m => m.id);
                try {
                    await api.post('/admin/modules/reorder', { ids });
                    await refreshSidebar();
                } catch (e) { toast.error('Error guardando orden'); fetchData(); }

            } else {
                try {
                    const updatedList = modules.map(m => {
                        if (m.id === movedItem.id) return { ...m, section: destSection };
                        return m;
                    });
                    setModules(updatedList);

                    await api.put(`/admin/modules/${movedItem.id}`, {
                        ...movedItem, section: destSection, order: destination.index
                    });

                    toast.success('Módulo movido');
                    await fetchData();
                    await refreshSidebar();
                } catch (e) { toast.error('Error al mover'); fetchData(); }
            }
        }
    };

    const handleOpenModal = (item: any = null, sectionPreselect: string = '') => {
        setEditingItem(item);
        setIconSearch('');
        if (item) {
            setFormData({
                name: item.name, route: item.route, icon: item.icon,
                section: item.section, permission_name: item.permission_name || '', is_active: Boolean(item.is_active)
            });
        } else {
            setFormData({
                name: '', route: '', icon: 'LayoutList',
                section: sectionPreselect || sectionsOrder[0] || 'Sistema',
                permission_name: '', is_active: true
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingItem) await api.put(`/admin/modules/${editingItem.id}`, formData);
            else await api.post('/admin/modules', formData);

            toast.success('Guardado correctamente');
            setIsModalOpen(false);

            await fetchData();
            await refreshSidebar();
        } catch (error) { toast.error('Error al guardar'); }
    };

    const handleDelete = (id: number) => {
        confirm({
            title: '¿Eliminar Módulo?',
            message: 'Se eliminará del menú lateral. No afecta a la base de datos de usuarios/ventas.',
            confirmText: 'Sí, Eliminar',
            variant: 'danger',
            onConfirm: async () => {
                try {
                    await api.delete(`/admin/modules/${id}`);
                    toast.success('Eliminado');
                    await fetchData();
                    await refreshSidebar();
                } catch (error) { toast.error('Error al eliminar'); }
            }
        });
    };

    const filteredIcons = Object.keys(iconMap).filter(k => k.toLowerCase().includes(iconSearch.toLowerCase()));

    if (loading) return <div className="p-20 text-center text-slate-400">Cargando gestor...</div>;

    return (
        <div className="max-w-5xl mx-auto pb-20 p-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Gestor de Menú</h1>
                    <p className="text-slate-500 text-sm">Arrastra secciones o módulos para organizar.</p>
                </div>
                <button onClick={() => handleOpenModal()} className="bg-slate-900 text-white px-4 py-2 rounded-xl flex items-center hover:bg-slate-800 text-sm font-bold shadow-lg">
                    <Plus className="w-4 h-4 mr-2" /> Nuevo Módulo
                </button>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="all-sections" type="SECTION">
                    {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-8">
                            {sectionsOrder.map((section, sectionIndex) => {
                                const sectionModules = modules.filter(m => m.section === section);

                                return (
                                    <Draggable key={section} draggableId={section} index={sectionIndex}>
                                        {(providedSection) => (
                                            <div ref={providedSection.innerRef} {...providedSection.draggableProps} className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden">
                                                <div className="bg-white px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                                                    <div className="flex items-center gap-3">
                                                        <div {...providedSection.dragHandleProps} className="cursor-grab active:cursor-grabbing p-1 text-slate-400 hover:text-slate-600">
                                                            <GripVertical className="w-5 h-5" />
                                                        </div>
                                                        <h3 className="font-bold text-slate-800 uppercase tracking-wider text-xs flex items-center gap-2">
                                                            <FolderKanban className="w-4 h-4 text-blue-500" /> {section}
                                                        </h3>
                                                        <span className="bg-slate-100 text-slate-500 text-[10px] px-2 py-0.5 rounded-full font-bold">{sectionModules.length}</span>
                                                    </div>
                                                    <button onClick={() => handleOpenModal(null, section)} className="text-xs text-blue-600 font-bold hover:underline flex items-center">
                                                        <Plus className="w-3 h-3 mr-1" /> Agregar aquí
                                                    </button>
                                                </div>

                                                <Droppable droppableId={section} type="MODULE">
                                                    {(providedModule) => (
                                                        <div {...providedModule.droppableProps} ref={providedModule.innerRef} className="p-3 space-y-2 min-h-[60px]">
                                                            {sectionModules.length > 0 ? sectionModules.map((item, index) => {
                                                                const ItemIcon = iconMap[item.icon] || LayoutList;
                                                                return (
                                                                    <Draggable key={item.id} draggableId={item.id.toString()} index={index}>
                                                                        {(providedItem, snapshot) => (
                                                                            <div ref={providedItem.innerRef} {...providedItem.draggableProps} className={`bg-white p-3 rounded-xl border flex items-center gap-3 transition-all ${snapshot.isDragging ? 'shadow-xl ring-2 ring-blue-500 border-transparent z-50' : 'border-slate-200 hover:border-blue-300'}`}>
                                                                                <div {...providedItem.dragHandleProps} className="text-slate-300 hover:text-slate-600 cursor-grab active:cursor-grabbing"><GripVertical className="w-4 h-4" /></div>
                                                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${item.is_active ? 'bg-slate-50 text-slate-600' : 'bg-red-50 text-red-400'}`}><ItemIcon className="w-4 h-4" /></div>
                                                                                <div className="flex-1 min-w-0">
                                                                                    <div className="font-bold text-sm text-slate-800">{item.name}</div>
                                                                                    <div className="text-[10px] text-slate-400 font-mono">{item.route}</div>
                                                                                </div>
                                                                                <div className="flex gap-1">
                                                                                    <button onClick={() => handleOpenModal(item)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"><Pencil className="w-4 h-4" /></button>
                                                                                    <button onClick={() => handleDelete(item.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </Draggable>
                                                                );
                                                            }) : <div className="text-center py-4 text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">Sección vacía</div>}
                                                            {providedModule.placeholder}
                                                        </div>
                                                    )}
                                                </Droppable>
                                            </div>
                                        )}
                                    </Draggable>
                                );
                            })}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>

            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
                            <h3 className="font-bold text-lg text-slate-900">{editingItem ? 'Editar Módulo' : 'Nuevo Módulo'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full"><X className="w-5 h-5 text-slate-400" /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nombre</label>
                                    <input required type="text" className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-900" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Sección</label>
                                    <div className="relative">
                                        <input required type="text" list="sections" className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-900" value={formData.section} onChange={e => setFormData({ ...formData, section: e.target.value })} />
                                        <datalist id="sections"><option value="CMS" /><option value="Sistema" /><option value="Ventas" /><option value="Reportes" /></datalist>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 flex items-center"><LinkIcon className="w-3 h-3 mr-1" /> Ruta</label>
                                <input required type="text" className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm font-mono bg-slate-50" value={formData.route} onChange={e => setFormData({ ...formData, route: e.target.value })} />
                            </div>
                            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-3">Icono</label>
                                <div className="relative mb-3">
                                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                    <input type="text" placeholder="Buscar..." className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm bg-white" value={iconSearch} onChange={e => setIconSearch(e.target.value)} />
                                </div>
                                <div className="grid grid-cols-8 gap-2 h-32 overflow-y-auto custom-scrollbar pr-1">
                                    {filteredIcons.map((iconKey) => {
                                        const IconComp = iconMap[iconKey];
                                        return <button key={iconKey} type="button" onClick={() => setFormData({ ...formData, icon: iconKey })} className={`flex items-center justify-center p-2 rounded-lg border transition ${formData.icon === iconKey ? 'border-slate-900 bg-white ring-2 ring-slate-100' : 'border-transparent hover:bg-white'}`}><IconComp className="w-5 h-5 text-slate-600" /></button>
                                    })}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Permiso</label>
                                    <select className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-white" value={formData.permission_name} onChange={e => setFormData({ ...formData, permission_name: e.target.value })}>
                                        <option value="">Ninguno</option>
                                        {permissions.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                                <div className="flex items-center pt-6">
                                    <label className="flex items-center cursor-pointer">
                                        <input type="checkbox" className="w-5 h-5 accent-slate-900" checked={formData.is_active} onChange={e => setFormData({ ...formData, is_active: e.target.checked })} />
                                        <span className="ml-3 text-sm font-bold text-slate-700">Activo</span>
                                    </label>
                                </div>
                            </div>
                        </form>
                        <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50 rounded-b-2xl">
                            <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-slate-600 hover:bg-slate-200 rounded-xl text-sm font-bold">Cancelar</button>
                            <button onClick={handleSubmit} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 text-sm font-bold flex items-center shadow-lg"><Save className="w-4 h-4 mr-2" /> Guardar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}