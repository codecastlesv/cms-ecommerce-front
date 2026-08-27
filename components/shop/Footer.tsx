"use client";

import { Children, useState } from "react";
import { motion, useReducedMotion } from 'framer-motion';
import { FaFacebook, FaInstagram, FaYoutube, FaWhatsapp, FaChevronDown } from "react-icons/fa";
import { Phone, Mail, Clock } from "lucide-react";
import Link from 'next/link';

type FooterColumnProps = {
  title: string;
  id: string;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: (section: string) => void;
  className?: string;
};

const FooterColumn = ({ title, id, children, isOpen, onToggle, className = '' }: FooterColumnProps) => {
  const items = Children.toArray(children);

  return (
    <div className={`border-b border-white/25 lg:border-none ${className}`}>
      <button
        onClick={() => onToggle(id)}
        className="w-full flex justify-between items-center py-6 lg:py-0 lg:cursor-default outline-none"
      >
        <h5 className="font-helvetica font-black text-lg uppercase tracking-tight lg:mb-6">{title}</h5>
        <FaChevronDown className={`lg:hidden transition-transform duration-500 ease-out ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <div
        className={`overflow-hidden transition-[max-height,opacity,padding] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] lg:max-h-none ${
          isOpen ? 'max-h-[560px] pb-6 opacity-100' : 'max-h-0 pb-0 opacity-0 lg:opacity-100'
        }`}
      >
        <div className="space-y-4 font-helvetica font-medium text-[14px] leading-[22px] tracking-[0.2px]">
          {items.map((child, index) => (
            <div
              key={`${id}-${index}`}
              className={`transition-all duration-500 ease-out ${
                isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 lg:opacity-100 lg:translate-y-0'
              }`}
              style={{ transitionDelay: isOpen ? `${80 + index * 70}ms` : '0ms' }}
            >
              {child}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Footer = () => {
  const [openSection, setOpenSection] = useState<string | null>(null);
  const shouldReduceMotion = useReducedMotion();

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  return (
    <motion.footer
      id="footer"
      className="font-helvetica bg-[#08204E] text-white pt-16 pb-8 border-t border-gray-900 top-0 z-50 "
      initial={shouldReduceMotion ? false : { opacity: 0, y: 18, scale: 0.99 }}
      whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
      viewport={shouldReduceMotion ? undefined : { once: true, amount: 0.18 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="container mx-auto px-6 lg:px-12">

        {/* Grilla Principal */}
        <div className="flex flex-col gap-16 lg:flex-row lg:items-start mb-16">

          {/* Columna 1 - Logo y Redes (Siempre visible, ancho fijo, fuera del grid de enlaces) */}
          <div className="mb-2 flex flex-col items-start space-y-2 border-b border-white/25 pb-6 lg:mb-0 lg:w-52 lg:shrink-0 lg:items-center lg:border-none lg:pb-0">
            <div className="flex flex-col items-start lg:items-center w-full">
              <img
                src="/logo/logoblanco.png"
                alt="Ferretería Castella Sagarra"
                className="mb-6 w-44 lg:w-full"
              />
            </div>

            <div className="hidden w-full items-center justify-start gap-5 lg:flex lg:justify-center">
              <a href="#" className="hover:opacity-70 transition text-white"><FaFacebook size={24} /></a>
              <a href="#" className="hover:opacity-70 transition text-white"><FaInstagram size={24} /></a>
              <a href="#" className="hover:opacity-70 transition text-white"><FaYoutube size={24} /></a>
              <a href="#" className="hover:opacity-70 transition text-white"><FaWhatsapp size={24} /></a>
            </div>
          </div>

          {/* Columnas de enlaces - reparten el espacio restante */}
          <div className="flex flex-col gap-8 lg:flex-1 lg:grid lg:grid-cols-[1fr_1fr_1fr_1.15fr]">

            {/* Columna 2 - Información */}
            <FooterColumn title="Información" id="info" isOpen={openSection === 'info'} onToggle={toggleSection}>
              <li className="flex items-center gap-3">Nosotros</li>
              <Link href="/tiendas" className="flex items-center gap-3"><li>Sucursales</li></Link>
              <li className="flex items-center gap-3">Términos y condiciones</li>
              <li className="flex items-center gap-3">Políticas de privacidad</li>
            </FooterColumn>

            {/* Columna 3 - Ayuda */}
            <FooterColumn title="Ayuda" id="help" isOpen={openSection === 'help'} onToggle={toggleSection}>
              <li className="flex items-center gap-3">Preguntas frecuentes</li>
              <li className="flex items-center gap-3">Envíos y entregas</li>
              <li className="flex items-center gap-3">Devoluciones</li>
              <li className="flex items-center gap-3">Garantías</li>
              <li className="flex items-center gap-3">Contáctanos</li>
            </FooterColumn>

            {/* Columna 4 - Mi cuenta */}
            <FooterColumn title="Mi cuenta" id="account" isOpen={openSection === 'account'} onToggle={toggleSection}>
              <Link href="/order/history" className="flex items-center gap-3"><li>Mis pedidos</li></Link>
              <Link href="/wishlist" className="flex items-center gap-3"><li>Mis Favoritos</li></Link>
              <li className="flex items-center gap-3">Direcciones</li>
              <li className="flex items-center gap-3">Métodos de pago</li>
            </FooterColumn>

            {/* Columna 5 - Contáctos */}
            <FooterColumn title="Contáctos" id="contact" isOpen={openSection === 'contact'} onToggle={toggleSection}>
              <li className="flex items-center gap-3"><Phone size={16} className="shrink-0" /> 2298 - 3033</li>
              <li className="flex items-center gap-3"><Phone size={16} className="shrink-0" /> 7318 - 3559</li>
              <li className="flex items-center gap-3"><Mail size={16} className="shrink-0" /> <span className="wrap-break-word">Ventas@castellasagarra.com</span></li>
              <li className="flex items-start gap-3"><Clock size={16} className="mt-0.5 shrink-0" /> <span>Lun-Vie: 7:30 am - 6:00 pm<br />Sáb: 7:30 am - 1:00</span></li>
            </FooterColumn>
          </div>
        </div>

      
       

          <div className="flex flex-col gap-6 lg:mx-20 lg:flex-row lg:justify-between lg:gap-4">

            <div className="order-4 flex flex-wrap gap-2 pt-2 text-[11px] tracking-widest text-gray-500 lg:order-1">
              <span>2026 Ferretería Castella Sagarra S.A. de C.V Todos los derechos reservados.</span>
            </div>


            <div className="order-1 flex flex-wrap gap-2 pt-2 text-[11px] tracking-widest text-gray-500 lg:order-2">
              <h5 className="mb-2 font-helvetica text-lg font-black uppercase tracking-tight lg:mb-4 lg:hidden">Compras</h5>
              <span className="hidden lg:block text-xs text-gray-500 ">Compra con confianza y seguridad</span>
            </div>


            <div className="order-2 hidden items-center gap-4 lg:order-3">
              {/* Metodos de pago */}
              <img src="/home/metodosPago/visa.png" alt="Visa" className="h-7 lg:h-6 opacity-90" />
              <img src="/home/metodosPago/mastercard.png" alt="Mastercard" className="h-7 lg:h-6 opacity-90" />
              <img src="/home/metodosPago/amex.png" alt="Amex" className="h-7 lg:h-6 opacity-90" />
              <img src="/home/metodosPago/paypal.png" alt="Paypal" className="h-7 lg:h-6 opacity-90" />
            </div>

            <div className="order-3 flex w-full items-center gap-5 lg:hidden">
              <a href="#" className="hover:opacity-70 transition text-white"><FaFacebook size={24} /></a>
              <a href="#" className="hover:opacity-70 transition text-white"><FaInstagram size={24} /></a>
              <a href="#" className="hover:opacity-70 transition text-white"><FaYoutube size={24} /></a>
              <a href="#" className="hover:opacity-70 transition text-white"><FaWhatsapp size={24} /></a>
            </div>

          </div>

       
      </div>
    </motion.footer>
  );
};

export default Footer;