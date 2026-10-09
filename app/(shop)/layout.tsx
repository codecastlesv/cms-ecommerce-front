import Script from 'next/script';
import Footer from '@/components/shop/Footer';
import Header from '@/components/shop/Header';

import { getPublicSettings } from '@/lib/public-api';

export async function generateMetadata() {
    const settings = await getPublicSettings();
    const title = settings?.seo_title || 'Castella Sagarra';
    const description = settings?.seo_description || 'Tienda online';
    const ogTitle = settings?.og_title || title;
    const ogDescription = settings?.og_description || description;

    return {
        title,
        description,
        openGraph: {
            title: ogTitle,
            description: ogDescription,
            images: settings?.og_image_url ? [{ url: settings.og_image_url, width: 1200, height: 630 }] : [],
            type: 'website',
        },
    };
}

export default async function ShopLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const settings = await getPublicSettings();
    const gaId = settings?.ga_measurement_id;

    return (
    <div className="shop-layout-root flex min-h-screen min-w-0 w-full flex-col overflow-x-clip bg-white font-sans text-slate-900 selection:bg-black selection:text-white">

            {gaId ? (
                <>
                    <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
                    <Script id="ga-init" strategy="afterInteractive">
                        {`
                            window.dataLayer = window.dataLayer || [];
                            function gtag(){dataLayer.push(arguments);}
                            gtag('js', new Date());
                            gtag('config', '${gaId}');
                        `}
                    </Script>
                </>
            ) : null}

            <div className="sticky top-0 z-50 min-w-0 w-full overflow-x-clip bg-white">
                <Header settings={settings as Record<string, unknown> | null} />
            </div>

            <main className="min-w-0 flex-grow">
                {children}
            </main>

            <Footer />

        </div>
    );
}
