'use client';

import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/axios';
import { useQuery } from '@tanstack/react-query';
import PermissionGate from '@/components/auth/PermissionGate';
import {
    Users, ShoppingBag, DollarSign, TrendingUp,
    Activity, AlertCircle, ShieldCheck, Calendar, BarChart3
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

interface DashboardStats {
    total_users: number;
    active_products: number;
    low_stock: number;
    recent_activity: Array<{ user: string; action: string; time: string }>;
    total_revenue?: number;
    monthly_sales?: number;
    sales_chart?: Array<{ name: string; ingresos: number; ventas: number }>;
}

export default function DashboardPage() {
    const { user } = useAuth();

    const { data: stats, isLoading, isError } = useQuery<DashboardStats>({
        queryKey: ['dashboard-stats'],
        queryFn: async () => {
            const { data } = await api.get('/admin/dashboard/stats');
            return data;
        },
        staleTime: 1000 * 60 * 5,
    });

    if (isLoading) return <DashboardSkeleton />;

    if (isError || !stats) {
        return (
            <div className="p-10 text-center text-red-500 bg-red-50 rounded-xl border border-red-100 m-6">
                <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
                Error al cargar estadísticas. Verifica tu conexión.
            </div>
        );
    }

    const isAdmin = user?.role === 'Admin';
    const hasFinancials = stats.total_revenue !== undefined;

    return (
        <PermissionGate permission="view_dashboard">
            <div className="space-y-6 pb-20">

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                            Hola, {user?.name?.split(' ')[0]}
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">
                            Aquí tienes lo que está pasando hoy en tu sistema.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm flex items-center gap-2 text-xs font-bold text-slate-600">
                            {isAdmin ? <ShieldCheck className="w-3.5 h-3.5 text-purple-600" /> : <Users className="w-3.5 h-3.5 text-blue-500" />}
                            {user?.role}
                        </div>
                        <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm flex items-center gap-2 text-xs font-bold text-slate-500">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date().toLocaleDateString('es-ES', { month: 'long', day: 'numeric' })}
                        </div>
                    </div>
                </div>

                <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${hasFinancials ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
                    <StatsCard
                        title="Usuarios Totales"
                        value={stats.total_users}
                        icon={Users}
                        color="blue"
                    />
                    <StatsCard
                        title="Productos Activos"
                        value={stats.active_products}
                        icon={ShoppingBag}
                        color="indigo"
                    />
                    <StatsCard
                        title="Alerta de Stock"
                        value={stats.low_stock}
                        icon={AlertCircle}
                        color="orange"
                        alert={stats.low_stock > 0}
                        subtext={stats.low_stock > 0 ? "Requiere atención" : "Inventario saludable"}
                    />

                    {hasFinancials && (
                        <StatsCard
                            title="Ingresos Totales"
                            value={`$${stats.total_revenue?.toLocaleString()}`}
                            icon={DollarSign}
                            color="emerald"
                            trend={stats.monthly_sales ? `+${stats.monthly_sales} ventas este mes` : undefined}
                        />
                    )}
                </div>

                <div className={`grid grid-cols-1 gap-6 ${hasFinancials ? 'lg:grid-cols-3' : 'lg:grid-cols-1'}`}>

                    {hasFinancials && stats.sales_chart && (
                        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5 text-slate-400" />
                                    Rendimiento de Ventas
                                </h3>
                            </div>

                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={stats.sales_chart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10B981" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} stroke="#94a3b8" dy={10} />
                                        <YAxis fontSize={12} tickLine={false} axisLine={false} stroke="#94a3b8" />
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            itemStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#334155' }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="ingresos"
                                            stroke="#10B981"
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#colorIngresos)"
                                            name="Ingresos"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                        <h3 className="font-bold text-slate-800 text-lg mb-6 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-slate-400" /> Actividad Reciente
                        </h3>

                        <div className="space-y-6 relative flex-1">
                            <div className="absolute left-[15px] top-2 bottom-2 w-[2px] bg-slate-100 z-0"></div>

                            {stats.recent_activity?.length > 0 ? (
                                stats.recent_activity.map((act, i) => (
                                    <div key={i} className="flex gap-4 relative z-10 group">
                                        <div className="w-8 h-8 rounded-full bg-white border-2 border-slate-100 group-hover:border-slate-900 group-hover:bg-slate-900 group-hover:text-white flex items-center justify-center shrink-0 transition-all text-xs font-bold text-slate-500">
                                            {act.user.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="pb-1">
                                            <p className="text-sm text-slate-700 font-medium leading-tight mb-1">{act.action}</p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-slate-500">{act.user}</span>
                                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                <span className="text-[10px] text-slate-400 uppercase tracking-wide">{act.time}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-10 text-slate-400 text-sm">Sin actividad reciente.</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </PermissionGate>
    );
}

function StatsCard({ title, value, icon: Icon, color, trend, alert = false, subtext }: any) {
    const colors: Record<string, string> = {
        blue: 'bg-blue-50 text-blue-600',
        indigo: 'bg-indigo-50 text-indigo-600',
        orange: 'bg-orange-50 text-orange-600',
        emerald: 'bg-emerald-50 text-emerald-600',
    };

    return (
        <div className={`bg-white p-5 rounded-2xl shadow-sm border transition-all hover:shadow-md ${alert ? 'border-orange-200 bg-orange-50/10' : 'border-slate-100'}`}>
            <div className="flex justify-between items-start mb-4">
                <div className={`p-2.5 rounded-xl ${colors[color] || 'bg-slate-100'}`}>
                    <Icon className="w-5 h-5" />
                </div>
                {trend && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full flex items-center">
                        <TrendingUp className="w-3 h-3 mr-1" /> {trend}
                    </span>
                )}
            </div>
            <div>
                <h3 className={`text-2xl font-black ${alert ? 'text-orange-600' : 'text-slate-800'}`}>{value}</h3>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">{title}</p>
                {subtext && <p className={`text-[10px] mt-1 font-medium ${alert ? 'text-orange-500' : 'text-slate-400'}`}>{subtext}</p>}
            </div>
        </div>
    );
}

function DashboardSkeleton() {
    return (
        <div className="space-y-6 pb-20 animate-pulse">
            <div className="h-20 bg-slate-200 rounded-2xl w-full" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-slate-200 rounded-2xl" />)}
            </div>
            <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2 h-[400px] bg-slate-200 rounded-2xl" />
                <div className="h-[400px] bg-slate-200 rounded-2xl" />
            </div>
        </div>
    );
}