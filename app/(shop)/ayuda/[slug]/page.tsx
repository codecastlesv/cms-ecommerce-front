import Link from 'next/link';
import { notFound } from 'next/navigation';
import api from '@/lib/axios';

interface HelpPageData {
  title: string;
  slug: string;
  body: string;
  meta_title: string | null;
  meta_description: string | null;
  show_toc: boolean;
}

interface Heading {
  id: string;
  text: string;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/** Inyecta un id único en cada <h3> del cuerpo guardado, para poder saltar desde el índice lateral. */
function injectHeadingIds(html: string): { html: string; headings: Heading[] } {
  const headings: Heading[] = [];
  const used = new Set<string>();

  const result = html.replace(/<h3([^>]*)>([\s\S]*?)<\/h3>/g, (_match, attrs: string, inner: string) => {
    const text = inner.replace(/<[^>]+>/g, '').trim();
    const base = slugify(text) || 'seccion';
    let id = base;
    let n = 2;
    while (used.has(id)) {
      id = `${base}-${n}`;
      n++;
    }
    used.add(id);
    headings.push({ id, text });
    return `<h3${attrs} id="${id}">${inner}</h3>`;
  });

  return { html: result, headings };
}

async function getHelpPage(slug: string): Promise<HelpPageData | null> {
  try {
    const { data } = await api.get<{ data: HelpPageData }>(`/shop/help-pages/${slug}`);
    return data.data;
  } catch {
    return null;
  }
}

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const page = await getHelpPage(slug);

  if (!page) return { title: 'Página no encontrada' };

  return {
    title: page.meta_title || page.title,
    description: page.meta_description || undefined,
  };
}

export default async function HelpPageDetail({ params }: PageProps) {
  const { slug } = await params;
  const page = await getHelpPage(slug);

  if (!page) notFound();

  const { html, headings } = injectHeadingIds(page.body || '');
  const showToc = page.show_toc && headings.length > 0;

  return (
    <section className="bg-[#fcfcfc]">
      <div className="bg-[#08204E] px-4 py-8 sm:py-10">
        <div className="mx-auto max-w-[1100px]">
          <p className="mb-2 font-helvetica text-[12px] text-[#9DB2E0]">
            <Link href="/" className="hover:underline">Inicio</Link>
            {' / '}
            <Link href="/ayuda" className="hover:underline">Ayuda</Link>
            {' / '}
            <span className="text-white">{page.title}</span>
          </p>
          <h1 className="font-helvetica text-[26px] font-bold text-white sm:text-[32px]">{page.title}</h1>
        </div>
      </div>

      <div
        className={`mx-auto max-w-[1100px] gap-8 px-4 py-8 sm:py-10 ${
          showToc ? 'lg:grid lg:grid-cols-[200px_1fr]' : ''
        }`}
      >
        {showToc ? (
          <aside className="mb-6 hidden lg:block">
            <div className="sticky top-6">
              <p className="mb-2.5 font-helvetica text-[10.5px] font-bold uppercase tracking-wide text-slate-400">
                En esta página
              </p>
              <nav className="space-y-0.5">
                {headings.map((h) => (
                  <a
                    key={h.id}
                    href={`#${h.id}`}
                    className="block border-l-2 border-slate-200 py-1.5 pl-3 font-helvetica text-[13px] text-slate-600 transition hover:border-[#E30613] hover:text-[#08204E]"
                  >
                    {h.text}
                  </a>
                ))}
              </nav>
            </div>
          </aside>
        ) : null}

        <div className="help-article font-helvetica" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </section>
  );
}
