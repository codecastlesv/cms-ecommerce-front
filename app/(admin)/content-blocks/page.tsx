'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { LayoutList, ArrowRight, AlertCircle } from 'lucide-react';
import PermissionGate from '@/components/auth/PermissionGate';

interface ContentBlockGroup {
    id: number;
    name: string;
    key: string;
    page: string;
    items_count: number;
}

const PAGE_LABELS: Record<string, string> = {
    home: 'Home',
    about: 'Nosotros',
    marcas: 'Marcas',
};

function pageLabel(page: string): string {
    return PAGE_LABELS[page] || page.charAt(0).toUpperCase() + page.slice(1);
}

function groupByPage(groups: ContentBlockGroup[]): [string, ContentBlockGroup[]][] {
    const map = new Map<string, ContentBlockGroup[]>();
    for (const group of groups) {
        const list = map.get(group.page) || [];
        list.push(group);
        map.set(group.page, list);
    }
    return Array.from(map.entries()).sort((a, b) => pageLabel(a[0]).localeCompare(pageLabel(b[0])));
}

export default function ContentBlocksPage() {
    const { data: groups, isLoading, isError } = useQuery<ContentBlockGroup[]>({
        queryKey: ['content-block-groups'],
        queryFn: async () => {
            const { data } = await api.get('/admin/content-blocks');
            return data;
        }
    });

    return (
        <PermissionGate permission="view_content_blocks">
            <div className="max-w-7xl mx-auto p-6 pb-20 space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Bloques de Contenido</h1>
                    <p className="text-sm text-slate-500">
                        Secciones de icono + texto repetible (ej. valores, trayectoria, historia) reutilizables en cualquier página.
                    </p>
                </div>

                {isLoading ? (
                    <div className="p-20 text-center text-slate-400">Cargando bloques...</div>
                ) : isError ? (
                    <div className="p-10 text-center text-red-500 bg-red-50 rounded-xl border border-red-100">
                        <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        Error al cargar los bloques.
                    </div>
                ) : (
                    <div className="space-y-10">
                        {groupByPage(groups || []).map(([page, pageGroups]) => (
                            <div key={page}>
                                <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500 mb-4">
                                    {pageLabel(page)}
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {pageGroups.map((group) => (
                                        <Link key={group.id} href={`/content-blocks/${group.key}`} className="group block h-full">
                                            <div className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg transition-all h-full flex flex-col justify-between cursor-pointer group-hover:border-slate-900 group-hover:ring-1 group-hover:ring-slate-900 relative overflow-hidden">
                                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 pointer-events-none">
                                                    <LayoutList className="w-24 h-24" />
                                                </div>

                                                <div className="relative z-10">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <span className="p-2.5 bg-slate-100 rounded-xl text-slate-600 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                                                            <LayoutList className="w-5 h-5" />
                                                        </span>
                                                        <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-md border bg-slate-50 text-slate-600 border-slate-100">
                                                            {group.page}
                                                        </span>
                                                    </div>
                                                    <h3 className="font-bold text-slate-900 mb-1">{group.name}</h3>
                                                    <p className="text-xs text-slate-400 font-mono">{group.key}</p>
                                                </div>

                                                <div className="relative z-10 flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
                                                    <span className="text-sm text-slate-500">{group.items_count} item(s)</span>
                                                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </PermissionGate>
    );
}
