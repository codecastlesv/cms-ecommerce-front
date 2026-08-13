'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { ArrowLeft, Save, User, MapPin, Star, Phone, Mail } from 'lucide-react';
import { handleError } from '@/lib/errorHandler';

interface CustomerDetailProps {
    customerId: string;
}

export default function CustomerDetail({ customerId }: CustomerDetailProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        first_name: '', last_name: '', email: '', phone: '', marketing_opt_in: false
    });

    const [addresses, setAddresses] = useState<any[]>([]);

    useEffect(() => {
        const fetchCustomer = async () => {
            try {
                const { data } = await api.get(`/admin/customers/${customerId}`);
                setFormData({
                    first_name: data.first_name,
                    last_name: data.last_name,
                    email: data.email,
                    phone: data.phone || '',
                    marketing_opt_in: Boolean(data.marketing_opt_in)
                });
                setAddresses(data.addresses || []);
            } catch (error) {
                toast.error(handleError(error,'Error cargando cliente'));
                router.push('/admin/customers');
            } finally {
                setLoading(false);
            }
        };
        fetchCustomer();
    }, [customerId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.put(`/admin/customers/${customerId}`, formData);
            toast.success('Cliente actualizado correctamente');
        } catch (error: any) {
            toast.error(handleError(error,'Error al guardar'));
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-10 text-center text-slate-400">Cargando perfil...</div>;

    const inputClass = "w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-900 bg-white focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition shadow-sm";
    const labelClass = "block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5";

    return (
        <div className="max-w-5xl mx-auto pb-20 p-6">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="p-2 hover:bg-white rounded-full border border-transparent hover:border-slate-200 transition">
                        <ArrowLeft className="w-5 h-5 text-slate-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">{formData.first_name} {formData.last_name}</h1>
                        <p className="text-sm text-slate-500 font-mono text-xs">ID: {customerId}</p>
                    </div>
                </div>
                <button onClick={handleSubmit} disabled={saving} className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-slate-800 flex items-center shadow-lg shadow-slate-900/20 disabled:opacity-50 text-sm transition">
                    <Save className="w-4 h-4 mr-2" /> {saving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                        <h3 className="font-bold text-lg mb-6 flex items-center text-slate-800"><User className="w-5 h-5 mr-2" /> Información Personal</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className={labelClass}>Nombre</label>
                                <input type="text" className={inputClass} value={formData.first_name} onChange={e => setFormData({ ...formData, first_name: e.target.value })} />
                            </div>
                            <div>
                                <label className={labelClass}>Apellido</label>
                                <input type="text" className={inputClass} value={formData.last_name} onChange={e => setFormData({ ...formData, last_name: e.target.value })} />
                            </div>
                            <div className="md:col-span-2">
                                <label className={labelClass}>Email (Login)</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                    <input type="email" className={`${inputClass} pl-10`} value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>Teléfono</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                    <input type="text" className={`${inputClass} pl-10`} value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-8 border-t border-slate-100">
                            <label className="flex items-start cursor-pointer group p-4 border border-slate-200 rounded-xl hover:border-slate-400 transition bg-slate-50">
                                <input type="checkbox" className="mt-1 w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                                    checked={formData.marketing_opt_in}
                                    onChange={e => setFormData({ ...formData, marketing_opt_in: e.target.checked })} />
                                <div className="ml-3">
                                    <span className="block text-sm font-bold text-slate-900">Suscripción a Marketing</span>
                                    <span className="block text-xs text-slate-500 mt-1">Permite recibir correos promocionales y campañas.</span>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-lg flex items-center text-slate-800"><MapPin className="w-5 h-5 mr-2" /> Direcciones</h3>
                            <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded">{addresses.length}</span>
                        </div>

                        {addresses.length === 0 ? (
                            <div className="text-center py-8 text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-xl">
                                El cliente no tiene direcciones registradas.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {addresses.map((addr) => (
                                    <div key={addr.id} className={`p-4 rounded-xl border relative ${addr.is_default ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200 text-slate-600'}`}>
                                        {addr.is_default && (
                                            <div className="absolute top-3 right-3 text-yellow-400"><Star className="w-4 h-4 fill-current" /></div>
                                        )}
                                        <div className="text-xs font-bold uppercase tracking-wider opacity-70 mb-2 flex items-center gap-2">
                                            {addr.type === 'shipping' ? 'Envío' : 'Facturación'}
                                        </div>
                                        <p className="font-bold text-sm mb-1">{addr.address_line1}</p>
                                        {addr.address_line2 && <p className="text-sm mb-1">{addr.address_line2}</p>}
                                        <p className="text-sm">
                                            {addr.city}, {addr.state} {addr.postal_code}
                                        </p>
                                        <p className="text-xs mt-2 opacity-80 font-mono">{addr.country}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}