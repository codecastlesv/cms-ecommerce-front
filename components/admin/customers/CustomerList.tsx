'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/axios';
import { Search, User, MapPin, Mail, Phone, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { handleError } from '@/lib/errorHandler';

export default function CustomerList() {
    const [customers, setCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const fetchCustomers = async (query = '') => {
        setLoading(true);
        try {
            const { data } = await api.get(`/admin/customers?search=${query}`);
            setCustomers(data.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchCustomers(search);
        }, 500);
        return () => clearTimeout(timeout);
    }, [search]);

    const handleDelete = async (id: number) => {
        if (!confirm('¿Eliminar cliente? Se borrará su historial.')) return;
        try {
            await api.delete(`/admin/customers/${id}`);
            setCustomers(prev => prev.filter(c => c.id !== id));
            toast.success('Cliente eliminado');
        } catch (error) { toast.error( handleError(error,'Error al eliminar')); }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Clientes</h1>
                    <p className="text-sm text-slate-500">Gestión de base de datos de usuarios</p>
                </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, email..."
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-slate-900 transition"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4">Cliente</th>
                            <th className="px-6 py-4">Contacto</th>
                            <th className="px-6 py-4">Estado Marketing</th>
                            <th className="px-6 py-4 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                        {loading ? (
                            <tr><td colSpan={4} className="text-center py-10 text-slate-400">Cargando clientes...</td></tr>
                        ) : customers.length === 0 ? (
                            <tr><td colSpan={4} className="text-center py-10 text-slate-400">No se encontraron clientes.</td></tr>
                        ) : (
                            customers.map((customer) => (
                                <tr key={customer.id} className="hover:bg-slate-50 transition">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold mr-3">
                                                {customer.first_name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-900">{customer.first_name} {customer.last_name}</div>
                                                <div className="text-xs text-slate-500">Registrado: {new Date(customer.created_at).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center text-slate-600">
                                                <Mail className="w-3 h-3 mr-2 text-slate-400" /> {customer.email}
                                            </div>
                                            {customer.phone && (
                                                <div className="flex items-center text-slate-600">
                                                    <Phone className="w-3 h-3 mr-2 text-slate-400" /> {customer.phone}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {customer.marketing_opt_in ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                Suscrito
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                No suscrito
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Link href={`customers/${customer.id}`} className="p-2 hover:bg-slate-200 rounded-lg text-slate-500 hover:text-slate-900 transition">
                                                <Edit className="w-4 h-4" />
                                            </Link>
                                            <button onClick={() => handleDelete(customer.id)} className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}