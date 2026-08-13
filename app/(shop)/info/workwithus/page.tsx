import React from 'react';
import api from "@/lib/axios";
import { IoCheckmarkCircleSharp } from "react-icons/io5";

// Función para obtener los datos del endpoint
async function getWorkWithUsData() {
    try {
        const response = await api.get('/shop/contents/talento');
        return response.data?.data || null;
    } catch (err) {
        console.error("Error fetching Work With Us data:", err);
        return null;
    }
}

export default async function WorkWithUsPage() {
    const pageData = await getWorkWithUsData();

    // Verificación de seguridad para evitar errores de renderizado
    if (!pageData || !pageData.content) {
        return (
            <div className="py-40 text-center uppercase font-black tracking-widest">
                Contenido no disponible
            </div>
        );
    }

    const { content } = pageData;

    return (
        <>
            {/* SECCIÓN 1: HERO - Acceso corregido a "seccion banner" */}
            <div className="relative w-full h-[600px] md:h-[700px] lg:h-[620px] overflow-hidden group">
                <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-105">
                    <img
                        src={content["seccion banner"]?.imagen} 
                        alt={content["seccion banner"]?.titulo}
                        className="object-cover object-center w-full h-full"
                    />
                </div>
                <div className="absolute inset-0 bg-gray-600/50 z-10"></div>

                <div className="relative z-20 max-w-7xl h-full px-6 md:px-12 lg:px-47 flex flex-col justify-end pb-30">
                    <div className="space-y-2">
                        <div className="space-y-2">
                            <h2 className="text-[48px] md:text-[48px] font-bebas font-normal leading-[56px] tracking-[2px] text-black">
                                {content["seccion banner"]?.titulo}
                            </h2>
                            <p className="text-black text-[20px] md:text-[20px] font-[Oswald] font-medium leading-[30px] tracking-[0.18px] mt-4">
                                {content["seccion banner"]?.subtitulo}
                            </p>
                        </div>
                        <p className="text-black text-[16px] md:text-[16px] font-[Inter] font-normal leading-[26px] tracking-[0.18px] max-w-xl ">
                            {content["seccion banner"]?.descripcion}
                        </p>
                    </div>
                </div>
            </div>

            {/* SECCIÓN 2: QUIÉNES SOMOS COMO EQUIPO */}
            <div className="px-6 md:px-12 lg:px-47 py-24 ">
                <div className="max-w-7xl mx-auto">
                    <div className="rounded-2xl overflow-hidden mb-16 aspect-video md:aspect-[21/9] bg-gray-200">
                        <img 
                            src={content.quienes_somos_equipo?.imagen_equipo} 
                            className="w-full h-full object-cover " 
                            alt="Equipo Galaxia" 
                        />
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-12 items-start">
                        <h2 className="text-[48px] md:text-[48px] font-[Bebas_Neue] font-normal leading-[56px] tracking-[2px] md:text-5xl ">
                            {content.quienes_somos_equipo?.titulo_equipo}
                        </h2>
                        <p className="text-[16px] md:text-[16px] font-[Inter] font-normal leading-[26px] tracking-[0.18px] text-[#54585A]">
                            {content.quienes_somos_equipo?.contenido_equipo}
                        </p>
                    </div>
                </div>
            </div>

            {/* SECCIÓN 3: POR QUÉ TRABAJAR CON NOSOTROS (Pilares) */}
            <div className="bg-white py-6 px-6 md:px-12 lg:px-47">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-[48px] md:text-[48px] font-[Bebas_Neue] font-normal leading-[56px] tracking-[2px] text-center  mb-16">
                        {content.pilares_cultura?.titulo_valor}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {content.pilares_cultura?.items_pilares.map((pilar: any, index: number) => (
                            <div key={index} className="bg-[#e1e1e1] p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center group hover:shadow-md transition-all">
                                <div className="w-16 h-16 rounded-full border border-gray-200 mb-6 flex items-center justify-center overflow-hidden group-hover:bg-black transition-colors">
                                    <img src={pilar.imagen_pilar} alt={pilar.texto_pilar} className="w-full h-full object-cover group-hover:opacity-50" />
                                </div>
                                <span className="text-[16px] md:text-[16px] font-[Poppins] font-bold leading-[24px] tracking-[0.18px]">{pilar.texto_pilar}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* SECCIÓN 4: A QUIÉN BUSCAMOS (Perfil de Búsqueda) */}
            <div className="py-24 px-6 md:px-12 lg:px-47 bg-white">
                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
                    <div className="text-center lg:text-left space-y-6">
                        <h2 className="text-black text-[48px] md:text-[48px] font-bebas font-normal leading-[56px] tracking-[2px]">
                            {content.perfil_busqueda?.titulo_perfil}
                        </h2>
                        <p className="text-[20px] md:text-[20px] font-oswald font-medium leading-[30px] tracking-[0.18px]">
                            {content.perfil_busqueda?.subtitulo_perfil}
                        </p>
                    </div>
                    <div className="space-y-4">
                        {content.perfil_busqueda?.lista_requisitos.map((req: string, index: number) => (
                            <div key={index} className="flex rounded-sm items-center gap-4 p-4 border-b border-gray-100 hover:bg-black hover:text-white transition-colors cursor-default group">
                                <IoCheckmarkCircleSharp size={28} className="shrink-0 group-hover:text-white" />
                                <span className="text-[16px] md:text-[16px] font-[Poppins] font-bold leading-[24px] tracking-[0.18px]">{req}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* SECCIÓN 5: ÁREAS DE APLICACIÓN */}
            <div className="bg-gray-50 py-6 px-6 md:px-12 lg:px-47">
                <div className="max-w-7xl mx-auto text-center">
                    <h2 className="text-[48px] md:text-[48px] font-[Bebas_Neue] font-normal leading-[56px] tracking-[2px] mb-16">
                        {content.areas_aplicacion?.titulo_depts}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {content.areas_aplicacion?.lista_depts.map((dept: string, index: number) => (
                            <div key={index} className="bg-white py-10 px-6 rounded-lg text-[16px] md:text-[16px] font-[Poppins] font-bold leading-[24px] tracking-[0.18px] shadow-sm hover:bg-black hover:text-white transition-colors cursor-default">
                                {dept}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* SECCIÓN 6: CÓMO APLICAR (Banner Negro) */}
            <div className="bg-black py-24 text-center px-6">
                <h2 className="text-white text-[36px] md:text-[36px] font-bebas font-normal leading-[45px] tracking-[2px] mb-6">
                    {content.como_aplicar?.titulo_metodo}
                </h2>
                <p className="text-[16px] md:text-[16px] font-[Inter] font-normal leading-[26px] tracking-[0.18px]mb-8 max-w-2xl mx-auto text-[#FFFFFFAB]/67">
                    {content.como_aplicar?.instruccion_metodo}
                </p>
                <div className="space-y-2 text-[16px] md:text-[16px] font-[Poppins] font-bold leading-[24px] tracking-[0.18px]">
                    <p className="text-white text-xl md:text-2xl font-bold">{content.como_aplicar?.email_contacto}</p>
                    <p className="text-white text-xl md:text-2xl font-bold">{content.como_aplicar?.whatsapp_contacto}</p>
                </div>
            </div>

            {/* SECCIÓN 7: FOOTER DE CIERRE */}
            <div className="py-20 text-center space-y-8 bg-white">
                <p className="text-[20px] md:text-[20px] font-[Oswald] font-medium leading-[30px] tracking-[0.18px]">
                    {content.pie_pagina?.eslogan_pequeno}
                </p>
                <h3 className="text-[40px] md:text-[40px] font-[Bebas_Neue] font-normal leading-[49px] tracking-[2px]max-w-5xl mx-auto px-6">
                    {content.pie_pagina?.eslogan_principal}
                </h3>
              
            </div>
        </>
    );
}