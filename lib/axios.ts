import axios from 'axios';

const isShopUrl = (url: string): boolean => {
    const path = (url || '').split('?')[0];
    return (
        /^\/?shop(\/|$)/.test(path) ||
        /^\/?checkout\/process$/.test(path) ||
        /^\/?validate-dui$/.test(path)
    );
};

const api = axios.create({
    // Preferir 127.0.0.1 en local: evita fallos SSR en Windows cuando localhost → ::1.
    baseURL: (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api').replace(
        /:\/\/localhost(?=[:/]|$)/i,
        '://127.0.0.1',
    ),
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    // Bearer tokens en localStorage: sin cookies de sesión → sin bloqueo en paralelo ni preflight extra
    withCredentials: false,
});

const isShopAnonymousAuth = (url: string): boolean => {
    const path = (url || '').split('?')[0].replace(/^\//, '');
    return /^shop\/(login|register|check-email|forgot-password|validate-dui)$/.test(path)
        || /^validate-dui$/.test(path);
};

api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const requestUrl = config.url || '';
        const isShopRequest = isShopUrl(requestUrl);

        // Login/registro nunca deben llevar Bearer viejo (evita 401/422 raros con token inválido)
        if (isShopRequest && isShopAnonymousAuth(requestUrl)) {
            return config;
        }

        const tokenKey = isShopRequest ? 'shop_token' : 'token';
        const token = localStorage.getItem(tokenKey);

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }

    config.headers.Accept = 'application/json';

    // FormData: quitar Content-Type para que el navegador envíe el boundary multipart
    if (config.data instanceof FormData) {
        if (typeof config.headers.delete === 'function') {
            config.headers.delete('Content-Type');
        } else {
            delete config.headers['Content-Type'];
        }
    }

    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            if (typeof window !== 'undefined') {
                const requestUrl = error.config.url || '';
                const isShopRequest = isShopUrl(requestUrl);

                if (isShopRequest) {
                    localStorage.removeItem('shop_token');
                    window.location.href = '/';
                } else {
                    localStorage.removeItem('token');
                    if (!window.location.pathname.includes('/login')) {
                        window.location.href = '/login';
                    }
                }
            }
        }
        return Promise.reject(error);
    }
);

export default api;