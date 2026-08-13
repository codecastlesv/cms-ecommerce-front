import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, CalendarClock } from 'lucide-react';

interface Props {
    banner: any;
    onDetach: (id: number) => void;
    isSelected: boolean;
    onToggleSelect: (id: number) => void;
    onSchedule: (banner: any) => void;
}

export function SortableBannerItem({ banner, onDetach, isSelected, onToggleSelect, onSchedule }: Props) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: banner.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        opacity: isDragging ? 0.5 : 1,
    };

    const getImageUrl = () => {
        if (banner.images?.desktop) return banner.images.desktop;
        if (banner.image_desktop_url) {
            if (banner.image_desktop_url.startsWith('http')) return banner.image_desktop_url;
            return `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/storage/${banner.image_desktop_url}`;
        }
        return null;
    };

    const formatDate24h = (dateStr: string) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleString('es-ES', {
            day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false
        });
    };

    const now = new Date();
    const start = banner.pivot?.start_at ? new Date(banner.pivot.start_at) : null;
    const end = banner.pivot?.end_at ? new Date(banner.pivot.end_at) : null;
    const isScheduled = !!(start || end);

    let statusBadge = null;
    let borderClass = 'border-slate-200';

    if (isScheduled) {
        if (start && now < start) {
            statusBadge = <span className="bg-yellow-100 text-yellow-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-yellow-200">Programado</span>;
            borderClass = 'border-yellow-200 bg-yellow-50/10';
        } else if (end && now > end) {
            statusBadge = <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-200">Expirado</span>;
            borderClass = 'border-red-200 bg-red-50/10';
        } else {
            statusBadge = <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-200 animate-pulse">En vivo (Temp)</span>;
            borderClass = 'border-green-300 bg-green-50/20 shadow-sm';
        }
    } else {
        if (banner.pivot?.is_active) {
            statusBadge = <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-100">Siempre Visible</span>;
        } else {
            statusBadge = <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-0.5 rounded-full border border-gray-200">Oculto</span>;
        }
    }

    return (
        <div ref={setNodeRef} style={style} className={`bg-white border rounded-xl p-4 flex items-center gap-4 transition group select-none relative ${isSelected ? 'border-blue-500 bg-blue-50/30' : borderClass} ${isDragging ? 'shadow-xl z-50' : ''}`}>

            <div className="flex items-center">
                <input type="checkbox" checked={isSelected} onChange={() => onToggleSelect(banner.id)} className="w-5 h-5 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer" />
            </div>

            <div className="cursor-grab text-slate-300 hover:text-slate-600 p-1" {...attributes} {...listeners}>
                <GripVertical className="w-5 h-5" />
            </div>

            <div className="w-24 h-14 bg-slate-100 rounded overflow-hidden border border-slate-100 shrink-0">
                <img src={getImageUrl() || ''} alt={banner.title} className="w-full h-full object-cover" onError={(e: any) => e.target.style.display = 'none'} />
            </div>

            <div className="flex-1 min-w-0">
                <h4 className="font-bold text-slate-800 text-sm truncate">{banner.title}</h4>
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    {statusBadge}
                    {isScheduled && (
                        <span className="text-[10px] text-slate-500 font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 flex items-center gap-1">
                            <CalendarClock className="w-3 h-3 text-slate-400" />
                            {start ? formatDate24h(banner.pivot.start_at) : 'Inicio'}
                            <span className="text-slate-300">➜</span>
                            {end ? formatDate24h(banner.pivot.end_at) : '∞'}
                        </span>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-1">
                <button onClick={() => onSchedule(banner)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Programar">
                    <CalendarClock className="w-4 h-4" />
                </button>
                <button onClick={() => onDetach(banner.id)} className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}