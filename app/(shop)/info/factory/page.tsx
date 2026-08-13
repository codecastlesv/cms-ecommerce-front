import React from 'react';
import api from "@/lib/axios";

type ValueItem = {
    titulo_item: string;
    descripcion_item: string;
};

type DisciplineItem = {
    imagen_disciplina: string;
    nombre_disciplina: string;
};

async function getFactoryData() {
    try {
        const response = await api.get('/shop/contents/galaxia-factory');
        return response.data?.data || null;
    } catch (err) {
        console.error("Error fetching factory data:", err);
        return null;
    }
}

export default async function Factory() {
    const pageData = await getFactoryData();

    if (!pageData) return null;

    const { content } = pageData;
    const banner = content["seccion banner"] || {};
    const bannerImage =
        (typeof banner.imagen_principal === 'string' && banner.imagen_principal.trim()) ||
        (typeof banner.imagen_fondo === 'string' && banner.imagen_fondo.trim()) ||
        '';

    return (
        <>
            {/* --- HERO SECTION ORIGINAL --- */}
            <div className="group relative w-full min-h-[520px] sm:min-h-[620px] md:min-h-[550px] lg:h-[620px] overflow-hidden">
                {/* Imagen de Fondo (CMS: seccion banner.imagen_principal) */}
                <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-105">
                    {bannerImage ? (
                        <img
                            src={bannerImage}
                            alt={banner.titulo || 'Galaxia Factory'}
                            className="object-cover object-center w-full h-full"
                        />
                    ) : (
                        <div className="h-full w-full bg-slate-800" aria-hidden />
                    )}
                </div>

                <div className="absolute inset-0 bg-black/5 z-10"></div>

                {/* Contenido encima de la imagen */}
                <div className="text-black absolute inset-0 z-20 mx-auto flex h-full max-w-7xl flex-col items-center justify-center px-4 text-center sm:px-6 md:px-12 lg:items-start lg:justify-end lg:px-10 lg:pb-20 lg:text-left">
                    <div className="w-full max-w-3xl space-y-4 text-black sm:space-y-5 md:space-y-6">
                        <div className="space-y-2">
                            <h2 className="font-bebas font-normal text-[48px] md:text-[72px] leading-[75px] tracking-[4px]">
                                {banner.titulo}
                            </h2>
                            <p className="font-oswald font-medium text-[24px] leading-[30px] tracking-[0.18px]">
                                {banner.subtitulo}
                            </p>
                        </div>

                        <p className="mx-auto max-w-xl font-inter font-normal text-[18px] leading-[28px] tracking-[0.18px] lg:mx-0">
                            {banner.descripcion}
                        </p>

                        <div className="pt-4">
                            <a 
                                href={banner.url_boton}
                                className="mx-auto inline-block w-fit rounded-sm bg-black px-8 py-2 font-inter font-semibold text-[16px] text-white md:text-[18px] leading-[32px] shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 sm:px-12 md:px-16 lg:mx-0"
                            >
                                {banner.texto_boton}
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- SECCIÓN ¿QUÉ ES FACTORY? ORIGINAL --- */}
            <div className="flex w-full flex-col justify-start items-start bg-[#F3F3F3] px-4 py-14 text-[16px] font-medium sm:px-6 sm:py-16 md:px-12 md:py-20 lg:py-24">
                <div className="mx-5 space-y-4 lg:px-10">
                    <h2 className="text-black font-bebas font-normal text-[40px] md:text-[64px] leading-[49px] tracking-[3px]">
                        {content.que_es_factory.titulo_about}
                    </h2>
                    <p className="max-w-4xl font-inter font-normal text-[14px] md:text-[16px] leading-[26px] tracking-[0.18px] text-[#54585A]">
                        {content.que_es_factory.descripcion_about}
                    </p>
                </div>
            </div>

            {/* Contenedor Principal Adaptable */}
            <div className="mx-auto max-w-7xl px-7 py-14 sm:px-6 sm:py-16 md:px-12 md:py-20 lg:px-18">
                
                {/* --- SECCIÓN POR QUÉ GALAXIA ORIGINAL --- */}
                <section>
                    <div className="mb-8 space-y-2 sm:mb-10 md:mb-12">
                        <h2 className="font-bebas font-normal text-[40px] md:text-[56px] leading-[56px] tracking-[3px]">
                            {content.por_que_factory.titulo_why}
                        </h2>
                        <p className="font-inter font-normal text-[16px] md:text-[18px] leading-[28px] tracking-[0.18px]">
                            {content.por_que_factory.subtitulo_why}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
                        {(content.por_que_factory.items_valor as ValueItem[]).map((item, index: number) => (
                            <div
                                key={index}
                                className="group flex flex-col items-center rounded-xl border border-transparent bg-[#F7F7F7] px-4 py-6 text-center transition-all duration-300 hover:-translate-y-2 hover:border-gray-100 hover:bg-white hover:shadow-2xl sm:px-6 sm:py-8 md:py-10"
                            >
                                {/* Icono Rombo */}
                                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-gray-300 transition-colors duration-300 group-hover:border-black group-hover:bg-black sm:mb-6 sm:h-14 sm:w-14">
                                </div>

                                <h3 className="font-poppins font-bold text-[14px] md:text-[16px] leading-[24px] tracking-[0.18px] text-center">
                                    {item.titulo_item}
                                </h3>

                                <p className="font-inter font-normal text-[10px] md:text-[10px] leading-[11px] tracking-[0.18px] text-center text-[#54585AAB] mt-2">
                                    {item.descripcion_item}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* --- SECCIÓN IMAGEN CENTRAL ORIGINAL araña --- */}
         {/* --- SECCIÓN IMAGEN TELARAÑA (INTEGRADA) --- */}
                <section className="my-14 flex items-center justify-center sm:my-16 md:my-24 lg:my-28">
                    <img 
                        src={content.imagen_telaraña} 
                        alt="Estructura Galaxia Factory" 
                        className="w-full max-w-5xl rounded-lg object-cover aspect-[16/10] sm:aspect-[4/3] lg:aspect-[17/10] shadow-xl transition-transform duration-500 hover:scale-[1.01]" 
                    />
                </section>

                {/* --- SECCIÓN CATÁLOGO DE DISCIPLINAS ORIGINAL --- */}
                <section>
                    <h2 className="font-bebas font-normal text-[40px] md:text-[56px] leading-[56px] tracking-[3px]">
                        {content.catalogo_factory.titulo_catalogo}
                    </h2>
                    <p className="mb-8 font-oswald font-medium text-[18px] md:text-[20px] leading-[30px] tracking-[0.18px]">
                        {content.catalogo_factory.subtitulo_catalogo}
                    </p>

                    <div className="mx-auto max-w-7xl">
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4 lg:gap-8">
                            {(content.catalogo_factory.disciplinas as DisciplineItem[]).map((item, index: number) => (
                                <div key={index} className="flex flex-col items-center group w-full cursor-pointer overflow-hidden rounded-lg">
                                    <div className="w-full overflow-hidden rounded-lg aspect-[4/5]">
                                        <img
                                            src={item.imagen_disciplina}
                                            alt={item.nombre_disciplina}
                                            className="object-cover object-center w-full h-full transition-transform duration-700 group-hover:scale-105"
                                        />
                                    </div>
                                    <p className="mt-4 font-inter font-bold text-[16px] md:text-[18px] leading-[30px] tracking-[0.18px] text-center">
                                        {item.nombre_disciplina}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* --- SECCIÓN PIE DE PÁGINA / CIERRE ORIGINAL --- */}
                <section className="flex justify-center items-center text-center">
                    <div className="space-y-6 py-12 sm:space-y-8 sm:py-24 md:space-y-2 md:py-12 lg:space-y-12 lg:py-12">
                        <h2 className="font-bebas font-normal text-[40px] md:text-[56px] leading-[56px] tracking-[3px] text-center">
                            {content.catalogo_factory.titulo_pie_catalogo}
                        </h2>
                        <p className="mt-2 font-inter font-normal text-[18px] md:text-[20px] leading-[30px] tracking-[0.18px] text-center">
                            {content.catalogo_factory.subtitulo_pie_catalogo}
                        </p>
                    </div>
                </section>
            </div>

            {/* --- SECCIÓN CTA FINAL: COTIZA CON NOSOTROS --- */}
            <div className="group relative w-full min-h-[300px] sm:min-h-[350px] md:min-h-[400px] overflow-hidden">
                {/* Imagen de Fondo */}
                <div className="absolute inset-0">
                    <img
                        src={content.banner_final.imagen_fondo_final}
                        alt="Fondo cotiza con nosotros"
                        className="object-cover object-center w-full h-full"
                    />
                </div>

                <div className="absolute inset-0 bg-black/40 z-10"></div>

                {/* Contenido encima de la imagen */}
                <div className="absolute inset-0 z-20 flex items-center justify-center px-4 sm:px-6 md:px-12">
                    <div className="flex flex-col items-center justify-center text-center space-y-6 sm:space-y-8">
                        <h2 className="font-bebas font-normal text-[28px] md:text-[28px] leading-tight tracking-[3px] text-white max-w-2xl">
                            {content.banner_final.texto_final}
                        </h2>

                        <a 
                            href={content.banner_final.url_boton}
                            className="inline-block rounded-sm bg-white px-8 py-3 font-inter font-semibold text-[14px] md:text-[18px] text-black leading-[28px] shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 sm:px-12 md:px-16"
                        >
                            {content.banner_final.texto_boton_final}
                        </a>
                    </div>
                </div>
            </div>
        </>
    );
}