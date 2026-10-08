import api from './axios';

export interface PublicSettings {
    seo_title: string | null;
    seo_description: string | null;
    full_logo_url: string | null;
    main_color: string;
    robots_index: boolean;
    og_title: string | null;
    og_description: string | null;
    og_image_url: string | null;
    ga_measurement_id: string | null;
}

export const getPublicSettings = async (): Promise<PublicSettings | null> => {
    try {
        const { data } = await api.get<{ data: PublicSettings }>('/shop/settings');
        return data.data;
    } catch {
        return null;
    }
};
