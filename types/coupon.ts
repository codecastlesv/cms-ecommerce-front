export type Coupon = {
  id: number;
  code: string;
  percentage: number;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  created_at: string;
};