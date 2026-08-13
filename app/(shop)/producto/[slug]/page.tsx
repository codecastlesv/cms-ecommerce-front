import { permanentRedirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ slug: string }>;
}

/** Alias singular → ruta canónica /productos/[slug]. */
export default async function ProductoSingularRedirect({ params }: PageProps) {
  const { slug } = await params;
  permanentRedirect(`/productos/${slug}`);
}
