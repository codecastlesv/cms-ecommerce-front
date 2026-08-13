export interface CustomerAddress {
    id: number;
    recipient_name: string;
    name: string;
    type: 'shipping' | 'billing';
    phone?: string;
    details: {
        line1: string;
        line2?: string;
        city: string;
        state: string;
        country: string;
        zip_code: string;
    };
    formatted: string;
    is_default: boolean;
    instructions: string;
}

export interface CustomerProfile {
    id: number;
    name: string;
    email: string;
    phone?: string;
    birth_date?: string;
    marketing_opt_in: boolean;
    document_type?: string | null;
    document_number?: string | null;
    billing?: {
        tax_id?: string;
        legal_name?: string;
    };
    /** cliNumero Brilo — Consumidor Final (DUI): CLI-WEB-{DUI} */
    brilo_client_code?: string | null;
    brilo_client_number?: string | null;
    /** cliNumero Brilo — Crédito Fiscal (NIT): CLI-WEB-{NIT} */
    brilo_ccf_client_code?: string | null;
    /** On-the-fly desde Brilo (no persistidos en BD). */
    ccf_razon_social?: string | null;
    ccf_nit?: string | null;
    avatar?: string;
}