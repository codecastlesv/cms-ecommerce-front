import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Pencil, Trash2 } from 'lucide-react';
import { iconMap } from '@/lib/icon-map';

interface ContentBlockItem {
    id: number;
    icon?: string | null;
    eyebrow?: string | null;
    title?: string | null;
    description?: string | null;
    is_active?: boolean;
}

interface Props {
    item: ContentBlockItem;
    onEdit: (item: ContentBlockItem) => void;
    onDelete: (id: number) => void;
}

export function SortableContentBlockItem({ item, onEdit, onDelete }: Props) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        opacity: isDragging ? 0.5 : 1,
    };

    const Icon = (item.icon && iconMap[item.icon]) || null;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`bg-white border rounded-xl p-4 flex items-center gap-4 transition group select-none relative border-slate-200 ${isDragging ? 'shadow-xl z-50' : ''}`}
        >
            <div className="cursor-grab text-slate-300 hover:text-slate-600 p-1" {...attributes} {...listeners}>
                <GripVertical className="w-5 h-5" />
            </div>

            <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 text-slate-600">
                {Icon ? <Icon className="w-5 h-5" /> : <span className="text-[10px] text-slate-300">—</span>}
            </div>

            <div className="flex-1 min-w-0">
                <h4 className="font-bold text-slate-800 text-sm truncate">
                    {item.eyebrow ? <span className="text-slate-400 font-normal mr-1.5">{item.eyebrow}</span> : null}
                    {item.title || <span className="italic text-slate-300">Sin título</span>}
                </h4>
                {item.description ? (
                    <p className="text-xs text-slate-500 truncate mt-0.5">{item.description}</p>
                ) : null}
            </div>

            <div className="flex items-center gap-1">
                <button onClick={() => onEdit(item)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Editar">
                    <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => onDelete(item.id)} className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Eliminar">
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
