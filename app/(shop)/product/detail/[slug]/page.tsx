import { permanentRedirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ slug: string }>;
}

/** Redirección permanente desde la ruta legacy hacia /productos/[slug]. */
export default async function LegacyProductDetailRedirect({ params }: PageProps) {
  const { slug } = await params;
  permanentRedirect(`/productos/${slug}`);
}
