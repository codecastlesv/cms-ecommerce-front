"use client";

import { Children, useState } from "react";
import { motion, useReducedMotion } from 'framer-motion';
import { FaFacebook, FaInstagram, FaYoutube, FaLinkedinIn, FaChevronDown } from "react-icons/fa";
import { SiTiktok } from "react-icons/si";
import Link from 'next/link';

type FooterColumnProps = {
  title: string;
  id: string;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: (section: string) => void;
};

const FooterColumn = ({ title, id, children, isOpen, onToggle }: FooterColumnProps) => {
  const items = Children.toArray(children);

  return (
    <div className="border-b border-white/25 md:border-none">
      <button
        onClick={() => onToggle(id)}
        className="w-full flex justify-between items-center py-6 md:py-0 md:cursor-default outline-none"
      >
        <h5 className="font-poppins font-black text-lg uppercase tracking-tight md:mb-6">{title}</h5>
        <FaChevronDown className={`md:hidden transition-transform duration-500 ease-out ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <div
        className={`overflow-hidden transition-[max-height,opacity,padding] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] md:max-h-none ${
          isOpen ? 'max-h-[560px] pb-6 opacity-100' : 'max-h-0 pb-0 opacity-0 md:opacity-100'
        }`}
      >
        <div className="space-y-4 font-inter font-medium text-[14px] leading-[22px] tracking-[0.2px]">
          {items.map((child, index) => (
            <div
              key={`${id}-${index}`}
              className={`transition-all duration-500 ease-out ${
                isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 md:opacity-100 md:translate-y-0'
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
      className="font-inter bg-black text-white pt-16 pb-8 border-t border-gray-900 top-0 z-50 "
      initial={shouldReduceMotion ? false : { opacity: 0, y: 18, scale: 0.99 }}
      whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
      viewport={shouldReduceMotion ? undefined : { once: true, amount: 0.18 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="container mx-auto px-6 md:px-16">

        {/* Grilla Principal */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-0 md:gap-12 mb-16">

          {/* Columna 1 - Logo y Redes (Siempre visible) */}
          <div className="mb-2 flex flex-col items-start space-y-2 border-b border-white/25 pb-6 md:mb-0 md:items-center md:border-none md:pb-0">
            <div className="flex flex-col items-start md:items-center w-full">
              <img
                src="/logo/logoblanco.png"
                alt="Castella Sagarra"
                className="mb-6 w-20 md:w-32"
              />
              <p className="font-inter font-medium text-[14px] leading-[22px] tracking-[0.2px] text-left md:text-center text-gray-300 max-w-[280px]">
                Lorem Ipsum is simply dummy text of the printing and typesetting industry.
              </p>
            </div>

            <div className="hidden w-full items-center justify-start gap-5 md:flex md:justify-center">
              <a href="#" className="hover:opacity-70 transition text-white"><FaFacebook size={24} /></a>
              <a href="#" className="hover:opacity-70 transition text-white"><FaInstagram size={24} /></a>
              <a href="#" className="hover:opacity-70 transition text-white"><SiTiktok size={20} /></a>
              <a href="#" className="hover:opacity-70 transition text-white"><FaYoutube size={24} /></a>
              <a href="#" className="hover:opacity-70 transition text-white"><FaLinkedinIn size={24} /></a>
            </div>
          </div>

          {/* Columna 2 - Contáctanos */}
          <FooterColumn title="Contáctanos" id="contact" isOpen={openSection === 'contact'} onToggle={toggleSection}>
            <li className="flex items-center gap-3">WhatsApp</li>
            <Link href="/tiendas" className="flex items-center gap-3"><li>Tiendas</li></Link>
          </FooterColumn>

          {/* Columna 3 - Nosotros */}
          <FooterColumn title="Nosotros" id="about" isOpen={openSection === 'about'} onToggle={toggleSection}>
            <Link href="/"  className="flex items-center gap-3"><li >List</li></Link>
            
          </FooterColumn>

          {/* Columna 4 - Servicio al Cliente */}
          <FooterColumn title="Servicio al Cliente" id="service" isOpen={openSection === 'service'} onToggle={toggleSection}>
            <li className="flex items-center gap-3">Términos y condiciones</li>
            <li className="flex items-center gap-3">Cambios y devoluciones</li>
          </FooterColumn>
        </div>

      
       

          <div className="flex flex-col gap-6 md:mx-20 md:flex-row md:justify-between md:gap-4">

            <div className="order-4 flex flex-wrap gap-2 pt-2 text-[11px] tracking-widest text-gray-500 md:order-1">
              <span className="uppercase">© 2026 CASTELLA SAGARRA</span>
              <span className="hidden md:inline">|</span>
              <Link href="/terminos" className="hover:text-white">Términos</Link>
              <span className="hidden md:inline">|</span>
              <Link href="/privacidad" className="hover:text-white">Privacidad</Link>
            </div>


            <div className="order-1 flex flex-wrap gap-2 pt-2 text-[11px] tracking-widest text-gray-500 md:order-2">
              <h5 className="mb-2 font-poppins text-lg font-black uppercase tracking-tight md:mb-4 md:hidden">Compras</h5>
              <span className="hidden md:block text-xs text-gray-500 ">Compra con confianza y seguridad</span>
            </div>


            <div className="order-2 flex items-center gap-4 md:order-3">
              {/* Metodos de pago */}
              <img src="/home/metodosPago/visa.png" alt="Visa" className="h-7 md:h-6 opacity-90" />
              <img src="/home/metodosPago/mastercard.png" alt="Mastercard" className="h-7 md:h-6 opacity-90" />
              <img src="/home/metodosPago/amex.png" alt="Amex" className="h-7 md:h-6 opacity-90" />
              <img src="/home/metodosPago/paypal.png" alt="Paypal" className="h-7 md:h-6 opacity-90" />
            </div>

            <div className="order-3 flex w-full items-center gap-5 md:hidden">
              <a href="#" className="hover:opacity-70 transition text-white"><FaFacebook size={24} /></a>
              <a href="#" className="hover:opacity-70 transition text-white"><FaInstagram size={24} /></a>
              <a href="#" className="hover:opacity-70 transition text-white"><SiTiktok size={20} /></a>
              <a href="#" className="hover:opacity-70 transition text-white"><FaYoutube size={24} /></a>
              <a href="#" className="hover:opacity-70 transition text-white"><FaLinkedinIn size={24} /></a>
            </div>

          </div>

       
      </div>
    </motion.footer>
  );
};

export default Footer;