import Link from 'next/link';
import { FileText, HelpCircle, Lock, ShieldCheck, Truck, Undo2, type LucideIcon } from 'lucide-react';
import api from '@/lib/axios';

interface HelpPageSummary {
  slug: string;
  title: string;
  meta_description: string | null;
  show_toc: boolean;
}

const ICONS: Record<string, LucideIcon> = {
  'envios-y-entregas': Truck,
  'devoluciones': Undo2,
  'garantias': ShieldCheck,
  'terminos-y-condiciones': FileText,
  'politicas-de-privacidad': Lock,
};

export const metadata = {
  title: 'Centro de Ayuda | Castella Sagarra',
  description: 'Envíos, devoluciones, garantías y políticas de tu compra en Ferretería Castella Sagarra.',
};

async function getHelpPages(): Promise<HelpPageSummary[]> {
  try {
    const { data } = await api.get<{ data: HelpPageSummary[] }>('/shop/help-pages');
    return data.data;
  } catch {
    return [];
  }
}

export default async function HelpIndexPage() {
  const pages = await getHelpPages();

  return (
    <section className="bg-[#fcfcfc]">
      <div className="bg-[#08204E] px-4 py-10 text-center text-white sm:py-12">
        <p className="mb-2.5 font-helvetica text-xs font-bold uppercase tracking-[0.14em] text-[#9DB2E0]">
          Ayuda y soporte
        </p>
        <h1 className="font-helvetica text-[28px] font-bold leading-tight sm:text-[34px]">Centro de Ayuda</h1>
        <p className="mx-auto mt-3 max-w-[520px] font-helvetica text-[15px] leading-relaxed text-[#C7D3EC]">
          Todo lo que necesitas saber sobre tus compras: envíos, devoluciones, garantías y políticas del sitio.
        </p>
      </div>

      <div className="mx-auto -mt-7 max-w-[1100px] px-4 pb-16">
        {pages.length === 0 ? (
          <p className="rounded-2xl border border-slate-200 bg-white p-8 text-center font-helvetica text-sm text-slate-500 shadow-[0_20px_60px_-30px_rgba(8,32,78,0.35)]">
            No hay páginas de ayuda disponibles por el momento.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pages.map((page) => {
              const Icon = ICONS[page.slug] || HelpCircle;
              return (
                <Link
                  key={page.slug}
                  href={`/ayuda/${page.slug}`}
                  className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_14px_40px_-28px_rgba(8,32,78,0.3)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_50px_-28px_rgba(8,32,78,0.4)] sm:p-6"
                >
                  <div className="mb-3.5 flex h-11 w-11 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#304C94]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="mb-1.5 font-helvetica text-[16px] font-bold text-[#0F172A]">{page.title}</p>
                  {page.meta_description ? (
                    <p className="mb-3 font-helvetica text-[13px] leading-relaxed text-slate-500">
                      {page.meta_description}
                    </p>
                  ) : null}
                  <span className="font-helvetica text-[12.5px] font-bold text-[#E30613]">Ver más →</span>
                </Link>
              );
            })}
          </div>
        )}

        <div className="mt-6 flex flex-col items-start gap-3 rounded-2xl border border-slate-200 bg-[#F8FAFC] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <p className="font-helvetica text-[15px] font-bold text-[#0F172A]">¿No encontraste lo que buscabas?</p>
            <p className="font-helvetica text-[13px] text-slate-500">Escríbenos directamente y te ayudamos a resolverlo.</p>
          </div>
          <Link
            href="/contactanos"
            className="inline-flex w-full items-center justify-center rounded-md bg-[#E30613] px-5 py-2.5 font-helvetica text-[13px] font-bold uppercase tracking-[0.02em] text-white transition hover:brightness-105 sm:w-auto"
          >
            Contáctanos
          </Link>
        </div>
      </div>
    </section>
  );
}
