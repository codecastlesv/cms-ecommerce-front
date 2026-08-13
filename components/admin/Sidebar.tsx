'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/axios';
import { iconMap } from '@/lib/icon-map';
import { LogOut, CircleHelp, Loader2, AlertTriangle } from 'lucide-react';
import { useConfirm } from '@/components/providers/ConfirmDialogProvider';
import { useQuery } from '@tanstack/react-query';
import { IconName } from '@/types';

interface MenuItem {
    id: number;
    name: string;
    route: string;
    icon: string;
    section: string;
}

type GroupedMenu = Record<string, MenuItem[]>;

interface SettingsData {
    full_logo_url?: string;
    site_name?: string;
}

export default function Sidebar() {
    const pathname = usePathname();
    const { logout, user } = useAuth();
    const confirm = useConfirm();

    const { data: menuGroups, isLoading: loadingMenu, isError: errorMenu } = useQuery<GroupedMenu>({
        queryKey: ['sidebar-menu'],
        queryFn: async () => {
            const { data } = await api.get<GroupedMenu>('/admin/menu');
            return data;
        },
        staleTime: 1000 * 60 * 60,
        retry: 1,
    });

    const { data: settings } = useQuery<SettingsData>({
        queryKey: ['global-settings'],
        queryFn: async () => {
            const { data } = await api.get<SettingsData>('/admin/settings');
            return data;
        },
        staleTime: 1000 * 60 * 60,
    });

    const handleLogout = () => {
        confirm({
            title: 'Cerrar Sesión',
            message: '¿Estás seguro que deseas salir del sistema?',
            confirmText: 'Sí, Salir',
            variant: 'danger',
            onConfirm: async () => await logout()
        });
    };

    if (!user) return null;
    const logoUrl = settings?.full_logo_url;

    return (
        <aside className="w-64 bg-black text-white flex flex-col h-screen fixed left-0 top-0 shadow-xl z-50 overflow-hidden border-r border-slate-900 transition-all duration-300">

            <div className="p-6 border-b border-slate-800 flex items-center space-x-3 shrink-0 h-[88px]">
                {logoUrl ? (
                    <div className="w-10 h-10 relative flex-shrink-0">
                        <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                    </div>
                ) : (
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center font-bold shadow-lg shadow-blue-900/50 flex-shrink-0">G</div>
                )}
                <span className="text-lg font-bold tracking-wide truncate">Galaxia CMS</span>
            </div>

            <div className="p-6 pb-2 shrink-0">
                <div className="flex items-center space-x-3 mb-4 p-2 rounded-xl hover:bg-slate-900/50 transition duration-300 border border-transparent hover:border-slate-800">
                    <div className="shrink-0 relative">
                        {user.image_url || user.avatar ? (
                            <img
                                src={user.image_url || user.avatar}
                                alt={user.name}
                                className="w-10 h-10 rounded-full object-cover border border-slate-700 shadow-sm"
                            />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 text-slate-300">
                                <span className="font-bold text-lg">{user.name?.charAt(0).toUpperCase()}</span>
                            </div>
                        )}
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-black rounded-full"></div>
                    </div>
                    <div className="overflow-hidden">
                        <div className="font-medium truncate text-sm text-slate-200">{user.name}</div>
                        <div className="text-xs text-slate-500 truncate capitalize">{user.role}</div>
                    </div>
                </div>
            </div>

            <nav className="flex-1 px-4 py-2 overflow-y-auto custom-scrollbar space-y-6">
                {loadingMenu && (
                    <div className="flex flex-col items-center justify-center py-10 space-y-3 opacity-50">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                        <span className="text-xs text-slate-500">Cargando menú...</span>
                    </div>
                )}

                {errorMenu && (
                    <div className="px-4 py-4 text-xs text-red-400 bg-red-950/20 rounded-xl border border-red-900/50 text-center">
                        <AlertTriangle className="w-4 h-4 mx-auto mb-2 opacity-50" /> Error cargando módulos
                    </div>
                )}

                {!loadingMenu && menuGroups && Object.entries(menuGroups).map(([sectionName, items]) => (
                    <div key={sectionName} className="animate-in fade-in duration-500">
                        <h3 className="px-4 text-[10px] font-extrabold text-slate-600 uppercase tracking-widest mb-3 select-none">
                            {sectionName}
                        </h3>
                        <div className="space-y-1">
                            {items.map((item) => {
                                const IconComponent = iconMap[item.icon as IconName] || CircleHelp;
                                const isActive = pathname.startsWith(item.route);

                                return (
                                    <Link
                                        key={item.id}
                                        href={item.route}
                                        className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 group relative ${isActive
                                            ? 'bg-slate-800 text-white shadow-md shadow-slate-900/20'
                                            : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                                            }`}
                                    >
                                        <IconComponent className={`w-4 h-4 mr-3 transition-colors ${isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                                        {item.name}
                                        {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-500 rounded-r-full"></div>}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            <div className="p-4 border-t border-slate-900 shrink-0 bg-black">
                <button onClick={handleLogout} className="flex w-full items-center justify-center px-4 py-3 text-sm font-bold text-red-400 hover:bg-red-950/20 hover:text-red-300 rounded-xl transition-all duration-200 group">
                    <LogOut className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Cerrar Sesión
                </button>
            </div>
        </aside>
    );
}