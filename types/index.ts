export interface Permission {
    id: number;
    name: string;
    guard_name: string;
    group_name?: string;
    created_at?: string;
    updated_at?: string;
}

export interface Role {
    id: number;
    name: string;
    guard_name: string;
    permissions?: Permission[];
    users_count?: number;
    created_at?: string;
    updated_at?: string;
}

export interface User {
    id: number;
    name: string;
    email: string;
    status: 'active' | 'disabled' | 'pending';
    role: string;
    roles?: Role[];
    permissions?: string[];
    avatar?: string;
    image_url?: string;
    phone?: string;
    last_login_at?: string;
    email_verified_at?: string;
    created_at?: string;
    updated_at?: string;
}

export interface Banner {
    id: number;
    title: string;
    headline?: string;
    cta?: {
        text: string;
        url: string;
    };
    is_active: boolean;
    images: {
        desktop: string;
        mobile?: string;
    };
    image_desktop_url?: string;
    full_image_desktop?: string;
    full_image_mobile?: string;
    link?: string;
    pivot?: {
        sort_order: number;
        start_at: string | null;
        end_at: string | null;
        is_active: boolean;
    };
}

export interface BannerGroup {
    id: number;
    key: string;
    name: string;
    page: string;
    layout_type: 'slider' | 'grid' | 'single';
    max_items: number;
    banners_count?: number;
    banners?: Banner[];
}

export interface InformativePageListItem {
    slug: string;
    title: string;
    is_active: boolean;
}

export interface InformativePageDetail {
    id: number;
    slug: string;
    title: string;
    content: Record<string, unknown>;
    seo: {
        meta_title?: string;
        meta_description?: string;
        [key: string]: unknown;
    };
    is_active: boolean;
    updated_at?: string;
}


export interface AuthResponse {
    user: User;
    access_token: string;
    token_type?: string;
    message?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    prev_page_url?: string;
    next_page_url?: string;
}

export interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    errors?: Record<string, string[]>;
}


export type IconName =
    | 'LayoutDashboard' | 'Users' | 'Image' | 'Settings'
    | 'ShoppingCart' | 'FileText' | 'Package' | 'BarChart'
    | 'Shield' | 'Globe' | 'Bell' | 'ShoppingBag'
    | 'CreditCard' | 'Receipt' | 'Store' | 'Box'
    | 'Warehouse' | 'Dumbbell' | 'HeartPulse' | 'Trophy' | 'Target';


export interface AttributeValue {
    id?: number;
    value: string;
    slug?: string;
    color_hex?: string;
    secondary_color_hex?: string;
    swatch_image?: string;
    swatch_image_url?: string;
    swatch_file?: File;
    category_codes?: number[];
    sort_order?: number;
    category_ids: number[];
}

export interface Attribute {
    id: number;
    name: string;
    slug: string;
    type: 'select' | 'color' | 'button' | 'text';
    is_variant: boolean;
    is_filterable: boolean;
    values: AttributeValue[];
    products_count?: number;
}


export interface SeoConfig {
    title: string | null;
    description: string | null;
    canonical_url: string | null;
    robots_index: boolean;
    robots_follow: boolean;
    og_image: string | null;
}

export interface Category {
    id: number;
    name: string;
    slug: string;
    code: number;
    description: string | null;
    parent_id: number | null;
    parent_name?: string;
    parent?: Category | null;
    children?: Category[];
    sort_order: number;
    is_active: boolean;
    products_count?: number;
    children_count?: number;
    seo?: SeoConfig;
    created_at?: string;
    updated_at?: string;
}

export type LaravelResource<T> = {
    data: T;
}

export interface Sport {
    id: number;
    name: string;
    slug: string;
    icon: string | null;
    image: string | null;
    sort_order: number;
    is_featured: boolean;
    products_count?: number;
    seo?: SeoConfig;
    created_at?: string;
    updated_at?: string;
}


export interface Brand {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    logo: string | null;
    is_featured: boolean;
    products_count?: number;
    seo?: SeoConfig;
    created_at?: string;
    updated_at?: string;
}


export interface ProductImage {
    id: number;
    url: string;
    full_url?: string;
    alt_text: string | null;
    sort_order: number;
    is_visible: boolean;
}

export interface InventoryStoreEntry {
    id: number;
    store_id: number;
    sku: string;
    qty_on_hand: number;
    qty_reserved?: number;
    store?: {
        id: number;
        name: string;
        code: string;
    };
}

export interface Product {
    id: number;
    erp_product_id?: number | null;
    sku: string;
    codigo?: string | null;
    name: string;
    slug: string;
    description: string | null;
    short_description: string | null;
    external_image_url?: string | null;
    style_code: string | null;
    product_color: string | null;
    /** Referencia Brilo (proNombreCotizaciones), ej. "U:SYTE L:TE S:RU" */
    pro_nombre_cotizaciones?: string | null;
    details: Record<string, string> | null;

    status: 'draft' | 'published' | 'archived';
    available_in_store?: boolean;
    price_regular: number;
    cost_average?: number | null;
    price_sale: number | null;
    discount_percentage: number | null;
    weight?: number | null;
    stock_quantity?: number;
    currency: string;

    brand_id: number | null;
    brand?: Brand;

    categories?: Category[];
    sports?: Sport[];
    images?: ProductImage[];
    main_image_url?: string;
    attributeValues?: Array<{
        id: number;
        value: string;
        slug?: string | null;
        attribute?: { id: number; name: string; slug: string };
    }>;
    inventory_stores?: InventoryStoreEntry[];

    is_featured: boolean;
    view_count: number;

    seo_title: string | null;
    seo_description: string | null;
    canonical_url: string | null;
    robots_index: boolean;
    robots_follow: boolean;

    created_at: string;
    updated_at: string;

    /** Campos enriquecidos en listado admin (GET /admin/products) */
    categoria_padre?: string | null;
    subcategoria?: string | null;
    subcategoria_genero?: string | null;
    presentacion?: string | null;
    /** Tercer nivel de clasificación (Sub-subcategoría en el formulario) */
    sub_subcategoria?: string | null;
    unique_style_codes?: string[];
    unique_upcs?: string[];
    colores_disponibles?: string[];
}

export interface ProductFormData {
    name: string;
    sku: string;
    description?: string;
    short_description?: string;
    style_code?: string;
    product_color?: string;
    price_regular: number;
    price_sale?: number;
    discount_percentage?: number;
    brand_id?: string;
    status: 'draft' | 'published' | 'archived';
    is_featured: boolean;

    categories: number[];
    sports: number[];

    seo_title?: string;
    seo_description?: string;
    canonical_url?: string;
    robots_index: boolean;
    robots_follow: boolean;
}