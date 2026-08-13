'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Link from 'next/link';
import {
    Store as StoreIcon,
    MapPin,
    Edit,
    Trash2,
    ShoppingBag,
    Mail,
    GripVertical,
} from 'lucide-react';

type StoreCard = {
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

interface Props {
    store: StoreCard;
    priorityRank: number;
    onDelete: (id: number) => void;
}

export function SortableStoreCard({ store, priorityRank, onDelete }: Props) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: store.id,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        opacity: isDragging ? 0.55 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
        >
            <div
                className={`absolute top-4 right-4 w-3 h-3 rounded-full ${
                    store.is_active ? 'bg-green-500' : 'bg-gray-300'
                }`}
            />

            <div className="absolute top-4 left-4 flex items-center gap-2">
                <button
                    type="button"
                    className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 cursor-grab active:cursor-grabbing hover:bg-slate-100"
                    aria-label="Arrastrar para cambiar prioridad"
                    {...attributes}
                    {...listeners}
                >
                    <GripVertical className="w-4 h-4" />
                </button>
                <span className="inline-flex items-center justify-center min-w-8 h-7 px-2 rounded-full bg-slate-900 text-white text-xs font-bold">
                    #{priorityRank}
                </span>
            </div>

            <div className="space-y-5 mb-4 mt-8">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 text-slate-700 shrink-0">
                        <StoreIcon className="w-6 h-6" />
                    </div>

                    <div>
                        <h3 className="font-bold text-slate-900">{store.name}</h3>
                        {store.alias ? (
                            <p className="text-xs text-slate-500 mt-0.5">{store.alias}</p>
                        ) : null}
                        <p className="text-xs font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded w-fit mt-1">
                            {store.code}
                        </p>
                    </div>
                </div>
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-100 bg-slate-50 shrink-0">
                        {store.image ? (
                            <img
                                src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/storage/${store.image}`}
                                alt={store.name}
                                className="w-12 h-12 object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                                <StoreIcon className="w-6 h-6" />
                            </div>
                        )}
                    </div>

                    <div className="space-y-2 text-sm text-slate-600">
                        <div className="flex items-start">
                            <MapPin className="w-4 h-4 mr-2 mt-0.5 text-slate-400 shrink-0" />
                            <span>
                                {store.address}, {store.city}
                            </span>
                        </div>
                        <div className="flex items-center">
                            <Mail className="w-4 h-4 mr-2 text-slate-400 shrink-0" />
                            <span className="truncate">{store.email}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex gap-2 mb-6">
                {store.is_pickup_enabled ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold uppercase border border-blue-100">
                        <ShoppingBag className="w-3 h-3 mr-1" /> Retiro en Tienda
                    </span>
                ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-50 text-slate-500 text-[10px] font-bold uppercase border border-slate-100">
                        No permite retiro
                    </span>
                )}
                <span className="inline-flex items-center px-2 py-1 rounded-md bg-amber-50 text-amber-800 text-[10px] font-bold uppercase border border-amber-100">
                    Despacho de prioridad # {priorityRank}
                </span>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-50 opacity-0 group-hover:opacity-100 transition-opacity">
                <Link
                    href={`stores/${store.id}`}
                    className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-blue-600 transition"
                >
                    <Edit className="w-4 h-4" />
                </Link>
                <button
                    type="button"
                    onClick={() => onDelete(store.id)}
                    className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
