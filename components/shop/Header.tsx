'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { SHOP_OPEN_AUTH_PANEL_EVENT } from '@/lib/shopAuthPanel';
import { Search, Menu, Heart } from 'lucide-react';
import HamburMenu from './header/HamburMenu';
import type { MenuItem } from './header/HamburMenu';
import CartIcon from './header/CartIcon';     // Componente del Carrito de Compras
import SearchPanel from './header/SearchPanel'; // Componente de la busqueda de algun producto
import AccountAuthPanel from './header/AccountAuthPanel';
import AccountSessionButton from './header/AccountSessionButton';
import CartPreviewPanel from './header/CartPreviewPanel';

interface HeaderProps {
    settings?: Record<string, unknown> | null;
}

export default function Header({ settings }: HeaderProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const shouldReduceMotion = useReducedMotion();

    const [navStack, setNavStack] = useState<MenuItem[]>([]);
    const [activeParent, setActiveParent] = useState<MenuItem | null>(null);
    const [activeChild, setActiveChild] = useState<MenuItem | null>(null);

    // Estado para controlar si el SearchPanel está abierto
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [isCartOpen, setIsCartOpen] = useState(false);

    const openCartPanel = () => {
        setIsSearchOpen(false);
        setIsAuthOpen(false);
        closeMenu();
        setIsCartOpen(true);
    };

    const openAuthPanel = () => {
        setIsSearchOpen(false);
        setIsCartOpen(false);
        closeMenu();
        setIsAuthOpen(true);
    };

    const closeMenu = () => {
        setIsMenuOpen(false);
        setNavStack([]);
        setActiveParent(null);
        setActiveChild(null);
    };

    const openSearchPanel = () => {
        setIsAuthOpen(false);
        setIsCartOpen(false);
        closeMenu();
        setIsSearchOpen(true);
    };

    const handleWishlist = () => {
        const shopToken =
            typeof window !== 'undefined' ? localStorage.getItem('shop_token') : null;
        if (shopToken) {
            router.push('/wishlist');
        } else {
            openAuthPanel();
        }
    };

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 1024);
        checkMobile();
        window.addEventListener('resize', checkMobile);

        const handleScroll = () => setIsScrolled(window.scrollY > 10);
        window.addEventListener('scroll', handleScroll);

        return () => {
            window.removeEventListener('resize', checkMobile);
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    // Scroll lock + compensación scrollbar + empuje del layout (menú izq / cuenta derecha)
    useEffect(() => {
        const root = document.documentElement;
        const body = document.body;
        const anyOpen = isMenuOpen || isAuthOpen || isCartOpen;

        if (!anyOpen) {
            root.classList.remove(
                'galaxia-hamburger-open',
                'galaxia-auth-drawer-open',
                'galaxia-cart-drawer-open',
            );
            root.style.overflow = '';
            body.style.overflow = '';
            body.style.paddingRight = '';
            return;
        }

        const scrollbarW = window.innerWidth - root.clientWidth;
        root.style.overflow = 'hidden';
        body.style.overflow = 'hidden';
        body.style.paddingRight = scrollbarW > 0 ? `${scrollbarW}px` : '';

        root.classList.remove('galaxia-hamburger-open', 'galaxia-auth-drawer-open', 'galaxia-cart-drawer-open');
        if (isMenuOpen) root.classList.add('galaxia-hamburger-open');
        else if (isAuthOpen) root.classList.add('galaxia-auth-drawer-open');
        else if (isCartOpen) root.classList.add('galaxia-cart-drawer-open');
    }, [isMenuOpen, isAuthOpen, isCartOpen]);

    useEffect(() => {
        return () => {
            const root = document.documentElement;
            const body = document.body;
            root.classList.remove(
                'galaxia-hamburger-open',
                'galaxia-auth-drawer-open',
                'galaxia-cart-drawer-open',
            );
            root.style.overflow = '';
            body.style.overflow = '';
            body.style.paddingRight = '';
        };
    }, []);

    useEffect(() => {
        const onOpenShopAuth = () => {
            setIsSearchOpen(false);
            setIsMenuOpen(false);
            setIsCartOpen(false);
            setIsAuthOpen(true);
        };
        window.addEventListener(SHOP_OPEN_AUTH_PANEL_EVENT, onOpenShopAuth);
        return () => window.removeEventListener(SHOP_OPEN_AUTH_PANEL_EVENT, onOpenShopAuth);
    }, []);

    return (
        <>
            <motion.main
                key={`shipping-${pathname}`}
                suppressHydrationWarning
                className={`text-center bg-[#F7F7F7] relative z-40 overflow-hidden transition-all duration-300 ${
                    isScrolled ? 'max-h-0 py-0 opacity-0' : 'max-h-10 py-2 opacity-100'
                }`}
                initial={{ opacity: 0, y: -10, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
                <motion.p
                    initial={shouldReduceMotion ? false : { opacity: 0, y: -4 }}
                    animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                    transition={{ duration: 0.55, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
                    className='font-inter font-bold text-[12px] leading-[18px] tracking-[0.2px] text-center align-middle'
                >
                    Envios a todo El Salvador
                </motion.p>
            </motion.main>

            <motion.header
                key={`header-${pathname}`}
                suppressHydrationWarning
                className={`sticky top-0 z-50 transition-all duration-300 bg-white ${isScrolled ? 'py-2 shadow-sm' : 'py-4'}`}
                initial={{ opacity: 0, y: -12, scale: 0.992 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.55, delay: 0.03, ease: [0.16, 1, 0.3, 1] }}
            >
                <div className="container mx-auto px-4 relative bg-white">
                    <div className="flex items-center gap-3 md:gap-4 lg:px-12 xl:px-20">

                        <motion.button
                            type="button"
                            onClick={() => {
                                setIsAuthOpen(false);
                                setIsCartOpen(false);
                                setIsMenuOpen(true);
                            }}
                            whileHover={shouldReduceMotion ? undefined : { scale: 1.06 }}
                            whileTap={shouldReduceMotion ? undefined : { scale: 0.94 }}
                            className="flex-shrink-0 hover:opacity-70 transition-all cursor-pointer p-2 hover:bg-gray-50 rounded-full"
                        >
                            <Menu className="w-7 h-7 stroke-[1.5]" />
                        </motion.button>

                        <Link href="/" className="flex-shrink-0">
                            <img
                                src="/logo/logo.png"
                                alt={typeof settings?.seo_title === 'string' ? settings.seo_title : 'Galaxia Deportes'}
                                className="h-10 w-auto max-w-[42vw] object-contain sm:max-w-[46vw] md:h-12 md:max-w-none"
                            />
                        </Link>

                        {/* Buscador: ocupa el centro del header (Best Buy) */}
                        <div
                            className={`${
                                isSearchOpen
                                    ? 'absolute inset-x-4 top-1/2 z-[60] -translate-y-1/2 md:static md:inset-auto md:top-auto md:z-auto md:translate-y-0'
                                    : 'hidden md:block'
                            } relative mx-4 min-w-0 flex-1 max-w-4xl`}
                        >
                            <SearchPanel
                                isOpen={isSearchOpen}
                                onClose={() => setIsSearchOpen(false)}
                                onOpen={openSearchPanel}
                            />
                        </div>

                        <div className="ml-auto flex flex-shrink-0 flex-nowrap items-center justify-end gap-1 md:gap-3">
                            {/* Móvil: ícono abre el buscador integrado */}
                            <button
                                type="button"
                                aria-label="Buscar"
                                onClick={openSearchPanel}
                                className={`flex flex-shrink-0 rounded-full p-1.5 transition hover:bg-gray-100 active:scale-[0.97] md:hidden ${
                                    isSearchOpen ? 'invisible pointer-events-none' : ''
                                }`}
                            >
                                <Search className="h-6 w-6 stroke-[1.5] text-black" />
                            </button>

                            <Link
                                href="/galaxia-factory"
                                className="hidden lg:block font-inter flex-shrink-0 text-[12px] font-normal uppercase leading-[18px] tracking-[0.2px] text-black transition hover:text-zinc-600"
                            >
                                GALAXIA FACTORY
                            </Link>

                            <div className="mx-1 hidden h-6 w-[1px] flex-shrink-0 bg-gray-200 md:block" />

                            <div className="flex flex-shrink-0 items-center gap-0.5 md:gap-3 lg:gap-4">
                                <AccountSessionButton onGuestClick={openAuthPanel} />
                                <button
                                    type="button"
                                    aria-label="Favoritos"
                                    onClick={handleWishlist}
                                    className="hidden flex-shrink-0 rounded-full p-1.5 transition hover:bg-gray-100 md:flex md:items-center md:justify-center md:p-2"
                                >
                                    <Heart className="h-[22px] w-[22px] stroke-[1.5] md:h-6 md:w-6" />
                                </button>
                                <CartIcon onOpen={openCartPanel} />
                            </div>
                        </div>
                    </div>
                </div>
            </motion.header>

            {/* COMPONENTE MENÚ HAMBURGUESA */}
            <HamburMenu
                isOpen={isMenuOpen}
                onClose={closeMenu}
                isMobile={isMobile}
                navStack={navStack}
                setNavStack={setNavStack}
                activeParent={activeParent}
                setActiveParent={setActiveParent}
                activeChild={activeChild}
                setActiveChild={setActiveChild}
                onWishlistClick={handleWishlist}
            />

            <AccountAuthPanel isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

            <CartPreviewPanel isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        </>
    );
}