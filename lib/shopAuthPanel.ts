/** Evento global para abrir el drawer de cuenta del Header sin acoplar estado entre componentes. */

export const SHOP_OPEN_AUTH_PANEL_EVENT = "galaxia:shop-open-auth-panel" as const;

export function openShopAuthPanel(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(SHOP_OPEN_AUTH_PANEL_EVENT));
}
