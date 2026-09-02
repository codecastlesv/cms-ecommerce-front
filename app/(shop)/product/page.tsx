import { permanentRedirect } from 'next/navigation';

/** Alias legacy → catálogo completo, servido por la misma ruta dinámica [slug] (categoría virtual "tienda"). */
export default function ProductLegacyRedirect() {
  permanentRedirect('/tienda');
}
