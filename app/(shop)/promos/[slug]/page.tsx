import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import api from '@/lib/axios';
import ProductCard from '@/components/shop/product/ProductCard';
import CampaignCountdown from '@/components/shop/campaigns/CampaignCountdown';

interface CampaignData {
  name: string;
  slug: string;
  banner_image_url: string | null;
  promo_title: string | null;
  promo_description: string | null;
  starts_at: string | null;
  ends_at: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image_url: string | null;
}

interface CampaignProduct {
  id: number;
  name: string;
  slug: string;
  sku: string | null;
  price_regular: number;
  sale_price: number | null;
  stock_quantity: number;
  main_image_url: string | null;
  brand_name: string | null;
}

interface ProductsMeta {
  current_page: number;
  last_page: number;
  from: number | null;
  to: number | null;
  total: number;
}

interface CampaignResponse {
  data: CampaignData;
  products: {
    data: CampaignProduct[];
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
  };
}

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function getCampaign(slug: string, page: string | undefined): Promise<CampaignResponse | null> {
  try {
    const { data } = await api.get<CampaignResponse>(`/shop/campaigns/${slug}`, {
      params: page ? { page } : undefined,
    });
    return data;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const result = await getCampaign(slug, undefined);

  if (!result) {
    return { title: 'Promoción no disponible' };
  }

  const { data: campaign } = result;
  const title = campaign.og_title || campaign.promo_title || campaign.name;
  const description = campaign.og_description || campaign.promo_description || undefined;
  const image = campaign.og_image_url || campaign.banner_image_url;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: image ? [{ url: image, width: 1200, height: 630 }] : [],
      type: 'website',
    },
  };
}

function buildPageUrl(
  slug: string,
  searchParams: Record<string, string | string[] | undefined>,
  targetPage: number,
): string {
  const qs = new URLSearchParams();
  Object.entries(searchParams).forEach(([key, value]) => {
    if (key === 'page' || value === undefined) return;
    qs.set(key, Array.isArray(value) ? value[0] : value);
  });
  if (targetPage > 1) qs.set('page', String(targetPage));
  const query = qs.toString();
  return `/promos/${slug}${query ? `?${query}` : ''}`;
}

export default async function CampaignLandingPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const pageParam = typeof sp.page === 'string' ? sp.page : undefined;

  const result = await getCampaign(slug, pageParam);

  if (!result) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
          <AlertTriangle className="h-7 w-7 text-red-500" />
        </div>
        <h1 className="font-helvetica text-[20px] font-bold text-slate-900">
          Esta promoción ya no está disponible.
        </h1>
        <p className="max-w-md font-helvetica text-sm text-slate-500">
          Puede que haya finalizado o que el enlace ya no sea válido. Visita la tienda para seguir comprando.
        </p>
        <Link
          href="/tienda"
          className="mt-2 inline-flex items-center rounded-full bg-[#08204E] px-6 py-3 font-helvetica text-sm font-semibold text-white transition hover:opacity-90"
        >
          Ir a la tienda
        </Link>
      </div>
    );
  }

  const { data: campaign, products } = result;

  return (
    <section className="bg-[#fcfcfc]">
      <div className="relative h-[300px] overflow-hidden sm:h-[340px]">
        {campaign.banner_image_url ? (
          <img src={campaign.banner_image_url} alt={campaign.name} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-[#304C94] to-[#08204E]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-[#08204E]/10 via-transparent to-[#08204E]/45" />
        <div className="absolute inset-x-0 bottom-0 h-[62%] bg-gradient-to-t from-[#08204E]/35 to-transparent backdrop-blur-[2px]" />

        {campaign.ends_at ? <CampaignCountdown endsAt={campaign.ends_at} /> : null}

        <div className="absolute inset-0 z-[2] flex flex-col justify-end pb-6 sm:pb-8">
          <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-10 xl:px-14">
            <div className="max-w-2xl">
              <p className="mb-2 font-helvetica text-xs font-bold uppercase tracking-[0.14em] text-[#C7D3EC] [text-shadow:0_1px_6px_rgba(0,0,0,0.55)]">
                Oferta por tiempo limitado
              </p>
              <h1 className="mb-2 text-balance font-helvetica text-[28px] font-bold leading-tight text-white [text-shadow:0_2px_12px_rgba(0,0,0,0.6)] sm:text-[36px] lg:text-[44px]">
                {campaign.promo_title || campaign.name}
              </h1>
              {campaign.promo_description ? (
                <p className="font-helvetica text-[14.5px] text-[#DCE4F5] [text-shadow:0_1px_6px_rgba(0,0,0,0.55)] lg:text-base">
                  {campaign.promo_description}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1100px] px-4 py-8 sm:px-6">
        <h2 className="mb-5 font-helvetica text-xl font-bold text-black">Productos en promoción</h2>

        {products.data.length === 0 ? (
          <p className="font-helvetica text-sm text-slate-500">
            Todavía no hay productos publicados en esta promoción.
          </p>
        ) : (
          <div className="grid w-full min-w-0 grid-cols-2 items-start gap-2 sm:gap-4 lg:grid-cols-3 lg:gap-4">
            {products.data.map((product) => (
              <ProductCard
                key={product.id}
                product={{
                  ...product,
                  brand_name: product.brand_name ?? undefined,
                  sku: product.sku ?? undefined,
                  main_image_url: product.main_image_url ?? undefined,
                }}
              />
            ))}
          </div>
        )}

        {products.last_page > 1 ? (
          <div className="mt-6 flex items-center justify-center gap-4">
            <Link
              href={buildPageUrl(slug, sp, products.current_page - 1)}
              aria-disabled={products.current_page <= 1}
              className={`rounded-md border border-gray-200 px-4 py-2 font-helvetica text-[12px] font-bold uppercase tracking-wide transition hover:border-black ${
                products.current_page <= 1 ? 'pointer-events-none opacity-30' : ''
              }`}
            >
              Anterior
            </Link>
            <span className="font-helvetica text-[12px] font-medium text-gray-500">
              Página {products.current_page} de {products.last_page}
            </span>
            <Link
              href={buildPageUrl(slug, sp, products.current_page + 1)}
              aria-disabled={products.current_page >= products.last_page}
              className={`rounded-md border border-gray-200 px-4 py-2 font-helvetica text-[12px] font-bold uppercase tracking-wide transition hover:border-black ${
                products.current_page >= products.last_page ? 'pointer-events-none opacity-30' : ''
              }`}
            >
              Siguiente
            </Link>
          </div>
        ) : null}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[#08204E] px-6 py-5 text-white">
          <p className="font-helvetica text-sm text-[#C7D3EC]">
            ¿Buscas algo que no está aquí? Explora el catálogo completo.
          </p>
          <Link
            href="/tienda"
            className="rounded-md bg-[#E30613] px-5 py-2.5 font-helvetica text-[13px] font-bold uppercase tracking-[0.02em] text-white transition hover:brightness-105"
          >
            Ver toda la tienda
          </Link>
        </div>
      </div>
    </section>
  );
}
