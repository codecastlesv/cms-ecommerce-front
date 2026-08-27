import { Headphones, Package, ShieldCheck } from 'lucide-react';
import type { ComponentType } from 'react';

interface Benefit {
    icon: ComponentType<{ className?: string; strokeWidth?: number }>;
    title: string;
    subtitle: string;
}

const BENEFITS: Benefit[] = [
    {
        icon: Headphones,
        title: 'Asesoría experta',
        subtitle: 'Te ayudamos a elegir lo que necesitas',
    },
    {
        icon: Package,
        title: 'Más de 20,000 productos',
        subtitle: 'En cuenta todo en ferretería y construcción',
    },
    {
        icon: ShieldCheck,
        title: 'Seguridad en tu compra',
        subtitle: 'Pago seguro en tus métodos de pago',
    },
];

export default function BenefitsStrip() {
    return (
        <div className="border-b border-slate-100 bg-slate-50">
            <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-y-6 px-6 py-6 sm:px-6 md:grid-cols-3 md:gap-y-0 md:divide-x md:divide-slate-200 lg:px-10 xl:px-14">
                {BENEFITS.map((benefit) => (
                    <div
                        key={benefit.title}
                        className="flex flex-nowrap items-center gap-3 min-[768px]:max-[991px]:flex-wrap min-[768px]:max-[991px]:justify-center min-[768px]:max-[991px]:gap-y-1.5 min-[768px]:max-[991px]:text-center min-[992px]:justify-center min-[992px]:px-4"
                    >
                        <div className="flex shrink-0 items-center justify-center min-[768px]:max-[991px]:w-full">
                            <benefit.icon
                                className="h-7 w-7 text-[#304C94] min-[1440px]:h-10! min-[1440px]:w-10!"
                                strokeWidth={1.75}
                            />
                        </div>
                        <div className="font-helvetica leading-snug">
                            <p className="text-[13px] font-bold text-slate-900 sm:text-sm min-[1440px]:text-base!">
                                {benefit.title}
                            </p>
                            <p className="text-[12px] text-slate-500 sm:text-sm min-[1440px]:text-base!">{benefit.subtitle}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
