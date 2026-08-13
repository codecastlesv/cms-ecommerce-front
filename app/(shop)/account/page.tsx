'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { User, MapPin, LogOut, Plus, Trash2, Home, Star, PencilLine, BriefcaseBusiness, Handbag, Truck } from 'lucide-react';
import { CustomerProfile, CustomerAddress } from '@/types/customer';
import { EditableInput } from '@/components/ui/EditableInput';
import { useConfirm } from '@/components/providers/ConfirmDialogProvider';
import Link from 'next/link';

function AccountPageSkeleton() {
    return (
        <div className="max-w-5xl mx-auto p-6 space-y-8 relative" role="status" aria-busy="true">
            <span className="sr-only">Cargando tu cuenta</span>
            <div
                className="pointer-events-none absolute -top-20 left-1/2 h-56 w-[min(90%,36rem)] -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-500/15 via-indigo-400/10 to-violet-500/15 blur-3xl"
                aria-hidden
            />
            <div className="relative flex flex-col gap-4 border-b border-slate-200/80 pb-6 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-3">
                    <div className="h-9 w-52 rounded-xl bg-slate-200/90 shadow-sm ring-1 ring-slate-100/80 animate-pulse" />
                    <div className="h-4 w-72 max-w-full rounded-lg bg-slate-100 animate-pulse [animation-delay:120ms]" />
                </div>
                <div className="h-10 w-40 shrink-0 self-start rounded-xl bg-slate-100 animate-pulse sm:self-auto [animation-delay:180ms]" />
            </div>
            <div className="relative grid grid-cols-1 gap-8 md:grid-cols-3">
                <div className="space-y-6">
                    {[0, 1, 2].map((i) => (
                        <div
                            key={i}
                            className="space-y-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
                        >
                            <div className="flex items-center gap-2">
                                <div className="h-9 w-9 shrink-0 rounded-xl bg-slate-100 animate-pulse" />
                                <div className="h-5 flex-1 max-w-[9rem] rounded-lg bg-slate-200/80 animate-pulse" />
                            </div>
                            <div className="space-y-3 pt-1">
                                <div className="h-3 w-14 rounded bg-slate-100 animate-pulse" />
                                <div className="h-4 w-3/4 max-w-[12rem] rounded-md bg-slate-200/70 animate-pulse" />
                                <div className="h-3 w-14 rounded bg-slate-100 animate-pulse" />
                                <div className="h-10 w-full rounded-lg bg-slate-100 animate-pulse" />
                                <div className="h-3 w-24 rounded bg-slate-100 animate-pulse" />
                                <div className="h-10 w-full rounded-lg bg-slate-100 animate-pulse" />
                            </div>
                        </div>
                    ))}
                </div>
                <div className="space-y-6 md:col-span-2">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2">
                            <div className="h-9 w-9 shrink-0 rounded-xl bg-slate-100 animate-pulse" />
                            <div className="h-6 w-44 rounded-lg bg-slate-200/80 animate-pulse" />
                        </div>
                        <div className="h-10 w-full rounded-xl bg-slate-200/70 animate-pulse sm:w-44" />
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                        {[0, 1].map((j) => (
                            <div
                                key={j}
                                className="flex gap-4 rounded-xl border border-slate-100 bg-white p-5 shadow-sm"
                            >
                                <div className="mt-1 h-11 w-11 shrink-0 rounded-full bg-slate-100 animate-pulse" />
                                <div className="min-w-0 flex-1 space-y-2 pt-0.5">
                                    <div className="h-4 w-32 rounded-md bg-slate-200/80 animate-pulse" />
                                    <div className="h-3 w-full rounded bg-slate-100 animate-pulse" />
                                    <div className="h-3 w-4/5 rounded bg-slate-100 animate-pulse" />
                                    <div className="h-3 w-24 rounded bg-slate-50 animate-pulse" />
                                </div>
                                <div className="flex shrink-0 gap-2">
                                    <div className="h-9 w-9 rounded-lg bg-slate-50 animate-pulse" />
                                    <div className="h-9 w-9 rounded-lg bg-slate-50 animate-pulse" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function MyAccountPage() {
    const router = useRouter();
    const [profile, setProfile] = useState<CustomerProfile | null>(null);
    const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
    const [initialLoading, setInitialLoading] = useState(true);
    const [profileSaving, setProfileSaving] = useState(false);
    const confirm = useConfirm();

    const [showAddressForm, setShowAddressForm] = useState(false);
    const [newAddress, setNewAddress] = useState({
        recipient_name: '',
        name: 'Casa',
        address_line1: '',
        city: '',
        state: '',
        postal_code: '',
        country: 'SV',
        type: 'shipping',
        is_default: false,
        instructions: '',
        phone: '',
    });

    const emptyAddress = {
        recipient_name: '',
        name: 'Casa',
        address_line1: '',
        city: '',
        state: '',
        postal_code: '',
        country: 'SV',
        type: 'shipping',
        is_default: false,
        instructions: '',
        phone: '',
    };

    const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null);
    const [phone, setPhone] = useState(profile?.phone || '');
    const [birthDate, setBirthDate] = useState(profile?.birth_date || '');
    const [documentType, setDocumentType] = useState('DUI');
    const [documentNumber, setDocumentNumber] = useState('');

    useEffect(() => {
        const loadData = async () => {
            try {
                const [profileRes, addressRes] = await Promise.all([
                    api.get('/shop/me', { params: { enrich_ccf: 1 } }),
                    api.get('/shop/addresses')
                ]);

                const p = profileRes.data?.data ?? profileRes.data;
                setProfile(p);
                setAddresses(addressRes.data.data);
            } catch (error) {
                toast.error("Sesión expirada o inválida");
                router.replace('/');
            } finally {
                setInitialLoading(false);
            }
        };
        loadData();
    }, [router]);

    useEffect(() => {
        if (profile?.phone) setPhone(profile.phone);
        if (profile?.birth_date) {
            setBirthDate(profile.birth_date);
        }
        if (profile?.document_type) {
            setDocumentType(profile.document_type);
        }
        if (profile?.document_number) {
            setDocumentNumber(profile.document_number);
        }
    }, [profile]);

    const documentLocked = Boolean(profile?.document_number?.trim());

    const formatDuiMask = (raw: string): string => {
        const digits = raw.replace(/\D/g, '').slice(0, 9);
        if (digits.length <= 8) return digits;
        return `${digits.slice(0, 8)}-${digits.slice(8)}`;
    };

    const handleSaveDocument = async () => {
        if (documentLocked) return;
        const value = documentType === 'DUI' ? formatDuiMask(documentNumber) : documentNumber.trim();
        if (!value) {
            toast.error('Ingresa un número de documento');
            return;
        }
        try {
            setProfileSaving(true);
            const res = await api.put('/shop/me', {
                name: profile?.name,
                document_type: documentType,
                document_number: value,
            });
            const p = res.data?.data ?? res.data;
            setProfile(p);
            setDocumentNumber(p?.document_number || value);
            toast.success('Documento actualizado');
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'No se pudo actualizar el documento');
        } finally {
            setProfileSaving(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('shop_token');
        window.dispatchEvent(new Event('shop-auth-changed'));
        router.push('/');
    };

    const handleAddAddress = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingAddress) {
                await api.put(`/shop/addresses/${editingAddress.id}`, newAddress);
                toast.success("Dirección actualizada");
            } else {
                await api.post('/shop/addresses', newAddress);
                toast.success("Dirección agregada");
            }

            const res = await api.get('/shop/addresses');
            setAddresses(res.data.data);
            setShowAddressForm(false);
            setEditingAddress(null);
            setNewAddress(emptyAddress);
        } catch (e: any) {
            toast.error(e.response?.data?.message || "Error al guardar");
        }
    };

    const handleEditAddress = (addr: CustomerAddress) => {
        setEditingAddress(addr);

        setNewAddress({
            recipient_name: addr.recipient_name ?? '',
            name: addr.name ?? '',
            address_line1: addr.details.line1 ?? '',
            city: addr.details.city ?? '',
            state: addr.details.state ?? '',
            postal_code: addr.details.zip_code ?? '',
            country: addr.details.country ?? 'SV',
            type: addr.type ?? 'shipping',
            is_default: addr.is_default ?? false,
            instructions: addr.instructions ?? '',
            phone: addr.phone ?? '',
        });

        setShowAddressForm(true);
    };


    const handleDeleteAddress = async (id: number) => {
        confirm({
            title: 'Eliminar Dirección',
            message: '¿Estás seguro que deseas eliminar la dirección?',
            confirmText: 'Sí, Salir',
            variant: 'danger',
            onConfirm: async () => {
                try {
                    await api.delete(`/shop/addresses/${id}`);
                    setAddresses(addresses.filter(a => a.id !== id));
                    toast.success("Dirección eliminada");
                } catch {
                    toast.error("Error al eliminar");
                }
            }
        });
    };

    const handleUpdateProfileField = async (field: string, value: string, setState?: (val: string) => void, label?: string) => {
        try {
            setProfileSaving(true);

            const payload = {
                name: profile?.name,
                [field]: value
            };

            const res = await api.put('/shop/me', payload);

            setProfile(res.data?.data ?? res.data);
            if (setState) {
                const p = res.data?.data ?? res.data;
                setState(p?.[field] || '');
            }

            toast.success(`${label} actualizado`);
        } catch (e: any) {
            toast.error(e.response?.data?.message || `No se pudo actualizar ${field}`);
        } finally {
            setProfileSaving(false);
        }
    };

    if (initialLoading) {
        return <AccountPageSkeleton />;
    }

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col gap-5 border-b border-slate-200/80 pb-6 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Mi Cuenta</h1>
                    <p className="text-slate-500">Bienvenido, {profile?.name}</p>
                </div>
                <button
                    type="button"
                    onClick={handleLogout}
                    className="group relative inline-flex w-full shrink-0 items-center justify-center gap-3 overflow-hidden rounded-2xl border border-slate-200/90 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-900/[0.04] transition-all duration-200 hover:border-red-200/90 hover:bg-gradient-to-b hover:from-red-50/90 hover:to-rose-50/50 hover:text-red-800 hover:shadow-md hover:ring-red-900/[0.06] active:scale-[0.98] sm:w-auto sm:justify-start"
                >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition-colors duration-200 group-hover:bg-red-100 group-hover:text-red-600">
                        <LogOut className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" strokeWidth={2.25} />
                    </span>
                    <span className="pr-1">Cerrar sesión</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl border shadow-sm">
                        <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <User className="w-5 h-5 text-blue-600" /> Mis Datos
                        </h2>
                        <div className="space-y-3 text-sm">
                            <div>
                                <label className="text-slate-400 text-xs">Email</label>
                                <p className="font-medium text-slate-800">{profile?.email}</p>
                            </div>
                            <EditableInput
                                label="Teléfono"
                                type="tel"
                                value={phone}
                                loading={profileSaving}
                                onSave={(val) => handleUpdateProfileField('phone', val, setPhone, 'Teléfono')}
                                sanitize={(val) => val.replace(/\D/g, '')}
                            />
                            <EditableInput
                                label="Fecha de Nacimiento"
                                type="date"
                                value={birthDate || ''}
                                loading={profileSaving}
                                onSave={(val) => handleUpdateProfileField('birth_date', val, setBirthDate, 'Fecha de Nacimiento')}
                                maxDateToday={true}
                            />
                            <div>
                                <label className="text-slate-400 text-xs">Tipo de documento</label>
                                {documentLocked ? (
                                    <p className="font-medium text-slate-800 mt-0.5">{documentType || 'DUI'}</p>
                                ) : (
                                    <select
                                        value={documentType}
                                        onChange={(e) => setDocumentType(e.target.value)}
                                        className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                                        disabled={profileSaving}
                                    >
                                        <option value="DUI">DUI</option>
                                        <option value="Pasaporte">Pasaporte</option>
                                    </select>
                                )}
                            </div>
                            <div>
                                <label className="text-slate-400 text-xs">Documento (DUI / Pasaporte)</label>
                                {documentLocked ? (
                                    <>
                                        <input
                                            type="text"
                                            value={documentNumber}
                                            disabled
                                            readOnly
                                            className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-600 cursor-not-allowed"
                                        />
                                        <p className="mt-1 text-[11px] text-slate-500">
                                        Documento verificado y vinculado a tu cuenta.
                                        </p>
                                    </>
                                ) : (
                                    <div className="mt-1 flex gap-2">
                                        <input
                                            type="text"
                                            value={documentNumber}
                                            onChange={(e) => {
                                                const raw = e.target.value;
                                                setDocumentNumber(
                                                    documentType === 'DUI' ? formatDuiMask(raw) : raw.replace(/[^A-Za-z0-9]/g, '').slice(0, 15).toUpperCase()
                                                );
                                            }}
                                            placeholder={documentType === 'DUI' ? '00000000-0' : 'ABC12345'}
                                            className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                                            disabled={profileSaving}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => void handleSaveDocument()}
                                            disabled={profileSaving || !documentNumber.trim()}
                                            className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                                        >
                                            Guardar
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="text-slate-400 text-xs">RFC / NIT</label>
                                <p className="font-medium text-slate-800">{profile?.billing?.tax_id || 'No registrado'}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border shadow-sm mt-6">
                        <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <Truck className="w-5 h-5 text-blue-600" /> Mis Pedidos
                        </h2>
                        <p className="text-sm text-slate-500 mb-4">
                            Consulta el estado de tus pedidos realizados.
                        </p>
                        <Link href="/order">
                            <button className="inline-block bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-800 transition">
                                Ver Mis Pedidos
                            </button>
                        </Link>
                    </div>
                </div>

                <div className="md:col-span-2 space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="font-bold text-lg flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-blue-600" /> Mis Direcciones
                        </h2>
                        <button
                            onClick={() => setShowAddressForm(!showAddressForm)}
                            className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center hover:bg-slate-800"
                        >
                            <Plus className="w-4 h-4 mr-1" /> Nueva Dirección
                        </button>
                    </div>

                    {showAddressForm && (
                        <form onSubmit={handleAddAddress} className="bg-slate-50 p-6 rounded-2xl border border-blue-200 animate-in fade-in slide-in-from-top-4">
                            <h3 className="font-bold text-sm mb-4 text-blue-800">{editingAddress ? `Editar Dirección - ${editingAddress.name}` : 'Agregar Nueva Dirección'}</h3>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <input placeholder="Nombre destinatario" className="p-2 border rounded" required value={newAddress.recipient_name} onChange={e => setNewAddress({ ...newAddress, recipient_name: e.target.value })} />
                                <input placeholder="Alias (Ej. Casa)" className="p-2 border rounded" required value={newAddress.name} onChange={e => setNewAddress({ ...newAddress, name: e.target.value })} />
                                <input placeholder="Calle y Número" className="p-2 border rounded" required value={newAddress.address_line1} onChange={e => setNewAddress({ ...newAddress, address_line1: e.target.value })} />
                                <input placeholder="Ciudad" className="p-2 border rounded" required value={newAddress.city} onChange={e => setNewAddress({ ...newAddress, city: e.target.value })} />
                                <input placeholder="Estado" className="p-2 border rounded" required value={newAddress.state} onChange={e => setNewAddress({ ...newAddress, state: e.target.value })} />
                                <input placeholder="Código Postal" className="p-2 border rounded" required value={newAddress.postal_code} onChange={e => setNewAddress({ ...newAddress, postal_code: e.target.value })} />
                                <input placeholder="Teléfono" className="p-2 border rounded" required value={newAddress.phone} onChange={e => setNewAddress({ ...newAddress, phone: e.target.value })} />
                                <input placeholder="Instrucciones" className="p-2 border rounded" required value={newAddress.instructions} onChange={e => setNewAddress({ ...newAddress, instructions: e.target.value })} />
                                <div className="col-span-2">
                                    <label className="text-xs text-slate-500 mb-1 block">Tipo de dirección</label>

                                    <div className="flex gap-6">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="type"
                                                value="shipping"
                                                checked={newAddress.type === 'shipping'}
                                                onChange={(e) =>
                                                    setNewAddress({ ...newAddress, type: e.target.value })
                                                }
                                            />
                                            <span>Envío</span>
                                        </label>

                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="type"
                                                value="billing"
                                                checked={newAddress.type === 'billing'}
                                                onChange={(e) =>
                                                    setNewAddress({ ...newAddress, type: e.target.value })
                                                }
                                            />
                                            <span>Facturación</span>
                                        </label>
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={newAddress.is_default} onChange={e => setNewAddress({ ...newAddress, is_default: e.target.checked })} />
                                        <span className="text-sm">Marcar como Predeterminada</span>
                                    </label>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => { setShowAddressForm(false); setEditingAddress(null); setNewAddress(emptyAddress) }} className="px-4 py-2 text-sm text-slate-500">Cancelar</button>
                                <button type="submit" className="bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700">{editingAddress ? 'Guardar Cambios' : 'Guardar Dirección'}</button>
                            </div>
                        </form>
                    )}

                    <div className="grid grid-cols-1 gap-4">
                        {addresses
                            .filter(addr => !editingAddress || addr.id !== editingAddress.id)
                            .map(addr => {

                                const getAddressIcon = (name: string) => {
                                    const n = name.toLowerCase();

                                    if (n.includes('casa') || n.includes('hogar')) return Home;
                                    if (n.includes('trabajo') || n.includes('oficina')) return BriefcaseBusiness;

                                    return MapPin;
                                };

                                const Icon = getAddressIcon(addr.name);

                                return (
                                    <div key={addr.id} className={`p-4 rounded-xl border flex justify-between items-start transition-all ${addr.is_default ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                                        <div className="flex gap-4">
                                            <div className={`mt-1 p-2 rounded-full flex items-center justify-center ${addr.is_default ? 'bg-blue-200 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                                                <Icon className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-bold text-slate-900">{addr.name}</h4>
                                                    {addr.is_default && <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-bold flex items-center gap-1"><Star className="w-3 h-3 fill-current" /> Predeterminada</span>}
                                                </div>
                                                <p className="text-sm text-slate-600 mt-1">{addr.formatted}</p>
                                                <p className="text-xs text-slate-400 mt-1 uppercase tracking-wide">{addr.type === 'shipping' ? 'Envío' : 'Facturación'}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleEditAddress(addr)}
                                                className="text-slate-400 hover:text-blue-500 p-2"
                                            >
                                                <PencilLine className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDeleteAddress(addr.id)} className="text-slate-400 hover:text-red-500 p-2">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                );
                            })}

                        {addresses.length === 0 && (
                            <div className="text-center py-10 text-slate-400 border-2 border-dashed rounded-xl">
                                No tienes direcciones guardadas.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}