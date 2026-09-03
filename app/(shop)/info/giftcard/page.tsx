import React from 'react';
import Link from 'next/link';
import api from "@/lib/axios";
import { IoCheckmarkCircleSharp } from 'react-icons/io5';

// Función para obtener los datos del endpoint
async function getGiftcardData() {
    try {
        const response = await api.get('/shop/contents/giftcard');
        return response.data?.data || null;
    } catch (err) {
        console.error("Error fetching Giftcard data:", err);
        return null;
    }
}

export default async function GiftcardPage() {
    const pageData = await getGiftcardData();

    if (!pageData) return null;

    const { content } = pageData;

    return (
        <div className="min-h-screen bg-white text-slate-950 font-sans">
            {/* --- HERO SECTION ORIGINAL --- */}
            <section className="relative flex min-h-[520px] sm:min-h-[620px] items-center overflow-hidden bg-slate-100 py-12 sm:py-20 lg:py-20">
                {/* Imagen de Fondo Dinámica */}
                <div className="absolute inset-0 z-0">
                    <img
                        src={content["seccion banner"].imagen_fondo}
                        alt="Background Giftcard"
                        className="w-full h-full object-cover opacity-60"
                    />
                    <div className="absolute inset-0 z-10" />
                </div>

                <div className="relative z-20 mx-auto max-w-7xl px-4 sm:px-6 lg:px-9">
                    <div className="grid gap-6 sm:gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                        <div className="space-y-3 sm:space-y-4 rounded-2xl text-black p-4 sm:p-6 md:space-y-2 md:p-8">
                            <h1 className="font-bebas font-normal uppercase text-[28px] sm:text-[36px] md:text-[48px]">
                                {content["seccion banner"].titulo}
                            </h1>
                            <h2 className="font-oswald max-w-2xl text-[14px] sm:text-[16px] md:text-[20px] font-medium leading-7 md:leading-8">
                                {content["seccion banner"].subtitulo}
                            </h2>

                            <p className="font-inter max-w-2xl text-[14px] sm:text-[16px] md:text-[16px] font-normal leading-7 md:leading-8 text-justify sm:text-left">
                                {content["seccion banner"].descripcion}
                            </p>
                            <Link
                                href={content["seccion banner"].url_boton}
                                className="font-inter inline-flex rounded-sm bg-black px-8 py-4 font-semibold md:text-[18px] tracking-[0.3] text-white transition hover:bg-zinc-800"
                            >
                                {content["seccion banner"].texto_cta}
                            </Link>
                        </div>

                        {/* Visual de la Imagen Derecha (Tarjeta) */}
                        <div className="aspect-square overflow-hidden rounded-lg bg-gray-200 shadow-sm lg:h-[340px] lg:w-[480px]">
                            <img
                                src={content["seccion banner"].imagen_tarjeta}
                                alt="Tarjeta Giftcard"
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* --- SECCIÓN ¿QUÉ ES? --- */}
            <section className="bg-slate-50 py-12 sm:py-20">
                <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-12 text-center">
                    <h2 className="font-bebas text-[28px] sm:text-[40px] md:text-[64px] font-normal uppercase tracking-[0.08em]">
                        {content.sobre_giftcard.titulo_about}
                    </h2>
                    <p className="font-inter mx-auto mt-6 max-w-2xl text-[14px] sm:text-[16px] font-normal leading-7 md:leading-8 text-[#54585A] text-justify sm:text-left">
                        {content.sobre_giftcard.descripcion_about}
                    </p>
                </div>
            </section>

            {/* --- SECCIÓN PARA QUIÉN ES IDEAL (Cards Originales) --- */}
            <section className="py-20">
                <div className="mx-auto max-w-6xl px-7 lg:px-2 text-center">
                    <div className="space-y-2 mb-12">
                        <h2 className="font-bebas text-black text-[32px] md:text-[48px] font-normal uppercase leading-tight tracking-[0.08em]">
                            {content.para_quien_ideal.titulo_seccion}
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {content.para_quien_ideal.lista_ideales.map((item: any, index: number) => (
                            <div
                                key={index}
                                className="bg-[#F7F7F7] px-6 py-10 rounded-xl flex flex-col items-center text-center transition-all duration-300 hover:bg-white hover:shadow-2xl hover:-translate-y-2 border border-transparent hover:border-gray-100 group"
                            >
                                {/* Círculo con Imagen dinámico */}
                                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border border-gray-300 mb-6 flex items-center justify-center overflow-hidden transition-colors duration-300 group-hover:bg-black group-hover:border-black">
                                    <img 
                                        src={item.imagen_item} 
                                        alt={item.titulo_item}
                                        className="w-full h-full object-cover group-hover:opacity-80"
                                    />
                                </div>

                                <h3 className="font-poppins font-bold text-[14px] sm:text-[16px] md:text-[16px] mb-3 tracking-[0.18] text-gray-900">
                                    {item.titulo_item}
                                </h3>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- SECCIÓN POR QUÉ ELEGIR (Iconos de Características) --- */}
            <section className="py-20">
                <div className="mx-auto max-w-7xl px-7 lg:px-16">
                    <div className="mb-12  text-center">
                        <h2 className="font-bebas text-center text-[32px]  md:text-[56px] font-normal tracking-[0.08em] text-black mb-6 uppercase">
                            {content.por_que_elegir.titulo_razones}
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {content.por_que_elegir.items_razones.map((item: string, index: number) => (
                            <div
                                key={index}
                                className="bg-[#f7f7f7] p-6 sm:p-8 flex items-start sm:items-center gap-3 sm:gap-4 rounded-lg transition-all duration-300 hover:bg-white hover:shadow-md hover:-translate-y-1 group"
                            >
                                <span className="text-black shrink-0 transition-transform duration-300 group-hover:scale-110">
                                    <IoCheckmarkCircleSharp size={28} />
                                </span>
                                <p className="font-poppins text-black font-semibold text-[14px] sm:text-[16px] md:text-[16px] md:leading-tight text-justify sm:text-left">
                                    {item}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- CTA FINAL ORIGINAL --- */}
            <section className="w-full">
                {/* Banner Superior Negro Dinámico */}
                <div className="bg-black py-12 px-7">
                    <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-center gap-6 sm:gap-12 md:gap-20 px-4 sm:px-6">
                        <div className="text-center md:text-left">
                            <h2 className="font-bebas text-white  md:text-[36px] font-normal leading-tight tracking-[0.08em] ">
                                {content.banner_cierre.texto_banner.split('. ').map((line: string, i: number) => (
                                    <React.Fragment key={i}>
                                        {line}. {i === 0 && <br />}
                                    </React.Fragment>
                                ))}
                            </h2>
                        </div>
                        <Link 
                            href={content.banner_cierre.url_boton}
                        className="font-inter bg-white text-black px-7 py-3 rounded-md font-semibold  hover:bg-gray-200 transition-colors md:text-[16px] tracking-[0.3] "
                        >
                            {content.banner_cierre.texto_boton_banner}
                        </Link>
                    </div>
                </div>

                {/* Sección Inferior Blanca Dinámica */}
                <div className="bg-white py-20 px-7 text-center">
                    <div className="max-w-2xl mx-auto flex flex-col items-center">
                        <div className="w-64 h-40 bg-gray-200 rounded-2xl flex items-center justify-center mb-8 relative overflow-hidden shadow-xl">
                            <img 
                                src={content.componente_final.imagen_tarjeta_final} 
                                alt="Giftcard Castella Cierre"
                                className="w-full h-full object-cover"
                            />
                        </div>

                        <h3 className="font-bebas text-black text-3xl md:text-[40px] font-normal uppercase mb-4 tracking-[0.08em]">
                            {content.componente_final.titulo_final}
                        </h3>
                        <p className="font-oswald text-black text-[16px] sm:text-lg md:text-[20px] font-normal text-justify sm:text-left">
                            {content.componente_final.eslogan_final}
                        </p>
                       
                    </div>
                </div>
            </section>
        </div>
    );
}