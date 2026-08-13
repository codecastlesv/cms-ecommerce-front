import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { useRouter } from 'next/navigation';
import { User, AuthResponse } from '@/types';
import { toast } from 'sonner';

export const useAuth = () => {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            setLoading(false);
            return;
        }

        api.get<User>('/admin/me')
            .then(res => setUser(res.data))
            .catch(() => {
                localStorage.removeItem('token');
                setUser(null);
            })
            .finally(() => setLoading(false));
    }, []);

    const login = async (credentials: Record<string, any>) => {
        try {
            const response = await api.post<AuthResponse>('/login', credentials);
            const { access_token, user: userData } = response.data;

            localStorage.setItem('token', access_token);
            setUser(userData);

            const adminRoles = ['Admin', 'Gestor de Contenido'];
            if (adminRoles.includes(userData.role)) {
                router.push('/dashboard');
            } else {
                router.push('/');
            }
            return { success: true };
        } catch (error: any) {
            const msg = error.response?.data?.message || 'Error al iniciar sesión';
            toast.error(msg);
            return { success: false, message: msg };
        }
    };

    const logout = async () => {
        try {
            await api.post('/logout');
        } catch (e) {
            console.error('Error logout API', e);
        } finally {
            localStorage.removeItem('token');
            setUser(null);
            router.push('/login');
            toast.success('Sesión cerrada');
        }
    };

    return { user, login, logout, loading, isAuthenticated: !!user };
};