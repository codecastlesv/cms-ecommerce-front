import api from '@/lib/axios';
import MarcasPageContent from '@/components/shop/marcas/MarcasPageContent';

export const revalidate = 120;

interface MarcasPageProps {
  searchParams: Promise<{ search?: string; letter?: string; page?: string }>;
}

export default async function MarcasPage({ searchParams }: MarcasPageProps) {
  const params = await searchParams;

  const [bannersData, contentBlocksData, brandsResponse] = await Promise.all([
    api.get('/shop/banners?page=marcas').then((response) => response.data).catch(() => ({})),
    api.get('/shop/content-blocks?page=marcas').then((response) => response.data).catch(() => ({})),
    api
      .get('/shop/brands', {
        params: {
          per_page: 18,
          page: params.page || undefined,
          search: params.search || undefined,
          letter: params.letter || undefined,
        },
      })
      .then((response) => response.data)
      .catch(() => null),
  ]);

  const heroItems = bannersData.brands_hero?.items || [];
  const highlights = contentBlocksData.brands_highlights?.items || [];
  const initialBrands = brandsResponse?.data || [];
  const initialMeta = brandsResponse?.meta || { current_page: 1, last_page: 1, per_page: 18, total: 0, from: 0, to: 0 };

  return (
    <MarcasPageContent
      heroItems={heroItems}
      highlights={highlights}
      initialBrands={initialBrands}
      initialMeta={initialMeta}
    />
  );
}
