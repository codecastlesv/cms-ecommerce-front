import CategoriesSlider from "@/components/shop/home/CategorySlider";
import api from "@/lib/axios";
import { IoCheckmarkCircleSharp } from "react-icons/io5";

// Función para obtener los datos del contenido y las categorías
async function getWholesalePageData() {
    try {
        const [contentRes, categoriesRes] = await Promise.all([
            api.get('/shop/contents/mayoreo'),
            api.get('/shop/categories')
        ]);

        return {
            pageData: contentRes.data?.data || null,
            categories: categoriesRes?.data?.data || categoriesRes?.data || []
        };
    } catch (err) {
        console.error("Error fetching wholesale data:", err);
        return { pageData: null, categories: [] };
    }
}

export default async function WhoseSale() {
    const { pageData, categories } = await getWholesalePageData();

    // Si no hay datos, podrías retornar un cargando o null
    if (!pageData) return <div className="py-20 text-center uppercase font-bold">Cargando contenido...</div>;

    const { content } = pageData;

    return (
        <>
            {/* Header Hero */}
            <div className="flex flex-col items-center text-center gap-4 my-16 md:my-30 px-4">
                <h1 className="text-4xl md:text-6xl font-bebas font-normal lg:text-[80px] lg:leading-[30px] tracking-[4px] text-black uppercase">
                    {content["seccion banner"].titulo}
                </h1>

                <div className="space-y-1 max-w-5xl">
                    <p className="text-gray-800 text-lg md:text-xl font-oswald font-medium lg:text-[24px] leading-[30px] tracking-[0.18px]">
                        {content["seccion banner"].subtitulo}
                    </p>
                    <p className="text-gray-600 text-base md:text-lg mt-5 font-inter font-normal lg:text-[18px] leading-[28px] tracking-[0.18px]">
                        {content["seccion banner"].descripcion}
                    </p>
                </div>

                <a href={content["seccion banner"].url_boton} className="bg-black text-white py-4 px-10 md:px-20 md:py-2 rounded-sm transition-all duration-300 hover:bg-zinc-800 hover:scale-105 active:scale-95 cursor-pointer shadow-lg hover:shadow-xl mt-0 font-inter font-semibold text-[18px] leading-[32px] tracking-[0.18px]">
                    {content["seccion banner"].texto_boton}
                </a>
            </div>

            {/* Banner Principal con Imagen del Endpoint */}
            <div className="w-full h-[300px] md:h-[500px] lg:h-[700px] overflow-hidden group">
                <img
                    src={content["seccion banner"].imagen_principal}
                    alt={pageData.title}
                    className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-110"
                />
            </div>

            <div className="px-8 lg:px-47">
                {/* Sección Historia / Respaldo */}
                <section className="py-16 md:py-20 border-b border-gray-100">
                    <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6">
                            <h2 className="text-3xl md:text-4xl lg:text-[56px] font-bebas font-normal leading-[56px] tracking-[3px] text-black uppercase">
                                {content.historia_respaldo.titulo_sobre}
                            </h2>
                            <div className="text-gray-700 text-base leading-relaxed font-normal lg:text-[16px] leading-[26px] tracking-[0.18px] space-y-4 font-inter">
                                <p>{content.historia_respaldo.contenido_sobre}</p>
                            </div>
                        </div>
                        <div className="aspect-square bg-gray-200 overflow-hidden rounded-lg shadow-sm">
                            <img
                                src={content.historia_respaldo.imagen_sobre}
                                alt="Historia Castella"
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                            />
                        </div>
                    </div>
                </section>

                {/* Sección Propuesta de Valor (Razones) */}
                <section className="py-16 md:py-20">
                    <div className="max-w-7xl mx-auto">
                        <div className="mb-12 md:w-2/3">
                            <h2 className="text-4xl md:text-5xl font-bebas font-normal lg:text-[56px] leading-[56px] tracking-[3px] text-black mb-6 uppercase">
                                {content.propuesta_valor.titulo_razones}
                            </h2>
                            <p className="text-gray-800 text-lg leading-snug font-inter font-normal lg:text-[18px] leading-[28px] tracking-[0.18px]">
                                {content.propuesta_valor.subtitulo_razones}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {content.propuesta_valor.items_razones.map((item: string, index: number) => (
                                <div
                                    key={index}
                                    className="bg-[#f7f7f7] p-8 flex items-center gap-4 rounded-lg transition-all duration-300 hover:bg-white hover:shadow-md hover:-translate-y-1 group"
                                >
                                    <span className="text-black shrink-0 transition-transform duration-300 group-hover:scale-110">
                                        <IoCheckmarkCircleSharp size={32} />
                                    </span>
                                    <p className="text-black font-poppins font-bold text-base leading-6 tracking-[0.18px]">
                                        {item}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Sección Beneficios Distribuidor */}
                <section className="py-16 md:py-20 border-b border-gray-100">
                    <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
                        <div className="aspect-square bg-gray-200 order-2 md:order-1 overflow-hidden rounded-lg">
                            <img
                                src={content.beneficios_distribuidor.imagen_beneficios}
                                alt="Beneficios Castella"
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                            />
                        </div>
                        <div className="space-y-8 order-1 md:order-2">
                            <h2 className="text-3xl md:text-4xl font-bebas font-normal lg:text-[56px] leading-[56px] tracking-[3px] text-right uppercase text-black md:text-end uppercase leading-none">
                                {content.beneficios_distribuidor.titulo_beneficios}
                            </h2>
                            <div className="space-y-3">
                                {content.beneficios_distribuidor.lista_beneficios.map((benefit: string, index: number) => (
                                    <div key={index} className="bg-gray-50 border border-gray-100 p-5 flex gap-4 items-center rounded-md transition-colors hover:bg-zinc-100">
                                        <IoCheckmarkCircleSharp size={24} className="text-black shrink-0" />
                                        <p className="text-black font-poppins font-bold text-base leading-6 tracking-[0.18px]">{benefit}</p>
                                    </div>
                                ))}
                            </div>
                            <p className="font-oswald font-medium text-[20px] text-center  text-gray-700">
                                {content.beneficios_distribuidor.frase_pie_beneficios}
                            </p>
                        </div>
                    </div>
                </section>
            </div>

            {/* Sección Líneas de Producto (Categories Slider dinámico) */}
            <section className="py-16 md:py-20 px-4 md:px-8 text-center bg-zinc-50">
                <div className="max-w-7xl mx-auto space-y-6 mb-12">
                    <h2 className="text-3xl md:text-4xl font-bebas font-normal text-[40px] lg:text-[56px] leading-[1] lg:leading-[56px] tracking-[3px] text-black uppercase">
                        LÍNEAS DE PRODUCTO DISPONIBLES
                    </h2>
                    <p className="text-gray-600 font-inter font-normal leading-[28px] tracking-[0.18px] text-[15px] md:text-[16px] lg:text-[18px]">Distribuye una marca completa y versátil</p>
                </div>
                <div className="max-w-[1400px] mx-auto px-4">
                    <CategoriesSlider categories={categories} />
                </div>
            </section>

            {/* Banner Negro CTA */}
            <section className="py-20 bg-black text-white px-6 overflow-hidden relative">
             
                <div className="flex flex-col lg:flex-row gap-8 items-center justify-center lg:justify-between max-w-6xl mx-auto">

                    
                    <div className="font-bebas font-normal flex items-center justify-center leading-[33px] tracking-[1.5px] text-[20px] md:text-[24px] lg:text-[28px] uppercase lg:text-left md:px-45">
                        <p className="text-center ">{content.banner_oscuro.titulo_banner}</p>
                    </div>
 
                    <a
                        href="#contacto"
                        className="bg-white text-black px-10 py-4 font-inter font-semibold tracking-[0.18px] text-[14px] md:text-[15px] lg:text-[16px] hover:bg-zinc-200 transition-all duration-300 rounded-sm tracking-widest hover:scale-105 active:scale-95 shadow-xl lg:flex-shrink-0"
                    >
                        {content.banner_oscuro.texto_boton_banner}
                    </a>

                </div>
            </section>

            {/* Formulario y Cierre */}
            <div className="px-6 lg:px-47 bg-white">
                <section id="contacto" className="py-16 md:py-24 max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-16 items-start">
                        <div className="space-y-6">
                            <h2 className="text-3xl font-bebas font-normal leading-[56px] tracking-[3px]  text-[32px] md:text-[44px] lg:text-[56px] text-black uppercase">
                                {content.formulario.titulo_form}
                            </h2>
                            <p className="text-gray-600 font-inter font-normal leading-[28px] tracking-[0.18px] text-[15px] md:text-[16px] lg:text-[18px] max-w-sm">
                                {content.formulario.descripcion_form}
                            </p>

                      
                        </div>

                        <form className="space-y-4">
                            {/* Inputs del formulario... (se mantienen iguales) */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <input type="text" placeholder="Nombre de la empresa*" className="w-full border border-[#54585AAB] focus:border-black outline-none p-4 text-sm rounded-md transition-all" required />
                                <input type="text" placeholder="Nombre del contacto*" className="w-full border border-[#54585AAB] focus:border-black outline-none p-4 text-sm rounded-md transition-all" required />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <input type="tel" placeholder="Número de teléfono*" className="w-full border border-[#54585AAB] focus:border-black outline-none p-4 text-sm rounded-md transition-all" required />
                                <input type="email" placeholder="Correo electrónico*" className="w-full border border-[#54585AAB] focus:border-black outline-none p-4 text-sm rounded-md transition-all" required />
                            </div>
                            <textarea placeholder="Comentarios adicionales" rows={4} className="w-full border border-[#54585AAB] focus:border-black outline-none p-4 text-sm rounded-md resize-none transition-all"></textarea>

                            <div className="flex justify-center md:justify-center">
                                <button type="submit" className="w-full md:w-auto px-16 bg-black text-white py-4 font-bold text-sm hover:bg-zinc-800 transition-all rounded-sm uppercase tracking-widest shadow-lg active:scale-95">
                                    {content.formulario.texto_boton_form}
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="mt-10 text-center max-w-6xl md:px-80">
                        <hr className="border-gray-100 mb-10" />
                        <h3 className="text-2xl md:text-3xl lg:text-4xl   text-black uppercase font-bebas font-normal text-[40px] leading-[49px] tracking-[2px] text-center">
                            {content.formulario.titulo_cierre}
                        </h3>
                        <p className="font-inter font-normal text-[18px] leading-7 tracking-[0.18px] text-center">
                            {content.formulario.subtitulo_cierre}
                        </p>
                    </div>
                </section>
            </div>
        </>
    );
}