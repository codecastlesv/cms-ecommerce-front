import { LayoutGrid, ShieldCheck, Store, Truck } from 'lucide-react';
import type { ComponentType } from 'react';

interface TrustBadge {
    icon: ComponentType<{ className?: string; strokeWidth?: number }>;
    title: string;
    subtitle: string;
}

const BADGES: TrustBadge[] = [
    {
        icon: Truck,
        title: 'Envíos a todo\nEl Salvador',
        subtitle: 'Rápido y seguro',
    },
    {
        icon: Store,
        title: 'Retira en\nnuestras sucursales',
        subtitle: 'Tiempo 2 horas',
    },
    {
        icon: LayoutGrid,
        title: 'Compra en cuotas\nsin intereses',
        subtitle: 'Hasta 12 meses',
    },
    {
        icon: ShieldCheck,
        title: 'Garantía de calidad',
        subtitle: 'Productos 100% originales',
    },
];

export default function TrustBadges() {
    return (
        <div className="border-b border-slate-100 bg-slate-50">
            {/* 0-599px: fila deslizable con scroll-snap nativo (sin JS), con "peek" del siguiente
                card + degradado en el borde como única señal de "hay más" (sin puntos indicadores). */}
            <div className="relative min-[600px]:hidden">
                <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto py-6 pl-8 pr-6 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {BADGES.map((badge) => (
                        <div
                            key={badge.title}
                            className="flex w-[148px] shrink-0 snap-start flex-col items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-5 text-center"
                        >
                            <badge.icon className="h-7 w-7 text-[#304C94]" strokeWidth={1.75} />
                            <p className="font-helvetica text-[13px] font-bold leading-snug text-slate-900">
                                {badge.title.replace(/\n/g, ' ')}
                            </p>
                            <p className="text-[12px] leading-snug text-slate-500">{badge.subtitle}</p>
                        </div>
                    ))}
                </div>
                <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-slate-50 to-transparent" />
            </div>

            {/* >=600px: layout existente (2 columnas en tablet chico, 4 en desktop) */}
            <div className="mx-auto hidden max-w-[1440px] gap-y-6 px-6 py-6 sm:px-6 min-[600px]:grid min-[600px]:max-[767px]:grid-cols-2 md:grid-cols-4 md:gap-y-0 md:divide-x md:divide-slate-200 lg:px-10 xl:px-14">
                {BADGES.map((badge) => (
                    <div
                        key={badge.title}
                        className="flex flex-nowrap items-center gap-3 min-[768px]:max-[991px]:flex-wrap min-[768px]:max-[991px]:justify-center min-[768px]:max-[991px]:gap-y-1.5 min-[768px]:max-[991px]:text-center min-[992px]:justify-center min-[992px]:px-4"
                    >
                        <div className="flex shrink-0 items-center justify-center min-[768px]:max-[991px]:w-full">
                            <badge.icon
                                className="h-7 w-7 text-[#304C94] min-[1440px]:h-10! min-[1440px]:w-10!"
                                strokeWidth={1.75}
                            />
                        </div>
                        <div className="font-helvetica leading-snug">
                            <p className="whitespace-pre-line text-[13px] font-bold text-slate-900 sm:text-sm min-[1440px]:text-base!">
                                {badge.title}
                            </p>
                            <p className="text-[12px] text-slate-500 sm:text-sm min-[1440px]:text-base!">{badge.subtitle}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
