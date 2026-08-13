export interface ShopBanner {
    id: number;
    title: string;
    headline?: string;
    subheadline?: string;
    image_url: string;
    mobile_url?: string;
    alt_text?: string;
    cta: {
        text?: string;
        url?: string;
        new_tab: boolean;
    };
    style: {
        bg_color?: string;
    };
}