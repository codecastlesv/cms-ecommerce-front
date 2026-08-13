/**
 * Carrito de la tienda: persistido en localStorage bajo la clave `cart`.
 * Los componentes escuchan el evento `cartUpdated` para refrescar el badge / preview.
 */

export const CART_STORAGE_KEY = 'cart';
export const CART_UPDATED_EVENT = 'cartUpdated';

export function readCartRaw(): unknown[] {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const raw = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

/** Vacía el carrito en localStorage y notifica a la UI (icono, preview, etc.). */
export function clearCart(): void {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.removeItem(CART_STORAGE_KEY);
  localStorage.setItem(CART_STORAGE_KEY, '[]');
  window.dispatchEvent(new Event(CART_UPDATED_EVENT));
}
