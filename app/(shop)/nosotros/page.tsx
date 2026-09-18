import api from '@/lib/axios';
import NosotrosPageContent from '@/components/shop/nosotros/NosotrosPageContent';

export const revalidate = 120;

export default async function NosotrosPage() {
  const [bannersData, contentBlocksData, brandsResponse] = await Promise.all([
    api.get('/shop/banners?page=about').then((response) => response.data).catch(() => ({})),
    api.get('/shop/content-blocks?page=about').then((response) => response.data).catch(() => ({})),
    api.get('/shop/brands?per_page=10').catch(() => null),
  ]);

  const heroItems = bannersData.about_hero?.items || [];
  const values = contentBlocksData.about_values?.items || [];
  const stats = contentBlocksData.about_stats?.items || [];
  const timelineIntro = contentBlocksData.about_timeline?.intro_text || '';
  const timeline = contentBlocksData.about_timeline?.items || [];
  const brands = brandsResponse?.data?.data || brandsResponse?.data || [];

  return (
    <NosotrosPageContent
      heroItems={heroItems}
      values={values}
      stats={stats}
      timelineIntro={timelineIntro}
      timeline={timeline}
      brands={brands}
    />
  );
}
