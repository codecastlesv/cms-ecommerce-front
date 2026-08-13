'use client';

import { useState } from 'react';
import Link from 'next/link';
import { LayoutDashboard, Images, Plus } from 'lucide-react';
import PermissionGate from '@/components/auth/PermissionGate';
import Can from '@/components/auth/Can';
import BannerList from '@/components/admin/banners/BannerList';
import BannerGroupsList from '@/components/admin/banners/BannerGroupsList';

export default function BannersPage() {
    const [activeTab, setActiveTab] = useState<'spaces' | 'library'>('spaces');

    return (
        <PermissionGate permission="view_banners">
            <div className="max-w-7xl mx-auto p-6 pb-20 space-y-6">

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Gestión de Publicidad</h1>
                        <p className="text-sm text-slate-500">Administra los sliders y banners promocionales de la tienda.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="bg-slate-100 p-1 rounded-xl inline-flex">
                            <button
                                onClick={() => setActiveTab('spaces')}
                                className={`flex items-center px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'spaces' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <LayoutDashboard className="w-4 h-4 mr-2" /> Espacios
                            </button>
                            <button
                                onClick={() => setActiveTab('library')}
                                className={`flex items-center px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'library' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <Images className="w-4 h-4 mr-2" /> Biblioteca
                            </button>
                        </div>

                        <Can permission="create_banners">
                            <Link href="/banners/create" className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center hover:bg-slate-800 shadow-lg transition ml-2">
                                <Plus className="w-4 h-4 mr-2" /> Crear Banner
                            </Link>
                        </Can>
                    </div>
                </div>

                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {activeTab === 'spaces' ? (
                        <BannerGroupsList />
                    ) : (
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-1">
                            <div className="p-4">
                                <h3 className="font-bold text-slate-800 mb-4 px-2">Biblioteca Global de Imágenes</h3>
                                <BannerList embedded={true} />
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </PermissionGate>
    );
}