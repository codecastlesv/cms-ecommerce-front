'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/axios';
import { getCategoryHref } from '@/lib/categoryUrls';
import { SHOP_OPEN_AUTH_PANEL_EVENT } from '@/lib/shopAuthPanel';
import { Search, Menu, ChevronRight } from 'lucide-react';
import HamburMenu from './header/HamburMenu';
import type { MenuItem } from './header/HamburMenu';
import { MAIN_NAV, TOP_LINKS } from './header/navLinks';
import CartIcon from './header/CartIcon';
import SearchPanel from './header/SearchPanel';
import AccountAuthPanel from './header/AccountAuthPanel';
import AccountSessionButton from './header/AccountSessionButton';
import CartPreviewPanel from './header/CartPreviewPanel';

interface HeaderProps {
    settings?: Record<string, unknown> | null;
}

const NAVY = '#08204E';
const ACCENT_RED = '#CA1220';

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api')
    .replace(/:\/\/localhost(?=[:/]|$)/i, '://127.0.0.1')
    .replace(/\/api\/?$/, '');
const LOGO_URL = `${API_ORIGIN}/storage/branding/logo.webp`;

const TOP_INFO = ['Envios a todo El Salvador', 'Retira en sucursal', 'Asesoria experta'] as const;

export default function Header({ settings }: HeaderProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [logoFailed, setLogoFailed] = useState(false);
    const [tiendaHref, setTiendaHref] = useState('/product');

    useEffect(() => {
        api.get('/shop/menu')
            .then(({ data }) => {
                const firstCategory = data?.data?.[0];
                if (firstCategory?.slug) {
                    setTiendaHref(getCategoryHref(firstCategory.slug));
                }
            })
            .catch(() => {});
    }, []);

    const [navStack, setNavStack] = useState<MenuItem[]>([]);
    const [activeParent, setActiveParent] = useState<MenuItem | null>(null);
    const [activeChild, setActiveChild] = useState<MenuItem | null>(null);

    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [isCartOpen, setIsCartOpen] = useState(false);

    const brandName =
        typeof settings?.seo_title === 'string' ? settings.seo_title : 'Ferretería Castella Sagarra';

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

    const openCategoriesMenu = () => {
        setIsAuthOpen(false);
        setIsCartOpen(false);
        setIsSearchOpen(false);
        setIsMenuOpen(true);
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
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

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

    // Publica la altura real del header como variable CSS (--header-height) para que
    // cualquier elemento sticky/fixed (ej. sidebar de filtros) se acomode debajo sin
    // depender de un offset fijo que se desincroniza cada vez que el header cambia de tamaño.
    const headerRef = useRef<HTMLElement>(null);
    useEffect(() => {
        const el = headerRef.current;
        if (!el) return;

        const updateHeight = () => {
            document.documentElement.style.setProperty('--header-height', `${el.offsetHeight}px`);
        };

        updateHeight();
        const observer = new ResizeObserver(updateHeight);
        observer.observe(el);
        return () => observer.disconnect();
    }, [pathname]);

    return (
        <>
            <header
                ref={headerRef}
                key={`header-${pathname}`}
                suppressHydrationWarning
                className="sticky top-0 z-50 min-w-0 max-w-full overflow-x-clip font-helvetica shadow-sm"
            >
                {/* ——— Top bar ——— */}
                <div
                    className="text-white"
                    style={{ backgroundColor: NAVY }}
                >
                    <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3 px-3 py-2 text-sm leading-tight sm:gap-4 sm:px-6 sm:text-base lg:px-10 xl:px-14">
                        <div className="min-w-0 flex-1 overflow-hidden">
                            <div className="flex items-center gap-4 overflow-x-auto whitespace-nowrap sm:gap-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                                {TOP_INFO.map((text, i) => (
                                    <span
                                        key={text}
                                        className={i > 0 ? 'hidden sm:inline' : 'truncate'}
                                    >
                                        {text}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <nav className="hidden shrink-0 items-center gap-5 md:flex">
                            {TOP_LINKS.map((link) => (
                                <Link
                                    key={link.label}
                                    href={link.href}
                                    className="transition hover:opacity-80"
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </nav>
                    </div>
                </div>

                {/* ——— Main bar ——— */}
                <div className="border-b border-gray-200/80 bg-[#F5F6F8]">
                    <div className="mx-auto flex max-w-[1440px] min-w-0 flex-wrap items-center gap-2 px-3 py-3 sm:gap-3 sm:px-6 md:flex-nowrap md:gap-2 lg:gap-6 lg:px-10 xl:px-14 min-[992px]:gap-4">
                        {/* Logo */}
                        <Link href="/" className="flex max-w-[42%] shrink-0 items-center sm:max-w-none" aria-label={brandName}>
                            {logoFailed ? (
                                <div className="flex h-10 w-[5.75rem] items-center justify-center rounded-md border border-dashed border-slate-300 bg-white px-1.5 sm:h-12 sm:w-36 md:h-12 md:w-36 min-[992px]:h-14 min-[992px]:w-48">
                                    <span className="text-center text-[8px] font-semibold uppercase leading-tight tracking-wide text-slate-400 sm:text-[10px]">
                                        Logo
                                        <br />
                                        thumbnail
                                    </span>
                                </div>
                            ) : (
                                <img
                                    src={LOGO_URL}
                                    alt={brandName}
                                    onError={() => setLogoFailed(true)}
                                    className="h-12 w-auto max-w-36 object-contain sm:h-14 sm:max-w-48 md:h-14 md:max-w-48 min-[992px]:h-16 min-[992px]:max-w-56"
                                />
                            )}
                        </Link>

                        {/*
                          Desktop: entre logo y acciones.
                          Móvil abierto: fila completa debajo (order-last), sin absolute sobre logo/iconos.
                          768–991px: buscador visible; cuenta/carrito solo íconos (ver min-[992px] en esos componentes).
                        */}
                        <div
                            className={`min-w-0 max-w-full ${
                                isSearchOpen
                                    ? 'order-last w-full md:order-none md:flex-1'
                                    : 'hidden md:block md:min-w-0 md:flex-1'
                            }`}
                        >
                            <SearchPanel
                                isOpen={isSearchOpen}
                                onClose={() => setIsSearchOpen(false)}
                                onOpen={openSearchPanel}
                            />
                        </div>

                        <div className="ml-auto flex min-w-0 shrink-0 items-center gap-0.5 sm:gap-1 md:gap-1 min-[992px]:gap-4">
                            <button
                                type="button"
                                aria-label="Buscar"
                                onClick={openSearchPanel}
                                className={`rounded-full p-1.5 transition hover:bg-black/5 sm:p-2 md:hidden ${
                                    isSearchOpen ? 'invisible pointer-events-none' : ''
                                }`}
                            >
                                <Search className="h-5 w-5 stroke-[1.5] text-slate-900" />
                            </button>

                            <AccountSessionButton onGuestClick={openAuthPanel} variant="labeled" />
                            <CartIcon onOpen={openCartPanel} variant="labeled" />
                        </div>
                    </div>
                </div>

                {/* ——— Nav bar ——— */}
                <div className="text-white" style={{ backgroundColor: NAVY }}>
                    <div className="mx-auto flex max-w-[1440px] min-w-0 items-center gap-2 px-3 py-3.5 sm:gap-3 sm:px-6 lg:gap-6 lg:px-10 xl:px-14">
                        <button
                            type="button"
                            onClick={openCategoriesMenu}
                            className="flex min-w-0 shrink items-center gap-1.5 text-sm font-medium transition hover:opacity-90 sm:gap-2 sm:text-base"
                        >
                            <Menu className="h-5 w-5 shrink-0 stroke-[2]" />
                            <span className="hidden sm:inline">Todas las categorías</span>
                            <span className="truncate sm:hidden">Categorías</span>
                        </button>

                        <nav className="hidden min-w-0 flex-1 items-center justify-center gap-1 lg:flex xl:gap-2">
                            {MAIN_NAV.map((item) => {
                                const href = item.label === 'Tienda' ? tiendaHref : item.href;
                                const isActive = href !== '#' && pathname === href;

                                return (
                                    <Link
                                        key={item.label}
                                        href={href}
                                        aria-current={isActive ? 'page' : undefined}
                                        className={`whitespace-nowrap px-2.5 py-1 text-base transition hover:bg-white/10 xl:px-3 ${
                                            'highlight' in item && item.highlight
                                                ? 'rounded border-[#3B6FA8]/70 text-white'
                                                : 'rounded'
                                        } ${isActive ? 'bg-white/15 font-semibold border-b-3 border-b-red-600' : ''}`}
                                    >
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </nav>

                        <Link
                            href="#"
                            className="ml-auto flex shrink-0 items-center gap-0.5 text-sm font-bold uppercase tracking-wide transition hover:opacity-90 sm:text-base"
                            style={{ color: ACCENT_RED }}
                        >
                            <span className="hidden sm:inline">Ofertas especiales</span>
                            <span className="sm:hidden">Ofertas</span>
                            <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
                        </Link>
                    </div>
                </div>
            </header>

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
