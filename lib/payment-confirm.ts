/**
 * Cuerpo `data` de POST /api/shop/payments/confirm cuando la transacción queda aprobada y la orden está identificada.
 * `order_id` es el UUID público de la orden (nombre de campo histórico).
 * `order` es un snapshot local opcional para UI optimista en /checkout/success.
 */
export interface PaymentConfirmSuccessData {
  Approved: true;
  order_id: string;
  order?: Record<string, unknown> | null;
}

const UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export function isUuidString(value: unknown): value is string {
  return typeof value === 'string' && UUID_REGEX.test(value);
}

export function isValidSuccessPayload(data: unknown): data is PaymentConfirmSuccessData {
  if (data === null || typeof data !== 'object') {
    return false;
  }
  const o = data as Record<string, unknown>;
  if (o.Approved !== true) {
    return false;
  }
  return isUuidString(o.order_id);
}
