import React from 'react';
import api from "@/lib/axios";

type AmbassadorItem = {
    etiqueta_tipo: string;
    imagen_url: string;
    nombre_completo: string;
    disciplina: string;
};

// Función para obtener los datos del endpoint
async function getAmbassadorsData() {
    try {
        const response = await api.get('/shop/contents/embajadores');
        return response.data?.data || null;
    } catch (err) {
        console.error("Error fetching ambassadors data:", err);
        return null;
    }
}

export default async function AmbassadorsPage() {
    const pageData = await getAmbassadorsData();

    if (!pageData) return null;

    const { content } = pageData;

    return (
        <>
            {/* SECCIÓN 1: HERO ORIGINAL */}
            <div className="group relative w-full min-h-[540px] sm:min-h-[620px] md:min-h-[600px] lg:h-[620px] overflow-hidden">
                {/* Imagen de Fondo Dinámica */}
                <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-105">
                    <img
                        src={content["seccion banner"].imagen_fondo}
                        alt={content["seccion banner"].titulo}
                        className="object-cover object-center w-full h-full opacity-35"
                    />
                </div>

                {/* Overlay Dinámico */}
                <div className="absolute inset-0 bg-black/50 z-10 transition-opacity duration-500 group-hover:opacity-90"></div>

                {/* Contenido encima de la imagen */}
                <div className="absolute inset-0 z-20 mx-auto flex max-w-7xl flex-col items-center justify-center px-6 text-center sm:px-8 md:px-12 lg:items-start lg:justify-end lg:px-10 lg:text-left lg:pb-20">
                    <div className="max-w-3xl space-y-4 text-black sm:space-y-5 md:space-y-6 lg:max-w-4xl">
                        <div className="space-y-2">
                            <h2 className="text-[48px] md:text-[48px] font-[Bebas_Neue] font-normal leading-[56px] tracking-[2px]">
                                {content["seccion banner"].titulo}
                            </h2>
                            <p className="mt-3 text-[20px] md:text-[20px] font-[Oswald] font-medium leading-[30px] tracking-[0.18px]">
                                {content["seccion banner"].subtitulo}
                            </p>
                        </div>

                        <p className="mx-auto max-w-xl text-[16px] md:text-[16px] font-[Inter] font-normal leading-[26px] tracking-[0.18px]">
                            {content["seccion banner"].descripcion}
                        </p>
                    </div>
                </div>
            </div>

            {/* SECCIÓN 2: TEXTO CENTRAL ORIGINAL */}
            <div className="flex flex-col justify-center items-center bg-[#F3F3F3] w-full py-50 text-center px-6 lg:px-47">
                <h3 className="text-black text-[20px] md:text-[20px] font-[Oswald] font-medium leading-[30px] tracking-[0.18px] mb-8 max-w-5xl">
                    {content.banner_gris.destacado_banner}
                </h3>
                <div className="text-[16px] md:text-[16px] font-[Inter] font-normal leading-[26px] tracking-[0.18px] text-[#54585A]">
                    <p className="text-lg font-medium">{content.banner_gris.descripcion_banner}</p>
                </div>
            </div>

            {/* SECCIÓN 3: GALERÍA DE EMBAJADORES DINÁMICA */}
            <div className="px-6 lg:px-47 py-24 bg-white">
                <div className="mb-16">
                    <h2 className="text-black text-[48px] md:text-[48px] font-[Bebas_Neue] font-normal leading-[56px] tracking-[2px] mb-10">
                        {content.listado_embajadores.titulo_listado}
                    </h2>
                    <p className="text-[16px] md:text-[16px] font-[Inter] font-bold leading-[26px] tracking-[0.18px]max-w-3xl text-[#54585A] max-w-3xl">
                        {content.listado_embajadores.texto_embajadores}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {(content.listado_embajadores.items_listado as AmbassadorItem[]).map((person, index: number) => (
                        <div key={index} className="group flex flex-col">
                            {/* Imagen Card */}
                            <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-gray-200 mb-6 border border-gray-100">
                                {/* Badge de Categoría Dinámico */}
                                <div className="absolute top-4 left-4 z-20 bg-white/90 px-8 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-black shadow-sm">
                                    {person.etiqueta_tipo}
                                </div>
                                <img
                                    src={person.imagen_url}
                                    alt={person.nombre_completo}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>
                            </div>
                            
                            {/* Texto Card Dinámico */}
                            <div className="space-y-1">
                                <h4 className="text-[28px] md:text-[28px] font-[Bebas_Neue] font-normal leading-[33px] tracking-[1.5px] text-black ">
                                    {person.nombre_completo}
                                </h4>
                                <p className="text-[16px] md:text-[16px] font-[Inter] font-normal leading-[26px] tracking-[0.18px] text-[#000000AB]/67">
                                    Disciplina: <span className="text-[16px] md:text-[16px] font-[Inter] font-normal leading-[26px] tracking-[0.18px] text-[#000000AB]/67">{person.disciplina}</span>
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

          
        </>
    );
}