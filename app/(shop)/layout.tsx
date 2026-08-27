import Footer from '@/components/shop/Footer';
import Header from '@/components/shop/Header';

import { getPublicSettings } from '@/lib/public-api';

export async function generateMetadata() {
    const settings = await getPublicSettings();
    return {
        title: settings?.seo_title || 'Castella Sagarra',
        description: settings?.seo_description || 'Tienda online',
    };
}

export default async function ShopLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const settings = await getPublicSettings();

    return (
    <div className="shop-layout-root flex min-h-screen min-w-0 w-full flex-col overflow-x-clip bg-white font-sans text-slate-900 selection:bg-black selection:text-white">

            <div className="sticky top-0 z-50 min-w-0 w-full overflow-x-clip bg-white">
                <Header settings={settings} />
            </div>

            <main className="min-w-0 flex-grow">
                {children}
            </main>
            
            <Footer />

        </div>
    );
}