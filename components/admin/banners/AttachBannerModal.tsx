'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { X, Search, Plus, Loader2, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    groupKey: string;
    existingBannerIds: number[];
    onSuccess: () => void;
    maxItems: number;
}

export default function AttachBannerModal({ isOpen, onClose, groupKey, existingBannerIds, onSuccess, maxItems }: Props) {
    const [searchTerm, setSearchTerm] = useState('');
    const [attachingId, setAttachingId] = useState<number | null>(null);

    const isFull = existingBannerIds.length >= maxItems;

    const { data: banners, isLoading } = useQuery({
        queryKey: ['banners'],
        queryFn: async () => {
            const { data } = await api.get('/admin/banners');
            return data.data;
        },
        enabled: isOpen
    });

    const handleAttach = async (bannerId: number) => {
        setAttachingId(bannerId);
        try {
            await api.post(`/admin/banner-groups/${groupKey}/attach`, { banner_id: bannerId });
            toast.success('Agregado');
            onSuccess();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error');
        } finally {
            setAttachingId(null);
        }
    };

    if (!isOpen) return null;

    const availableBanners = banners?.filter((b: any) =>
        !existingBannerIds.includes(b.id) &&
        b.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[85vh]">

                <div className="p-4 border-b flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold text-slate-800">Agregar Banner</h3>
                        {isFull && <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded font-bold">Espacio Lleno ({maxItems})</span>}
                    </div>
                    <button onClick={onClose}><X className="w-5 h-5 text-slate-500" /></button>
                </div>

                <div className="p-4 bg-slate-50 border-b">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input type="text" placeholder="Buscar..." className="w-full pl-9 pr-4 py-2 text-sm border rounded-xl"
                            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                </div>

                <div className="overflow-y-auto p-6 flex-1">
                    {isLoading ? <div className="text-center"><Loader2 className="animate-spin inline" /></div> : (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {availableBanners?.map((banner: any) => (
                                <div key={banner.id} className="group relative bg-white border rounded-xl overflow-hidden hover:shadow-md">
                                    <div className="aspect-video bg-slate-100 relative">
                                        <img src={banner.images.desktop} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-all">
                                            <button
                                                onClick={() => handleAttach(banner.id)}
                                                disabled={attachingId === banner.id || isFull}
                                                className="bg-white text-slate-900 px-4 py-2 rounded-lg font-bold text-sm shadow-lg opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isFull ? 'Lleno' : (attachingId === banner.id ? '...' : 'Agregar')}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="p-3">
                                        <p className="font-bold text-sm truncate">{banner.title}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}