import React from 'react';
import api from "@/lib/axios";
import { IoCheckmarkCircleSharp } from "react-icons/io5";

type CategoryItem = {
    texto: string;
};

async function getCustomUniformsData() {
    try {
        const response = await api.get('/shop/contents/uniformes-personalizados');
        return response.data?.data || null;
    } catch (err) {
        console.error("Error fetching uniformes data:", err);
        return null;
    }
}

export default async function CustomUniformsHero() {
    const pageData = await getCustomUniformsData();

    if (!pageData) return null;

    const { content } = pageData;

    return (
        <>
            {/* --- HERO SECTION ORIGINAL --- */}
            <div className="group relative w-full min-h-[540px] sm:min-h-[620px] md:min-h-[550px] lg:h-[620px] overflow-hidden">
                {/* Imagen de Fondo */}
                <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-105">
                    <img
                        src={content["seccion banner"].imagen_fondo}
                        alt="Equipo celebrando con uniformes Galaxia Deportes"
                        className="object-cover object-center w-full h-full"
                    />
                </div>

                {/* Overlay Dinámico */}
                <div className="absolute inset-0 bg-black/50 z-10 transition-opacity duration-500 group-hover:opacity-90"></div>

                {/* Contenido encima de la imagen */}
                <div className="absolute inset-0 z-20 mx-auto flex h-full max-w-7xl flex-col items-center justify-center px-4 text-center sm:px-6 md:px-12 lg:items-start lg:justify-end lg:px-16 lg:text-left lg:pb-20">
                    <div className="w-full max-w-3xl space-y-4 sm:space-y-5 md:space-y-6">
                        <div className="space-y-2">
                            <h2 className="whitespace-nowrap text-[clamp(1.35rem,6vw,3rem)] font-bebas font-normal uppercase
text-[36px] md:text-[72px]
leading-[75px] tracking-[4px] text-white">
                                {content["seccion banner"].titulo}
                            </h2>
                            <p className="mt-3 font-oswald font-medium text-[18px] md:text-[24px] leading-[30px] tracking-[0.18px] text-white">
                                {content["seccion banner"].subtitulo}
                            </p>
                        </div>

                        <p className="mx-auto max-w-xl font-inter font-normal text-[16px] md:text-[18px] leading-7 tracking-[0.18px] text-white lg:mx-0">
                            {content["seccion banner"].descripcion}
                        </p>

                        <div className="pt-4">
                            <button className="mx-auto inline-flex w-fit rounded-sm bg-black px-8 py-4 text-sm font-inter font-semibold text-[16px] md:text-[18px] leading-[32px] shadow-2xl transition-all duration-300 hover:scale-105 hover:bg-zinc-200 text-white  hover:text-black active:scale-95 sm:px-12 md:px-16 lg:mx-0">
                                {content["seccion banner"].texto_boton}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- BANNER GRIS ORIGINAL --- */}
            <div className="flex w-full items-center justify-center bg-[#F3F3F3] px-7 py-16 text-center sm:px-6 sm:py-20 md:px-12 md:py-24 lg:px-20 lg:py-28">
                <p className="max-w-3xl font-oswald font-medium text-[20px] md:text-[28px] text-center leading-[39px] tracking-[0.18px] leading-relaxed text-black ">
                    {content.banner_gris}
                </p>
            </div>

            {/* --- CONTENEDOR PRINCIPAL ADAPTABLE ORIGINAL --- */}
            <div className="px-7 py-16 sm:px-6 sm:py-20 md:px-12 lg:px-20 xl:px-47">

                {/* Más que un uniforme */}
                <div className="grid grid-cols-1 items-center gap-8 pb-16 sm:gap-10 md:pb-10 md:grid-cols-12 lg:gap-12 lg:pb-24">

                    {/* Imagen: Ocupa 7 de las 12 columnas en tablets y desktop */}
                    <div className="md:col-span-7">
                        <div className="overflow-hidden rounded-lg aspect-[16/10] sm:aspect-[4/3] md:aspect-[3/2]">
                            <img
                                src={content.mas_que_uniforme.imagen_detalle}
                                alt=""
                                className='hover:scale-[1.02] w-full h-full object-cover transition-transform duration-500'
                            />
                        </div>

                        <div className="mt-3 flex gap-2 sm:mt-4">
                            <div className="w-3 h-3 rounded-full bg-black cursor-pointer"></div>
                            <div className="w-3 h-3 rounded-full bg-gray-300 cursor-pointer hover:bg-gray-400 transition-colors"></div>
                            <div className="w-3 h-3 rounded-full bg-gray-300 cursor-pointer hover:bg-gray-400 transition-colors"></div>
                        </div>
                    </div>

                    {/* Contenido: Ocupa las 5 columnas restantes */}
                    <div className="md:col-span-5 space-y-4 md:space-y-2 lg:pl-8">
                        <h1 className="text-2xl font-bebas font-normal text-[32px] md:text-[48px] leading-[56px] tracking-[2px]">
                            {content.mas_que_uniforme.titulo_detalle}
                        </h1>
                        <div className='space-y-2 text-[14px] sm:space-y-2'>
                            <h2 className="font-oswald font-medium text-[16px] md:text-[20px] leading-[30px] tracking-[0.18px]">
                                {content.mas_que_uniforme.subtitulo_detalle}
                            </h2>
                            <p className="font-inter font-bold text-[12px] md:text-[14px] leading-[26px] tracking-[0.18px] text-[#54585A]">
                                {content.mas_que_uniforme.contenido_detalle}
                            </p>
                        </div>
                    </div>

                </div>

                {/* Qué personalizamos */}
                <div className="grid items-start gap-10 md:grid-cols-2 md:gap-12 lg:gap-20">
                    <div className="space-y-4">
                        <h2 className="text-center font-bebas font-normal text-[32px] md:text-[48px] leading-[56px] tracking-[2px]">
                            {content.que_personalizamos.titulo_custom}
                        </h2>

                        <p className="text-center font-oswald font-medium text-[16px] md:text-[20px] leading-[30px] tracking-[0.18px]">
                            {content.que_personalizamos.subtitulo_custom}
                        </p>
                        <div className="grid grid-cols-1 gap-4 pt-4 sm:grid-cols-2">
                            {(content.que_personalizamos.categorias_custom as CategoryItem[]).map((cat, index: number) => (
                                <div
                                    key={index}
                                    className="group flex flex-col items-center justify-center rounded-xl border border-transparent bg-[#F7F7F7] px-4 py-4 text-center transition-all duration-300 hover:-translate-y-1 hover:border-gray-100 hover:bg-white hover:shadow-xl sm:px-8 sm:py-5"
                                >
                                    <div className="mb-4 flex h-12 w-12 items-center justify-center text-justify rounded-full border border-gray-300 transition-colors duration-300 group-hover:border-black group-hover:bg-black">
                                       
                                    </div>
                                    <span className="font-poppins font-bold text-[14px] md:text-[16px]  leading-6 tracking-[0.18px]">{cat.texto}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-4 lg:pl-8">
                        <h2 className="font-oswald font-medium text-[16px] md:text-[20px] text-center leading-[30px] tracking-[0.18px]">
                            {content.que_personalizamos.titulo_detalles}
                        </h2>
                        <div className="space-y-2">
                            {content.que_personalizamos.items_detalles.map((text: string, index: number) => (
                                <div key={index} className="flex items-center gap-3 rounded-md border border-gray-100 p-4 transition-colors hover:bg-zinc-100 sm:gap-4 sm:p-5">
                                    <span className="text-black"><IoCheckmarkCircleSharp size={28} /></span>
                                    <p className="font-poppins font-bold text-[14px] md:text-[16px] leading-6 tracking-[0.18px]">{text}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Por qué Galaxia */}
                <div className="py-12 sm:py-16 md:py-20">
                    <div className="max-w-7xl mx-auto">
                        <div className="mb-10 text-center sm:mb-12">
                            <h2 className="mb-4 text-3xl font-bebas font-normal text-[36px] md:text-[56px] text-center leading-[56px] tracking-[3px]">
                                {content.por_que_galaxia.titulo_why}
                            </h2>
                            <p className="mx-auto max-w-4xl font-inter font-normal text-[16px] md:text-[18px] text-center leading-7 tracking-[0.18px]">
                                {content.por_que_galaxia.subtitulo_why}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {content.por_que_galaxia.items_why.map((item: string, index: number) => (
                                <div
                                    key={index}
                                    className="group flex items-center gap-3 rounded-lg bg-[#f7f7f7] px-4 py-4 transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-md sm:gap-4 sm:p-6 lg:p-8"
                                >
                                    <span className="text-black shrink-0 transition-transform duration-300 group-hover:scale-110">
                                        <IoCheckmarkCircleSharp size={28} />
                                    </span>
                                    <p className="font-poppins font-bold text-[14px] md:text-[16px] leading-6 tracking-[0.18px]">
                                        {item}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Formulario de Contacto Original */}
                <div className="bg-white">
                    <section id="contacto" className="mx-auto max-w-7xl py-16 md:py-24">
                        <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-16">
                            <div className="space-y-6 text-center lg:text-left">
                                <h2 className="font-bebas font-normal text-[36px] md:text-[56px] leading-[56px] tracking-[3px]">
                                    {content.formulario.titulo_form}
                                </h2>
                                <p className="mx-auto max-w-md font-inter font-normal text-[16px] md:text-[18px] leading-7 tracking-[0.18px] lg:mx-0 lg:max-w-sm">
                                    {content.formulario.descripcion_form}
                                </p>
                                <div className='space-y-2 rounded-sm bg-[#D9D9D933] p-5 text-center transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-md sm:p-6'>
                                    <h1 className='font-oswald font-medium text-[16px] md:text-[20px] text-center leading-[30px] tracking-[0.18px]'>
                                        {content.formulario.recuadro_gris_titulo}
                                    </h1>
                                    <p className='font-inter font-medium text-[12px] md:text-[14px] text-center leading-[22px] tracking-[0.2px]'>
                                        {content.formulario.recuadro_gris_texto}
                                    </p>
                                </div>
                            </div>

                            <form className="space-y-4">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <input type="text" placeholder="Nombre del equipo/empresa*" className="w-full rounded-md border border-[#54585AAB] p-4 text-sm outline-none transition-all focus:border-black" required />
                                    <input type="text" placeholder="Nombre del contacto*" className="w-full rounded-md border border-[#54585AAB] p-4 text-sm outline-none transition-all focus:border-black" required />
                                </div>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <input type="tel" placeholder="Teléfono/WhatsApp*" className="w-full rounded-md border border-[#54585AAB] p-4 text-sm outline-none transition-all focus:border-black" required />
                                    <input type="email" placeholder="Correo electrónico*" className="w-full rounded-md border border-[#54585AAB] p-4 text-sm outline-none transition-all focus:border-black" required />
                                </div>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <select className="w-full cursor-pointer rounded-md border border-[#54585AAB] bg-white p-4 text-sm outline-none focus:border-black" required>
                                        <option value="">Tipo de uniforme*</option>
                                    </select>
                                    <select className="w-full cursor-pointer rounded-md border border-[#54585AAB] bg-white p-4 text-sm outline-none focus:border-black" required>
                                        <option value="">cantidad aproximada*</option>
                                    </select>
                                </div>
                                <input type="text" placeholder="Fecha estimada*" className="w-full rounded-md border border-[#54585AAB] p-4 text-sm outline-none transition-all focus:border-black" required />
                                <textarea placeholder="Comentarios o ideas de diseño" rows={4} className="w-full resize-none rounded-md border border-[#54585AAB] p-4 text-sm outline-none transition-all focus:border-black"></textarea>

                                <div className="flex justify-center md:justify-center">
                                    <button type="submit" className="w-full md:w-auto px-16 bg-black text-white border-[#54585AAB] py-4 font-bold text-sm hover:bg-zinc-800 transition-all rounded-sm uppercase tracking-widest shadow-lg active:scale-95">
                                        {content.formulario.texto_boton}
                                    </button>
                                </div>
                            </form>
                        </div>

                        <div className="mt-5 flex flex-col items-center justify-center text-center sm:mt-5 md:mt-5 md:space-y-12">
                            <hr className="border-gray-100 w-full" />
                            <h3 className="font-bebas font-normal text-[28px] md:text-[40px] leading-[49px] tracking-[2px]">
                                {content.eslogan_final}
                            </h3>
                            <img src="/logo/logo.png" alt="Galaxia Deportes" className=" w-24 sm:w-28 md:w-32" />
                        </div>
                    </section>
                </div>
            </div>
        </>
    );
}