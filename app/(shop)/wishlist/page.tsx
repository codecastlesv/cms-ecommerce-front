"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProductCard from '@/components/shop/product/ProductCard';
import api from '@/lib/axios';
import { AiOutlineHeart } from 'react-icons/ai';

interface FavoriteProduct {
  id: string | number;
  name: string;
  brand: string;
  description: string;
  price: number;
  images: string[];
  is_new: boolean;
  colors_count: number;
  slug: string;
  seo_url?: string;
  variant_sku?: string;
  product_color?: string;
}

export default function WishlistPage() {
  const router = useRouter();
  const [favoriteProducts, setFavoriteProducts] = useState<FavoriteProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const shopToken = typeof window !== 'undefined' ? localStorage.getItem('shop_token') : null;

    if (!shopToken) {
      router.replace('/');
      return;
    }

    const fetchFavorites = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get('/shop/favorites');
        const payload = response.data;
        const favorites = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];

        const products = favorites
          .map((favorite: unknown) => {
            const favoriteData = favorite as { product?: unknown; id?: string | number };
            const product = (favoriteData?.product ?? favoriteData) as {
              id?: string | number;
              name?: string;
              brand?: string;
              category?: string;
              short_description?: string;
              sale_price?: number;
              price?: number;
              images?: Array<string | { url?: string | null } | null>;
              image?: string;
              is_featured?: boolean;
              product_color?: string;
              slug?: string;
              seo_url?: string;
              variant_sku?: string;
            };
            if (!product?.id) {
              return null;
            }

            const productImages = Array.isArray(product.images)
              ? product.images.map((item) => {
                  if (typeof item === 'string') return item;
                  return item?.url ?? null;
                }).filter(Boolean)
              : product.image
              ? [product.image]
              : [];

            return {
              id: product.id,
              name: product.name ?? 'Producto sin nombre',
              brand: product.brand ?? 'Castella',
              description: product.category ?? product.short_description ?? '',
              price: product.sale_price ?? product.price ?? 0,
              images: productImages,
              is_new: Boolean(product.is_featured),
              colors_count: product.product_color ? 1 : 0,
              slug: product.slug ?? '',
              seo_url: product.seo_url,
              variant_sku: product.variant_sku,
              product_color: product.product_color,
            } as FavoriteProduct;
          })
          .filter(Boolean);

        setFavoriteProducts(products);
      } catch (fetchError) {
        console.error('Error cargando favoritos:', fetchError);
        setError('No se pudieron cargar tus favoritos. Intenta nuevamente.');
        setFavoriteProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [router]);

  return (
    <div className="max-w-350 mx-auto py-10">
      <div className="mb-8  px-60">
        <h1 className="text-3xl font-bold tracking-tight">Mis favoritos</h1>
        <p className="mt-2 text-sm text-slate-600">Aquí verás tus productos favoritos guardados en tu cuenta.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 px-60">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="relative w-64 h-120 mx-auto bg-white">
              <div className="absolute top-0 left-0 w-full bg-white border border-transparent p-2 animate-pulse">
                <div className="relative h-65 w-full overflow-hidden bg-gray-100 rounded-sm" />

                <div className="mt-4 pb-2 bg-white space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 flex-1">
                      <div className="h-4 w-14 rounded bg-gray-100" />
                      <div className="h-3 w-16 rounded bg-gray-100" />
                      <div className="h-5 w-44 rounded bg-gray-100" />
                      <div className="h-3 w-36 rounded bg-gray-100" />
                      <div className="h-3 w-20 rounded bg-gray-100" />
                    </div>

                    <div className="h-6 w-14 rounded bg-gray-100 ml-2" />
                  </div>
                </div>

                <div className="mt-6">
                  <div className="w-full py-4 h-14 rounded-xl bg-gray-100" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
          {error}
        </div>
      ) : favoriteProducts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 p-10 text-center">
          <AiOutlineHeart className="mx-auto mb-4 h-12 w-12 text-slate-400" />
          <h2 className="text-xl font-semibold">No tienes favoritos aún</h2>
          <p className="mt-2 text-slate-500">Visita la tienda y toca el corazón para agregar tus productos favoritos.</p>
          <button
            type="button"
            onClick={() => router.push('/product')}
            className="mt-6 inline-flex items-center justify-center rounded-md bg-black px-6 py-3 text-sm font-semibold text-white hover:bg-slate-900 transition"
          >
            Ver productos
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 px-60">
          {favoriteProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
