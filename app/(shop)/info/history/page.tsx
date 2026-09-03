import React from 'react';
import api from "@/lib/axios";
import { IoCheckmarkCircleSharp } from "react-icons/io5";

async function getHistoryData() {
    try {
        const response = await api.get('/shop/contents/historia');
        return response.data?.data || null;
    } catch (err) {
        console.error("Error fetching history data:", err);
        return null;
    }
}

export default async function HistoryPage() {
    const pageData = await getHistoryData();

    if (!pageData) return null;

    const { content } = pageData;
    const logoUrl = "/logo/logo.png";

    return (
        <div className="bg-[#000000] text-white">

            {/* SECCIÓN 1: HERO HISTORIA */}
            <section className="px-7 sm:px-6 md:px-12 lg:px-47 py-12 sm:py-20 grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 items-center min-h-auto md:min-h-[600px] bg-[#121212]">
                <div className="space-y-6 sm:space-y-8">
                    <h1 className="text-[32px] sm:text-[48px] md:text-[80px] font-[Bebas_Neue] font-normal leading-[40px] sm:leading-[56px] md:leading-[88px] tracking-[2px] sm:tracking-[4px]">
                        {/* Dividimos el título para mantener el estilo de saltos de línea */}
                        {content["seccion banner"].titulo.split('El').map((word: string, i: number) => (
                            <React.Fragment key={i}>
                                {word} <br />
                            </React.Fragment>
                        ))}
                    </h1>
                    <div className="space-y-4">
                        <h2 className="font-[Oswald] font-medium text-[16px] sm:text-[20px] leading-[24px] sm:leading-[30px] tracking-[0.18px]">{content["seccion banner"].subtitulo}</h2>
                        <p className="font-[Inter] font-normal text-[14px] sm:text-[16px] leading-[22px] sm:leading-[26px] tracking-[0.18px] text-[#FFFFFFAB]/67 text-justify sm:text-left">
                            {content["seccion banner"].descripcion}
                        </p>
                    </div>
                </div>
                <div className="relative aspect-square rounded-2xl overflow-hidden border border-zinc-700/50 group">
                    <img
                        src={content["seccion banner"].imagen_principal}
                        alt="Historia Castella"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                </div>
            </section>

            {/* SECCIÓN 2: ORÍGENES (Imagen Izquierda - Fuera de Borde) */}
            <section className="py-12 sm:py-24 grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-16 items-center bg-[#121212]">
                <div className="order-2 md:order-1 relative h-[300px] sm:h-[400px] md:h-full md:min-h-[500px] group overflow-hidden md:rounded-r-2xl border-y md:border-y border-r border-zinc-700/50 rounded-lg sm:rounded-xl md:rounded-r-2xl md:rounded-l-none">
                    <img
                        src={content.origenes_fundacion.imagen_origenes}
                        alt="Orígenes Castella"
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                </div>

                <div className="order-1 md:order-2 space-y-4 sm:space-y-6 px-7 sm:px-6 md:px-12 lg:pr-47 lg:pl-0">
                    <h2 className="font-[Bebas_Neue] font-normal text-[28px] sm:text-[48px] leading-[36px] sm:leading-[56px] tracking-[1px] sm:tracking-[2px]">
                        {content.origenes_fundacion.titulo_origenes}
                    </h2>
                    <div className="font-[Inter] font-normal text-[14px] sm:text-[16px] leading-[22px] sm:leading-[26px] tracking-[0.18px] text-[#ffffff]/67 text-justify sm:text-left">
                        <p>{content.origenes_fundacion["contenido_fundación"]}</p>
                    </div>
                    <p className="font-[Oswald] font-medium text-[16px] sm:text-[20px] leading-[24px] sm:leading-[30px] tracking-[0.18px] text-justify sm:text-left">
                        {content.origenes_fundacion.cita_origenes}
                    </p>
                </div>
            </section>

            {/* SECCIÓN 3: DESARROLLO (Imagen Derecha) */}
            <section className="px-7 sm:px-6 md:px-12 lg:px-47 py-12 sm:py-24 grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-16 items-center bg-[#121212]">
                <div className="space-y-4 sm:space-y-6">
                    <h2 className="text-[28px] sm:text-[48px] font-[Bebas_Neue] font-normal leading-[36px] sm:leading-[56px] tracking-[1px] sm:tracking-[2px]">
                        {content.desarrollo_como_empresa.titulo_origenes}
                    </h2>
                    <div className="text-[14px] sm:text-[16px] font-[Inter] font-normal leading-[22px] sm:leading-[26px] tracking-[0.18px] text-[#ffffff]/67 text-justify sm:text-left">
                        <p>{content.desarrollo_como_empresa["contenido_fundación"]}</p>
                    </div>
                </div>
                <div className="relative w-full aspect-video rounded-lg sm:rounded-xl md:rounded-2xl overflow-hidden border border-zinc-700/50 group">
                    <img
                        src={content.desarrollo_como_empresa.imagen_origenes}
                        alt="Desarrollo Castella"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                </div>
            </section>

            {/* SECCIÓN 4: TIMELINE */}
            <section className="px-4 sm:px-6 md:px-20 lg:px-47 py-16 sm:py-32 text-center bg-[#121212]">
                <h2 className="text-[32px] sm:text-[48px] font-[Bebas_Neue] font-normal leading-[40px] sm:leading-[56px] tracking-[1px] sm:tracking-[2px] mb-12 sm:mb-20">
                    {content.linea_tiempo.titulo_timeline}
                </h2>
                
                {/* Timeline Móvil - Vertical */}
                <div className="md:hidden">
                    <div className="relative space-y-6 px-4">
                        <div className="absolute left-6 top-0 bottom-0 w-px bg-zinc-700"></div>
                        {content.linea_tiempo.hitos_timeline.map((event: any, index: number) => (
                            <div key={index} className="relative pl-12 text-left">
                                <div className="absolute -left-[18px] top-2 w-4 h-4 rounded-full bg-zinc-300 border-4 border-zinc-900"></div>
                                <p className="text-[12px] font-[Oswald] font-medium leading-[18px] tracking-[0.18px] text-[#ffffff]/67">{event.etiqueta}</p>
                                <p className="text-[16px] font-[Inter] font-bold leading-[24px] tracking-[0.18px]">{event.ubicacion}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Timeline Desktop - Horizontal */}
                <div className="hidden md:block relative py-12 md:px-20">
                    <div className="absolute top-1/2 left-0 w-full h-px bg-zinc-700"></div>

                    <div className="relative flex justify-between items-center max-w-5xl mx-auto">
                        {content.linea_tiempo.hitos_timeline.map((event: any, index: number) => (
                            <div key={index} className="relative flex flex-col items-center group">
                                <div className="w-4 h-4 rounded-full bg-zinc-300 z-10 border-4 border-zinc-900 group-hover:scale-125 transition-transform duration-300"></div>
                                <div className={`absolute ${event.posicion === 'top' ? 'bottom-8' : 'top-8'} w-48 transition-all duration-300 group-hover:-translate-y-1`}>
                                    <p className="text-[20px] font-[Oswald] font-medium leading-[30px] tracking-[0.18px] text-[#ffffff]/67">{event.etiqueta}</p>
                                    <p className="text-[20px] font-[Inter] font-bold leading-[30px] tracking-[0.18px]">{event.ubicacion}</p>
                                    <div className={`absolute left-1/2 -translate-x-1/2 w-px h-4 bg-zinc-700 ${event.posicion === 'top' ? 'top-full mt-2' : 'bottom-full mb-2'}`}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <p className="mt-12 sm:mt-32 text-[14px] sm:text-[16px] px-4 sm:px-60 font-[Inter] font-normal leading-[22px] sm:leading-[26px] tracking-[0.18px] text-justify sm:text-left">
                    {content.linea_tiempo.texto_pie_timeline}
                </p>
            </section>

            {/* SECCIÓN 5: MARCAS (Logos) */}
            <section className="px-7 sm:px-6 md:px-12 lg:px-47 py-12 sm:py-24 border-t border-b border-zinc-800 bg-[#121212]">
                <h2 className="text-[28px] sm:text-[36px] font-[Bebas_Neue] font-normal leading-[36px] sm:leading-[45px] tracking-[1px] sm:tracking-[2px] mb-4">
                    {content.marca_portafolio.titulo_portafolio}
                </h2>
                <p className="text-[14px] sm:text-[16px] font-[Inter] font-normal leading-[22px] sm:leading-[26px] tracking-[0.18px] mb-8 sm:mb-12 max-w-3xl text-[#ffffff]/67 text-justify sm:text-left">
                    {content.marca_portafolio.contenido_portafolio}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-6">
                    {content.marca_portafolio.logos_marcas.map((brand: any, i: number) => (
                        <div key={i} className="aspect-[4/3] bg-zinc-800/30 rounded-xl flex items-center justify-center border border-zinc-700/30 overflow-hidden group">
                            <img
                                src={brand.imagen_marca}
                                alt="Marca Castella"
                                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300 group-hover:scale-105 transition-transform"
                            />
                        </div>
                    ))}
                </div>
            </section>

            {/* SECCIÓN 6: INNOVACIÓN */}
            <section className="px-7 sm:px-6 md:px-12 lg:px-47 py-16 sm:py-32 bg-[#121212]">
                <h2 className="text-center text-[36px] sm:text-[56px] font-[Bebas_Neue] font-normal leading-[44px] sm:leading-[56px] tracking-[2px] sm:tracking-[3px] mb-12 sm:mb-16">
                    {content.innovacion_servicios.titulo_servicios}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 max-w-5xl mx-auto">
                    {content.innovacion_servicios.items_servicios.map((item: string, i: number) => (
                        <div key={i} className="flex items-center gap-4 sm:gap-6 bg-[#F7F7F71F]/50 p-4 sm:p-8 rounded-lg sm:rounded-xl border border-zinc-800 hover:border-zinc-600 transition-colors group">
                            <div className="text-white shrink-0 group-hover:scale-110 transition-transform duration-300">
                                <IoCheckmarkCircleSharp size={28} className="sm:w-8 sm:h-8" />
                            </div>
                            <p className="font-bold text-sm sm:text-lg text-zinc-100 text-[14px] sm:text-[16px] font-[Poppins] font-bold leading-[20px] sm:leading-[24px] tracking-[0.18px]">{item}</p>
                        </div>
                    ))}
                </div>
                        <p className="text-center mt-8 sm:mt-12 text-[16px] sm:text-[20px] font-[Oswald] font-medium leading-[24px] sm:leading-[30px] tracking-[0.18px] pt-4 sm:pt-8 text-justify sm:text-center">
                    {content.innovacion_servicios.footer_servicios}
                </p>
            </section>

            {/* SECCIÓN 7: HOY */}
            <section className="px-7 sm:px-6 md:px-12 lg:px-47 py-12 sm:py-32 grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-16 items-start bg-[#121212]">
                <div className="space-y-6 sm:space-y-8 max-w-2xl">
                    <div className="relative w-full aspect-video rounded-lg sm:rounded-xl md:rounded-2xl overflow-hidden border border-zinc-700/50 group">
                        <img
                            src={content.seccion_hoy.imagen_hoy}
                            alt="Hoy en Castella"
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                    </div>
                    <div className="space-y-4 sm:space-y-6">
                        <h2 className="text-[28px] sm:text-[48px] font-[Bebas_Neue] font-normal leading-[36px] sm:leading-[56px] tracking-[1px] sm:tracking-[2px]">{content.seccion_hoy.titulo_hoy}</h2>
                        <p className="text-[14px] sm:text-[16px] font-[Inter] font-normal leading-[22px] sm:leading-[26px] tracking-[0.18px] text-[#ffffff]/67 text-justify sm:text-left">
                            {content.seccion_hoy.contenido_hoy}
                        </p>
                    </div>
                </div>
                <div></div>
            </section>

            {/* SECCIÓN 8: PATROCINIOS */}
            <section className="px-7 sm:px-6 md:px-12 lg:px-47 py-12 sm:py-32 bg-[#121212]">
                <h2 className="text-[28px] sm:text-[48px] font-[Bebas_Neue] font-normal leading-[36px] sm:leading-[56px] tracking-[1px] sm:tracking-[2px] mb-4">{content.seccion_patrocinios.titulo_patrocinios}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-10">
                    {content.seccion_patrocinios.logos_patrocinios.map((logo: any, i: number) => (
                        <div key={i} className="group cursor-pointer rounded-xl overflow-hidden border border-zinc-700/50">
                            <div className="aspect-[4/3] relative">
                                <img
                                    src={logo.imagen_marca}
                                    alt="Patrocinio Castella"
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-black/50 group-hover:bg-black/20 transition-colors duration-500"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* SECCIÓN FINAL: BLANCA */}
            <section className="bg-white text-black py-16 sm:py-40 text-center">
                <div className="max-w-7xl mx-auto px-7 sm:px-6">
                    <h2 className="text-[32px] sm:text-[56px] font-[Bebas_Neue] font-normal leading-[40px] sm:leading-[56px] tracking-[2px] sm:tracking-[3px]">
                        {content.eslogan_cierre.eslogan_principal}
                    </h2>
                    <p className="text-[16px] sm:text-[20px] font-[Inter] font-normal leading-[24px] sm:leading-[30px] tracking-[0.18px] text-[#000000] text-justify sm:text-left">
                        {content.eslogan_cierre.eslogan_secundario}
                    </p>
                </div>
            </section>
        </div>
    );
}