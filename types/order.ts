export interface OrderItem {
  name: string;
  sku: string;
  image: string;
  price: number;
  quantity: number;
  total: number;
  variant_attributes_json?: VariantAttribute;
  brand?: string | null;
  style_code?: string | null;
  price_regular: number;
  discount_percentage: number;
  price_sale: number;
}

export interface VariantAttribute{
  size: string;
  product_color: string;
}

import type { OrderStatusValue } from '@/utils/statusOrder';

export interface Order {
  id: number;
  uuid: string;
  number: string;
  status: OrderStatusValue | string;
  delivery_method?: 'shipping' | 'pickup' | string | null;
  pickup_store_id?: number | null;
  dispatch_store_id?: number | null;
  pickup_store?: OrderStoreRef | null;
  dispatch_store?: OrderStoreRef | null;
  subtotal: number;
  total: number;
  grand_total?: number;
  shipping_cost: number;
  tax: number;
  created_at: string;
  paid_at: string;
  document_type?: string | null;
  document_number?: string | null;
  brilo_client_code?: string | null;
  powertranz_transaction_id?: string | null;
  powertranz_order_id?: string | null;
  powertranz_status?: string | null;
  payment_method?: string | null;
  card_brand?: string | null;
  authorization_code?: string | null;
  /** Nombre resuelto para listados (user / dirección JSON / Invitado). */
  customer_name?: string | null;
  brilo_mfa_id?: number | string | null;
  /** Número de documento OFS en Brilo (ej. OF01392), desde mfaNumDoc de la respuesta. */
  brilo_mfa_num_doc?: string | null;
  brilo_mfa_num_referencia?: string | null;
  items: OrderItem[];
  shipping_address_json?: ShippingAddress;
  billing_address_json?: ShippingAddress;
  /** Crédito Fiscal: datos inyectados desde shipping.ccf o Brilo on-the-fly. */
  is_ccf?: boolean;
  needs_ccf?: boolean;
  ccf_razon_social?: string | null;
  ccf_nit?: string | null;
  ccf_nrc?: string | null;
  ccf_giro?: string | null;
  ccf_fiscal_address?: string | null;
  /** Origen de los datos fiscales en UI: Brilo ERP o checkout local. */
  billing_source?: 'brilo' | 'local' | null;
  user?: Customer;
}

export interface OrderStoreRef {
  id: number;
  name: string;
  alias?: string | null;
  code?: string;
  address?: string;
  city?: string;
  display_name?: string;
}

export interface ShippingAddress {
  recipient_name?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  phone?: string;
  email?: string;
  document_type?: string | null;
  document_number?: string | null;
  delivery_method?: string;
  pickup_store_name?: string;
  pickup_time_frame?: string;
}

export interface Customer {
  name: string;
  email?: string | null;
  phone?: string | null;
  profile?: CustomerProfile | null;
}

export interface CustomerProfile{
  phone?: string | null;
}


