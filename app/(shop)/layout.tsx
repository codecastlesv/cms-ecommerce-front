import Footer from '@/components/shop/Footer';
import Header from '@/components/shop/Header';

import { getPublicSettings } from '@/lib/public-api';

export async function generateMetadata() {
    const settings = await getPublicSettings();
    return {
        title: settings?.seo_title || 'Galaxia Deportes',
        description: settings?.seo_description || 'Tienda de deportes online',
    };
}

export default async function ShopLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const settings = await getPublicSettings();

    return (
    <div className="shop-layout-root min-h-screen bg-white flex flex-col font-sans text-slate-900 selection:bg-black selection:text-white">

            <div className="sticky top-0 z-50 bg-white">
                <Header settings={settings} />
            </div>

            <main className="flex-grow">
                {children}
            </main>
            
            <Footer />

        </div>
    );
}