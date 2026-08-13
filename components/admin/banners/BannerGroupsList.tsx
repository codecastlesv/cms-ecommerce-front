'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Layers, Monitor, LayoutGrid, ArrowRight, AlertCircle } from 'lucide-react';

interface BannerGroup {
    id: number;
    name: string;
    key: string;
    page: string;
    layout_type: string;
    banners_count: number;
    max_items: number;
}

export default function BannerGroupsList() {

    const { data: groups, isLoading, isError } = useQuery<BannerGroup[]>({
        queryKey: ['banner-groups'],
        queryFn: async () => {
            const { data } = await api.get('/admin/banner-groups');
            return data;
        }
    });

    if (isLoading) return <div className="p-20 text-center text-slate-400">Cargando espacios publicitarios...</div>;

    if (isError) return (
        <div className="p-10 text-center text-red-500 bg-red-50 rounded-xl border border-red-100">
            <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
            Error al cargar los grupos.
        </div>
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups?.map((group) => (
                <Link key={group.id} href={`/banners/spaces/${group.key}`} className="group block h-full">
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg transition-all h-full flex flex-col justify-between cursor-pointer group-hover:border-slate-900 group-hover:ring-1 group-hover:ring-slate-900 relative overflow-hidden">

                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 pointer-events-none">
                            {group.layout_type === 'slider' && <Layers className="w-24 h-24" />}
                            {group.layout_type === 'grid' && <LayoutGrid className="w-24 h-24" />}
                            {group.layout_type === 'single' && <Monitor className="w-24 h-24" />}
                        </div>

                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <span className="p-2.5 bg-slate-100 rounded-xl text-slate-600 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                                    {group.layout_type === 'slider' && <Layers className="w-5 h-5" />}
                                    {group.layout_type === 'grid' && <LayoutGrid className="w-5 h-5" />}
                                    {group.layout_type === 'single' && <Monitor className="w-5 h-5" />}
                                </span>
                                <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-md border ${group.page === 'home' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-slate-50 text-slate-600 border-slate-100'}`}>
                                    {group.page}
                                </span>
                            </div>

                            <h3 className="text-lg font-bold text-slate-800 mb-1 group-hover:text-slate-900">
                                {group.name}
                            </h3>
                            <p className="text-xs text-slate-400 font-mono mb-4">
                                key: {group.key}
                            </p>
                        </div>

                        <div className="relative z-10 flex items-center justify-between pt-4 border-t border-slate-100 text-sm">
                            <div className="flex items-center gap-2">
                                <span className={`font-bold ${group.banners_count > 0 ? 'text-slate-700' : 'text-slate-400'}`}>
                                    {group.banners_count}
                                </span>
                                <span className="text-slate-400 text-xs">/ {group.max_items} banners</span>
                            </div>

                            <span className="flex items-center text-slate-900 font-bold text-xs opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                                Gestionar <ArrowRight className="w-3 h-3 ml-1" />
                            </span>
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    );
}