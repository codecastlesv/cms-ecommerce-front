export interface AppSettings {
    main_color: string;
    logo?: string | null;

    seo: {
        title?: string;
        description?: string;
        canonical_url?: string;
        robots_index: boolean;
        robots_follow: boolean;
        schema_json?: object | null;
    };

    social: {
        og_title?: string;
        og_description?: string;
        og_image?: string | null;
    };
}