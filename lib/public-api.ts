import api from './axios';

export const getPublicSettings = async () => {
    try {

        return {
            seo_title: 'Galaxia Deportes',
            seo_description: 'Tu tienda de deportes favorita.',
            full_logo_url: null,
            main_color: '#2563eb',
            robots_index: true
        };
    } catch (error) {
        return null;
    }
};