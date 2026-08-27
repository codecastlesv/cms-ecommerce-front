import api from './axios';

export const getPublicSettings = async () => {
    try {

        return {
            seo_title: 'Castella Sagarra',
            seo_description: '',
            full_logo_url: null,
            main_color: '#0f172b',
            robots_index: true
        };
    } catch (error) {
        return null;
    }
};