import Link from 'next/link';
import api from "@/lib/axios";

// Función para obtener los datos del endpoint
async function getStarcardData() {
    try {
        const response = await api.get('/shop/contents/star-card');
        return response.data?.data || null;
    } catch (err) {
        console.error("Error fetching Starcard data:", err);
        return null;
    }
}

export default async function StarcardPage() {
    const pageData = await getStarcardData();

    if (!pageData) return null;

    const { content } = pageData;
    const logoItems = Array(12).fill(0); // Para el Marquee

    return (
        <div className="min-h-screen bg-white text-slate-950">
            {/* --- HERO SECTION ORIGINAL --- */}
            <section className="relative flex min-h-[620px] items-center overflow-hidden bg-slate-100 py-20 sm:min-h-[700px] lg:min-h-[760px]">
                {/* Imagen de Fondo Dinámica */}
                <div className="absolute inset-0 z-0">
                    <img
                        src={content["seccion banner"].imagen_fondo}
                        alt="Background Starcard"
                        className="w-full h-full object-cover opacity-60"
                    />
                    <div className="absolute inset-0  z-10" />
                </div>

                <div className="relative z-20 mx-auto max-w-7xl px-4 sm:px-6 lg:px-6">
                    <div className="grid gap-8 sm:gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                        <div className="space-y-4 rounded-2xl p-4 sm:p-6 md:space-y-6 md:p-10 text-black">
                            <h1 className="font-bebas font-normal uppercase text-[28px] sm:text-[36px] md:text-[48px]">
                                {content["seccion banner"].titulo}
                            </h1>
                            <h2 className="font-oswald max-w-2xl text-[14px] sm:text-[16px] md:text-[16px] lg:text-[18px] font-medium leading-7 md:leading-8">
                                {content["seccion banner"].subtitulo}
                            </h2>

                            <p className="font-inter max-w-2xl text-[14px] sm:text-[16px] md:text-[16px] lg:text-[18px] font-normal leading-7 md:leading-8 text-justify sm:text-left">
                                {content["seccion banner"].descripcion}
                            </p>
                            <Link
                                href={content["seccion banner"].url_boton}
                                className="font-inter inline-flex rounded-sm bg-black px-8 py-4 text-sm font-semibold  md:text-[18px] tracking-[0.18] text-white transition hover:bg-zinc-800"
                            >
                                {content["seccion banner"].texto_boton}
                            </Link>
                        </div>

                        {/* Visual de la Imagen Derecha (Tarjeta) */}
                        <div className="aspect-square overflow-hidden rounded-lg bg-gray-200 shadow-sm lg:h-[340px] lg:w-[480px]">
                            <img
                                src={content["seccion banner"].imagen_tarjeta}
                                alt="Tarjeta Starcard"
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* --- BANNER DE DESCUENTO DINÁMICO --- */}
            <section className="group relative bg-slate-800 py-32 text-white overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <img
                        src={content.banner_promocion.imagen_fondo_banner}
                        alt="Background Promoción"
                        className="w-full h-full object-cover opacity-60 transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/50 z-10 pointer-events-none" />
                </div>

                <div className="relative z-20 mx-auto max-w-6xl px-7 sm:px-6 lg:px-12 text-left pointer-events-none">
                   
                    <h2 className="font-bebas mt-4 text-[28px] sm:text-[48px] md:text-[72px] lg:text-[90px] font-normal uppercase tracking-[0.08em]">
                        {content.banner_promocion.texto_banner}
                    </h2>
                    <p className="font-oswald mt-4 text-[16px] sm:text-[20px] md:text-[30px] font-medium text-slate-200 text-justify sm:text-left">
                        {content.banner_promocion.subtexto_banner}
                    </p>
                </div>
            </section>

            {/* --- SECCIÓN ¿QUÉ ES? --- */}
            <section className="bg-slate-50 py-20 space-y-40">
                <div className="mx-auto max-w-6xl px-7 lg:px-12 text-center">
                    <h2 className="font-bebas font-normal uppercase tracking-[0.08em] text-[28px] sm:text-[48px] md:text-[64px]">
                        {content.que_es_starcard.titulo_info}
                    </h2>
                    <p className="font-inter mx-auto mt-6 max-w-3xl text-[14px] sm:text-[16px] md:text-[16px] font-normal leading-7 md:leading-8 text-slate-600 text-[#54585A] text-justify sm:text-left">
                        {content.que_es_starcard.descripcion_info}
                    </p>
                </div>

                {/* --- MARQUEE DE LOGOS ORIGINAL --- */}
                <div className="group relative w-full overflow-hidden bg-black py-5 border-y border-white/5">
                    <style dangerouslySetInnerHTML={{
                        __html: `
                        @keyframes marquee {
                            0% { transform: translateX(0); }
                            100% { transform: translateX(-50%); }
                        }
                        .animate-marquee-infinite {
                            display: flex;
                            width: max-content;
                            animation: marquee 200s linear infinite;
                        }
                    `}} />

                    <div className="animate-marquee-infinite group-hover:[animation-play-state:paused]">
                        {[...logoItems, ...logoItems].map((_, i) => (
                            <div key={i} className="flex items-center gap-6 px-8 select-none">
                                <img src="/logo/logoblanco.png" alt="Logo Galaxia" className='w-15 h-12' />
                                <span className="font-bebas text-white uppercase tracking-[0.08em] sm:text-4xl lg:text-xl">
                                    Starcard
                                </span>
                                <div className="ml-8 h-1 w-1 rounded-full bg-white/20" />
                            </div>
                        ))}
                    </div>

                    <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-black via-black/80 to-transparent z-20" />
                    <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-black via-black/80 to-transparent z-20" />
                </div>
            </section>

            {/* --- GRID DE ALIADOS DINÁMICO --- */}
            <section id="benefits" className="py-20">
                <div className="mx-auto  px-7 lg:px-47">
                    <div className="text-center">
                        <p className="font-oswald text-sm font-medium  tracking-[0.18] text-black md:text-[24px]">
                            {content.comercios_aliados.subtitulo_seccion}
                        </p>
                        <h2 className="font-bebas mt-4 text-4xl font-normal uppercase  md:text-[64px]">
                            {content.comercios_aliados.titulo_seccion}
                        </h2>
                    </div>

                    <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                        {content.comercios_aliados.lista_aliados.map((aliado: any, index: number) => (
                            <article
                                key={index}
                                className="group overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm transition-all hover:-translate-y-2 hover:shadow-xl"
                            >
                                <div className="aspect-[4/3] bg-slate-200 overflow-hidden">
                                    <img
                                        src={aliado.imagen_aliado}
                                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                        alt={aliado.nombre_aliado}
                                    />
                                </div>

                                <div className="space-y-4 p-7 sm:p-6">
                                    <p className="font-inter text-[14px] sm:text-[16px] md:text-[20px] font-bold uppercase text-black">
                                        {aliado.nombre_aliado}
                                    </p>
                                    <h3 className="font-inter text-[14px] sm:text-[16px] md:text-[18px] font-normal tracking-[0.08em] text-black">
                                        {aliado.frase_gancho}
                                    </h3>
                                    <p className="font-inter line-clamp-3 text-[13px] sm:text-[14px] md:text-[12px] font-normal leading-6 text-black text-justify sm:text-left">
                                        {aliado.descripcion_aliado}
                                    </p>

                                    <Link
                                        href={aliado.enlace_aliado}
                                        className="font-inter inline-flex items-center justify-center rounded-sm border border-slate-400 px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-black transition hover:bg-slate-950 hover:text-white md:text-[16px] w-full"
                                    >
                                        {aliado.texto_boton}
                                    </Link>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- CTA FINAL --- */}
            <section className="py-20">
                <div className="mx-auto max-w-3xl px-7 md:text-[40px]  text-center">
                    <h2 className="font-bebas text-4xl font-normal uppercase tracking-[0.08em] text-black sm:text-5xl">
                        {content.seccion_final.titulo_final}
                    </h2>
                    <Link
                        href={content.seccion_final.url_boton}
                        className="font-inter mt-10 inline-flex rounded-sm bg-black px-10 py-4 md:text-[18px] font-semibold  tracking-[0.18em] text-white transition hover:bg-zinc-800"
                    >
                        {content.seccion_final.texto_boton_final}
                    </Link>
                </div>
            </section>
        </div>
    );
}