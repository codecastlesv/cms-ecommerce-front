/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from 'next/link';
import FadeReveal from '@/components/shop/animations/FadeReveal';

interface FeaturedByCategoryProps {
    items: any[];
}

const FALLBACK_BG = '#0B2340';

function resolveBgColor(item: any): string {
    const raw = item?.style?.bg_color || item?.bg_color;
    return typeof raw === 'string' && raw.trim() ? raw.trim() : FALLBACK_BG;
}

export default function FeaturedByCategory({ items }: FeaturedByCategoryProps) {
    const cards = items.slice(0, 3);

    if (cards.length === 0) return null;

    return (
        <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
                {cards.map((item, index) => {
                    const bgColor = resolveBgColor(item);
                    const href = item.cta?.url || '#';
                    const isLast = index === cards.length - 1;

                    return (
                        <FadeReveal
                            key={item.id}
                            delay={0.08 + index * 0.12}
                            duration={0.9}
                            y={12}
                            scale={0.996}
                            className={`group relative aspect-2/1 w-full overflow-hidden rounded-[1.4rem] transition-all duration-300 hover:-translate-y-1 ${
                                isLast ? 'sm:col-span-2 lg:col-span-1' : ''
                            }`}
                            style={{ backgroundColor: bgColor }}
                        >
                            <Link
                                href={href}
                                target={item.cta?.new_tab ? '_blank' : '_self'}
                                className="absolute inset-0 block"
                            >
                                {item.image_url ? (
                                    <img
                                        src={item.image_url}
                                        alt={item.alt_text || item.headline || item.title || ''}
                                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                ) : null}
                            </Link>
                        </FadeReveal>
                    );
                })}
            </div>
        </div>
    );
}
