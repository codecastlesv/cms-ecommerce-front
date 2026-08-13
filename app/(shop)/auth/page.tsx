import { redirect } from 'next/navigation';

/** El acceso es por el panel lateral (Header). Mantenemos la ruta por compatibilidad con enlaces viejos. */
export default function ShopAuthRedirectPage() {
  redirect('/');
}
