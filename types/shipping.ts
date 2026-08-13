export interface ShippingRate {
  id: number;
  min_weight: number | string;
  max_weight: number | string | null;
  price: number | string;
  created_at?: string;
  updated_at?: string;
}
