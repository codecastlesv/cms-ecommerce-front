/**
 * Snapshot de pedido post-confirmación (sessionStorage) para UI optimista en /checkout/success.
 * Evita el spinner "Cargando detalles…" mientras llega el GET /shop/orders/{uuid}.
 */

export const CHECKOUT_SUCCESS_CACHE_KEY = 'galaxia_checkout_success_order';

export type CheckoutSuccessOrderSnapshot = {
  uuid?: string;
  number?: string;
  status?: string;
  total?: string | number;
  created_at?: string;
  delivery_method?: string | null;
  shipping_address_json?: Record<string, unknown> | null;
  pickup_store?: Record<string, unknown> | null;
  dispatch_store?: Record<string, unknown> | null;
  last_payment_message?: string | null;
  card_brand?: string | null;
};

export function saveCheckoutSuccessSnapshot(
  orderId: string,
  order: CheckoutSuccessOrderSnapshot | null | undefined
): void {
  if (typeof window === 'undefined' || !orderId || !order) return;
  try {
    sessionStorage.setItem(
      CHECKOUT_SUCCESS_CACHE_KEY,
      JSON.stringify({ orderId, order, savedAt: Date.now() })
    );
  } catch {
    // quota / private mode
  }
}

export function readCheckoutSuccessSnapshot(
  orderId: string
): CheckoutSuccessOrderSnapshot | null {
  if (typeof window === 'undefined' || !orderId) return null;
  try {
    const raw = sessionStorage.getItem(CHECKOUT_SUCCESS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      orderId?: string;
      order?: CheckoutSuccessOrderSnapshot;
      savedAt?: number;
    };
    if (parsed.orderId !== orderId || !parsed.order) return null;
    // TTL 15 min
    if (typeof parsed.savedAt === 'number' && Date.now() - parsed.savedAt > 15 * 60 * 1000) {
      sessionStorage.removeItem(CHECKOUT_SUCCESS_CACHE_KEY);
      return null;
    }
    return parsed.order;
  } catch {
    return null;
  }
}

export function clearCheckoutSuccessSnapshot(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(CHECKOUT_SUCCESS_CACHE_KEY);
  } catch {
    // ignore
  }
}
