/** Origen visible de la tienda en local. Nunca usar el host de ngrok. */
export const SHOP_PUBLIC_ORIGIN = (
  process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
).replace(/\/$/, '');
