'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { ArrowLeft, Save, Camera, ShieldCheck, Lock } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { useRoles } from '@/hooks/useRoles';
import { usePermission } from '@/hooks/usePermission';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Input } from '@/components/ui/Input';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { User, Role, ApiResponse } from '@/types';

const userSchema = z.object({
    name: z.string()
        .min(3, "El nombre es muy corto")
        .regex(/^[a-zA-ZñÑáéíóúÁÉÍÓÚ\s]+$/, "El nombre no puede contener números ni símbolos"),
    email: z.string().email("Formato de correo inválido"),
    phone: z.string()
        .min(9, "El teléfono debe tener 8 dígitos")
        .max(9, "El teléfono debe tener 8 dígitos"),
    role: z.string().min(1, "Selecciona un rol"),
    status: z.boolean(),
    password: z.string().optional(),
    confirmPassword: z.string().optional(),
}).refine((data) => {
    if (data.password && data.password.length > 0) {
        return data.password === data.confirmPassword;
    }
    return true;
}, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
});

type UserFormData = z.infer<typeof userSchema>;

interface UserFormProps {
    userId?: string;
}

export default function UserForm({ userId }: UserFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const { data: roles, isLoading: loadingRoles } = useRoles();

    const { can } = usePermission();

    const hasPermission = userId
        ? can('edit_users')
        : can('create_users');

    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

    const { register, handleSubmit, setValue, formState: { errors }, reset } = useForm<UserFormData>({
        resolver: zodResolver(userSchema),
        defaultValues: {
            status: true,
            role: '',
        }
    });

    useEffect(() => {
        if (userId) {
            api.get<User>(`/admin/users/${userId}`)
                .then(({ data }) => {
                    let visualPhone = '';
                    if (data.phone) {
                        const raw = data.phone.toString().replace(/^503/, '');
                        visualPhone = raw.replace(/(\d{4})(\d{4})/, '$1-$2');
                    }

                    reset({
                        name: data.name,
                        email: data.email,
                        phone: visualPhone,
                        role: data.role || (data.roles && data.roles.length > 0 ? data.roles[0].name : ''),
                        status: data.status === 'active',
                    });

                    if (data.image_url || data.avatar) {
                        setAvatarPreview(data.image_url || data.avatar || null);
                    }
                })
                .catch((error) => {
                    console.error(error);
                    toast.error("Error al cargar usuario");
                });
        }
    }, [userId, reset]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const onSubmit = async (data: UserFormData) => {
        if (!hasPermission) {
            toast.error("No tienes permisos para realizar cambios.");
            return;
        }

        if (!userId && (!data.password || data.password.length < 8)) {
            toast.error("La contraseña es obligatoria y debe tener 8 caracteres");
            return;
        }

        setLoading(true);
        try {
            const dbPhone = `503${data.phone.replace(/-/g, '')} `;

            const payload = {
                name: data.name,
                email: data.email,
                role: data.role,
                phone: dbPhone,
                status: data.status ? 'active' : 'disabled',
                ...(data.password ? { password: data.password } : {})
            };

            let currentId = userId;

            if (userId) {
                await api.put<ApiResponse<User>>(`/admin/users/${userId}`, payload);
            } else {
                const res = await api.post<ApiResponse<User>>('/admin/users', payload);
                if (res.data.data) {
                    currentId = res.data.data.id.toString();
                } else {
                    currentId = (res.data as unknown as User).id.toString();
                }
            }

            if (avatarFile && currentId) {
                const formData = new FormData();
                formData.append('avatar', avatarFile);

                await api.post(`/admin/users/${currentId}/avatar`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }

            toast.success('Usuario guardado exitosamente');
            router.push('/users');

        } catch (error: any) {
            const msg = error.response?.data?.message || 'Error al guardar';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl mx-auto p-6 pb-20">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button type="button" onClick={() => router.back()} className="p-2 hover:bg-white rounded-full transition"><ArrowLeft className="w-5 h-5" /></button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">{userId ? 'Editar Usuario' : 'Nuevo Usuario'}</h1>

                        {!hasPermission && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 mt-1 text-xs font-bold text-orange-700 bg-orange-100 rounded-md">
                                <Lock className="w-3 h-3" /> Solo Lectura
                            </span>
                        )}
                    </div>
                </div>

                {hasPermission && (
                    <button type="submit" disabled={loading} className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-slate-800 flex items-center shadow-lg disabled:opacity-50 text-sm transition">
                        <Save className="w-4 h-4 mr-2" /> {loading ? 'Guardando...' : 'Guardar'}
                    </button>
                )}
            </div>

            <Card className="p-8 relative">

                {!hasPermission && <div className="absolute inset-0 bg-slate-50/20 z-10 pointer-events-none rounded-2xl" />}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    <div className="md:col-span-2 flex flex-col items-center justify-center mb-4">
                        <div className="relative group cursor-pointer w-24 h-24">
                            <div className={`w-full h-full rounded-full overflow-hidden border-2 border-slate-200 bg-slate-50 ${!hasPermission ? 'opacity-60' : ''}`}>
                                {avatarPreview ? (
                                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300"><Camera className="w-8 h-8" /></div>
                                )}
                            </div>
                            <input
                                type="file"
                                accept="image/*"
                                className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                onChange={handleImageChange}
                                disabled={!hasPermission}
                            />
                        </div>
                    </div>

                    <div className="md:col-span-2">
                        <Input
                            label="Nombre Completo"
                            registration={register('name')}
                            error={errors.name?.message}
                            sanitize={(val) => val.replace(/[^a-zA-ZñÑáéíóúÁÉÍÓÚ\s]/g, '')}
                            placeholder="Ej: Juan Pérez"
                            disabled={!hasPermission}
                        />
                    </div>

                    <div className="md:col-span-2">
                        <Input
                            label="Correo Electrónico"
                            type="email"
                            registration={register('email')}
                            error={errors.email?.message}
                            disabled={!hasPermission}
                        />
                    </div>

                    <div className="md:col-span-2">
                        <PhoneInput
                            registration={register('phone')}
                            error={errors.phone?.message}
                            disabled={!hasPermission}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Rol del Sistema</label>
                        <div className="relative">
                            <ShieldCheck className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                            <select
                                {...register('role')}
                                disabled={!hasPermission}
                                className="w-full border rounded-lg pl-10 pr-4 py-2.5 text-sm font-medium outline-none bg-white appearance-none border-slate-300 focus:ring-2 focus:ring-slate-900 disabled:bg-slate-100 disabled:text-slate-500"
                            >
                                <option value="">Seleccionar Rol</option>
                                {!loadingRoles && roles?.map((r: Role) => (
                                    <option key={r.id} value={r.name}>{r.name}</option>
                                ))}
                            </select>
                        </div>
                        {errors.role && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.role.message}</p>}
                    </div>

                    <div className="flex items-end pb-2">
                        <label className={`flex items-center cursor-pointer group p-3 border border-slate-200 rounded-xl w-full transition ${!hasPermission ? 'bg-slate-50 cursor-not-allowed' : 'hover:bg-slate-50'}`}>
                            <input
                                type="checkbox"
                                className="w-4 h-4 text-slate-900 rounded focus:ring-slate-900 disabled:opacity-50"
                                {...register('status')}
                                disabled={!hasPermission}
                            />
                            <div className="ml-3">
                                <span className={`block text-sm font-bold ${!hasPermission ? 'text-slate-500' : 'text-slate-700'}`}>Usuario Activo</span>
                            </div>
                        </label>
                    </div>

                    <div className="col-span-1 md:col-span-2 my-2 border-t border-slate-100"></div>

                    <div className="md:col-span-2 bg-slate-50 p-6 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-6 relative">

                        {!hasPermission && <div className="absolute inset-0 bg-white/40 z-20 cursor-not-allowed" />}

                        <div className="md:col-span-2 flex items-center gap-2 mb-2">
                            <ShieldCheck className="w-4 h-4 text-slate-500" />
                            <h3 className="font-bold text-slate-800 text-sm">Seguridad</h3>
                        </div>

                        <PasswordInput
                            label="Contraseña"
                            placeholder={userId ? "Opcional al editar" : "Mínimo 8 caracteres"}
                            registration={register('password')}
                            error={errors.password?.message}
                            disabled={!hasPermission}
                        />

                        <PasswordInput
                            label="Confirmar Contraseña"
                            placeholder="Repite la contraseña"
                            registration={register('confirmPassword')}
                            error={errors.confirmPassword?.message}
                            disabled={!hasPermission}
                        />
                    </div>

                </div>
            </Card>
        </form>
    );
}