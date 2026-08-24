import api from '@/lib/axios';
import HomePageContent from '@/components/shop/home/HomePageContent';

export const revalidate = 120;

async function getFeaturedData() {
    try {
        const [productsResponse, categoriesResponse, brandsResponse] = await Promise.all([
            api.get('/shop/home').catch(() => null),
            api.get('/shop/categories').catch(() => null),
            api.get('/shop/brands').catch(() => null),
        ]);

        const products = productsResponse?.data?.data || productsResponse?.data || [];
        const categories = categoriesResponse?.data?.data || categoriesResponse?.data || [];
        const brands = brandsResponse?.data?.data || brandsResponse?.data || [];

        return { products, categories, brands };
    } catch {
        return { products: [], categories: [], brands: [] };
    }
}

export default async function HomePage() {
    const [bannersData, { products, categories, brands }] = await Promise.all([
        api.get('/shop/banners?page=home').then((response) => response.data).catch(() => ({})),
        getFeaturedData(),
    ]);

    const heroItems = bannersData.home_hero_slider?.items || [];
    const featuredMain = bannersData.home_featured_main?.items || [];
    const featuredSecondary = bannersData.home_featured_secondary?.items || [];
    const featuredByCategory = bannersData.home_featured_by_category?.items || [];

    return (

        <HomePageContent
            heroItems={heroItems}
            categories={categories}
            products={products}
            brands={brands}
            featuredMain={featuredMain}
            featuredSecondary={featuredSecondary}
            featuredByCategory={featuredByCategory}
        />

    );
}