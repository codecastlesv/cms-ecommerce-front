'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';
import { getCategoryHref } from '@/lib/categoryUrls';
import { MAIN_NAV, TOP_LINKS } from './navLinks';
import { motion, useReducedMotion } from 'framer-motion';

export type MenuItem = {
    id: string | number;
    name: string;
    slug: string;
    children?: MenuItem[];
};

function isNaGroupName(name: string | null | undefined): boolean {
    if (!name?.trim()) {
        return true;
    }

    const normalized = name.trim().toUpperCase();
    return normalized === 'N/A' || normalized === 'NA';
}

function parentHasOnlyNaChildren(item: MenuItem): boolean {
    const children = item.children ?? [];
    if (children.length === 0) {
        return false;
    }

    return children.every((child) => isNaGroupName(child.name));
}

function getVisibleSubmenuChildren(item: MenuItem): MenuItem[] {
    return (item.children ?? []).filter((child) => !isNaGroupName(child.name));
}

function getDirectLeafChildren(item: MenuItem): MenuItem[] {
    const naChild = (item.children ?? []).find((child) => isNaGroupName(child.name));
    return naChild?.children ?? [];
}

/** Padre con subcategorías finales sin nivel de género (N/A colapsado o API aplanada). */
function getFlatCatalogLeaves(item: MenuItem): MenuItem[] {
    const children = item.children ?? [];
    if (children.length === 0) {
        return [];
    }

    if (parentHasOnlyNaChildren(item)) {
        return getDirectLeafChildren(item);
    }

    const allDirectLeaves = children.every(
        (child) => !child.children || child.children.length === 0,
    );

    return allDirectLeaves ? children : [];
}

function parentUsesFlatCatalogPanel(item: MenuItem): boolean {
    return getFlatCatalogLeaves(item).length > 0;
}

function capitalizeTitle(text: string): string {
    const trimmed = text.trim();
    if (!trimmed) {
        return '';
    }

    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

function getLeafPanelTitle(parent: MenuItem, child: MenuItem | null, collapsed: boolean): string {
    if (collapsed) {
        return capitalizeTitle(parent.name);
    }

    if (child && !isNaGroupName(child.name)) {
        return `${capitalizeTitle(parent.name)} ${capitalizeTitle(child.name)}`;
    }

    return capitalizeTitle(child?.name ?? parent.name);
}

function getMobileDrillTarget(item: MenuItem): MenuItem {
    const flatLeaves = getFlatCatalogLeaves(item);
    if (flatLeaves.length > 0) {
        return {
            id: `collapsed-${item.id}`,
            name: item.name,
            slug: item.slug,
            children: flatLeaves,
        };
    }

    return item;
}

interface HamburMenuProps {
    isOpen: boolean;
    onClose: () => void;
    isMobile: boolean;
    navStack: MenuItem[];
    setNavStack: (stack: MenuItem[]) => void;
    activeParent: MenuItem | null;
    setActiveParent: (item: MenuItem | null) => void;
    activeChild: MenuItem | null;
    setActiveChild: (item: MenuItem | null) => void;
    onWishlistClick?: () => void;
}

export default function HamburMenu({
    isOpen, onClose, isMobile, navStack = [], setNavStack,
    activeParent, setActiveParent, activeChild, setActiveChild,
    onWishlistClick,
}: HamburMenuProps) {
    const [hasMounted, setHasMounted] = useState(false);
    const [menuData, setMenuData] = useState<MenuItem[]>(() => {
        if (typeof window === 'undefined') {
            return [];
        }

        const savedMenu = localStorage.getItem('galaxia_menu_cache');
        return savedMenu ? JSON.parse(savedMenu) : [];
    });
    const shouldReduceMotion = useReducedMotion();

    useEffect(() => {
        setHasMounted(true);
    }, []);

    // Sincronizar con la API (siempre refleja el estado actual de categorías en BD)
    useEffect(() => {
        let cancelled = false;

        const fetchMenu = async () => {
            try {
                const response = await api.get('/shop/menu');
                if (cancelled) return;

                const categories = Array.isArray(response.data?.data) ? response.data.data : [];

                setMenuData(categories);

                if (categories.length > 0) {
                    localStorage.setItem('galaxia_menu_cache', JSON.stringify(categories));
                } else {
                    localStorage.removeItem('galaxia_menu_cache');
                }
            } catch (error) {
                console.error('Error sincronizando menú:', error);
            }
        };

        fetchMenu();

        return () => {
            cancelled = true;
        };
    }, [isOpen]);

    const safeStack = Array.isArray(navStack) ? navStack : [];
    const currentMobileLevel = safeStack.length > 0
        ? safeStack[safeStack.length - 1]
        : { name: 'Menú', children: menuData };

    const isDesktopFlatCatalog =
        !isMobile && Boolean(activeParent) && parentUsesFlatCatalogPanel(activeParent!);

    const flatCatalogLeaves =
        isDesktopFlatCatalog && activeParent ? getFlatCatalogLeaves(activeParent) : [];

    const showDesktopSubmenu =
        !isMobile &&
        Boolean(activeParent) &&
        !isDesktopFlatCatalog &&
        getVisibleSubmenuChildren(activeParent!).length > 0;

    const desktopLeafItems = isDesktopFlatCatalog
        ? flatCatalogLeaves
        : (activeChild?.children ?? []);

    const showDesktopLeaf =
        !isMobile &&
        (isDesktopFlatCatalog
            ? flatCatalogLeaves.length > 0
            : (activeChild?.children?.length ?? 0) > 0);

    const desktopLeafTitle =
        activeParent && isDesktopFlatCatalog
            ? capitalizeTitle(activeParent.name)
            : activeParent
              ? getLeafPanelTitle(activeParent, activeChild, false)
              : '';

    const panelVariants = {
        closed: { opacity: 0, x: -24 },
        open: { opacity: 1, x: 0 },
    };

    const itemVariants = {
        closed: { opacity: 0, y: 14 },
        open: (index: number) => ({
            opacity: 1,
            y: 0,
            transition: { delay: 0.08 + index * 0.05, duration: 0.45, ease: [0.16, 1, 0.3, 1] as const },
        }),
    };

    /** Catálogos virtuales · mismos slugs que `/shop/store/catalog/{slug}` */
    const specialCatalogLinkClass =
        'block w-full rounded-sm px-1 py-2 font-inter text-[13px] font-bold tracking-[0.18px] text-white transition hover:underline hover:underline-offset-4';
    const highlightCatalogLinkClass =
        'block w-full rounded-sm px-1 py-2 font-inter text-[13px] font-bold tracking-[0.18px] text-[#c1001f] transition hover:underline hover:underline-offset-4';

    /** Menús del header (Ofertas/Tienda/... y Sucursales/Ayuda/Contáctanos) replicados en mobile. */
    const siteNavLinkClass =
        'block w-full rounded-sm px-1 py-2 font-inter text-[13px] font-bold uppercase tracking-[0.18px] text-zinc-700 transition hover:text-black';

    /** "Tienda" apunta a la primera categoría, igual que en el header de escritorio. */
    const mobileTiendaHref = menuData[0]?.slug ? getCategoryHref(menuData[0].slug) : '/product';

    const menuLayer = (
        <div
            className={`fixed inset-0 z-[60] flex transition-opacity duration-500 ease-[cubic-bezier(0.33,1,0.36,1)] ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            aria-hidden={!isOpen}
        >
            <div
                className={`absolute inset-0 bg-black/40 transition-opacity duration-500 ease-[cubic-bezier(0.33,1,0.36,1)] ${isOpen ? 'opacity-100' : 'opacity-0'}`}
                onClick={onClose}
            />

            <motion.div
                className="relative z-10 flex h-full bg-[#304c94] shadow-2xl"
                variants={panelVariants}
                initial="closed"
                animate={isOpen ? 'open' : 'closed'}
                transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            >
                <div className="flex h-full shadow-2xl">
                {isMobile ? (
                    /* --- VISTA MÓVIL --- */
                    <div className="flex h-full w-[85vw] max-w-[350px] flex-col border-r border-white/15 bg-[#304c94] shadow-[4px_0_24px_-8px_rgba(15,23,42,0.12)]">
                        <div className="grid shrink-0 grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] items-center gap-1 border-b border-white/15 bg-[#304c94] px-2 py-3">
                                {safeStack.length > 0 ? (
                                    <button
                                        type="button"
                                        aria-label="Volver"
                                        onClick={() => setNavStack(safeStack.slice(0, -1))}
                                        className="flex h-10 w-10 items-center justify-center justify-self-start rounded-full text-white transition hover:bg-white/10 active:scale-[0.97]"
                                    >
                                        <ChevronLeft className="h-6 w-6" strokeWidth={2} />
                                    </button>
                                ) : (
                                    <span className="h-10 w-10 justify-self-start" aria-hidden />
                                )}
                                <span className="min-w-0 truncate text-center font-inter text-[11px] font-bold capitalize tracking-[0.2em] text-white/80">
                                    {safeStack.length > 0 ? capitalizeTitle(currentMobileLevel.name) : 'Menú'}
                                </span>
                                <button
                                    type="button"
                                    aria-label="Cerrar menú"
                                    onClick={onClose}
                                    className="flex h-10 w-10 items-center justify-center justify-self-end rounded-full text-white transition hover:bg-white/10"
                                >
                                    <X className="h-5 w-5" strokeWidth={2} />
                                </button>
                            </div>
                        <div className="flex-1 overflow-y-auto">
                            {safeStack.length === 0 && (
                                <motion.div
                                    className="border-b border-white/15 px-5 pb-3 pt-1"
                                    initial={shouldReduceMotion ? false : 'closed'}
                                    animate={isOpen ? 'open' : 'closed'}
                                >
                                    <motion.div custom={0} variants={itemVariants}>
                                        <Link href="/lo-nuevo" className={highlightCatalogLinkClass} onClick={onClose}>
                                            Lo nuevo
                                        </Link>
                                    </motion.div>
                                    <motion.div custom={1} variants={itemVariants}>
                                        <Link href="/promociones" className={highlightCatalogLinkClass} onClick={onClose}>
                                            Promociones
                                        </Link>
                                    </motion.div>
                                    <motion.div custom={2} variants={itemVariants}>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                onClose();
                                                onWishlistClick?.();
                                            }}
                                            className={`${specialCatalogLinkClass} w-full text-left`}
                                        >
                                            Favoritos
                                        </button>
                                    </motion.div>
                                </motion.div>
                            )}

                            {safeStack.length === 0 && (
                                <motion.div
                                    className="border-b border-gray-100 px-5 py-3"
                                    initial={shouldReduceMotion ? false : 'closed'}
                                    animate={isOpen ? 'open' : 'closed'}
                                >
                                    {MAIN_NAV.map((item, index) => (
                                        <motion.div key={item.label} custom={index} variants={itemVariants}>
                                            <Link
                                                href={item.label === 'Tienda' ? mobileTiendaHref : item.href}
                                                className={siteNavLinkClass}
                                                onClick={onClose}
                                            >
                                                {item.label}
                                            </Link>
                                        </motion.div>
                                    ))}
                                    {TOP_LINKS.map((link, index) => (
                                        <motion.div key={link.label} custom={MAIN_NAV.length + index} variants={itemVariants}>
                                            <Link href={link.href} className={siteNavLinkClass} onClick={onClose}>
                                                {link.label}
                                            </Link>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            )}
                            {currentMobileLevel.children?.map((item, index: number) => {
                                const hasChildren = item.children && item.children.length > 0;
                                return (
                                    <motion.div
                                        key={item.id}
                                        className="w-full flex"
                                        custom={index}
                                        variants={itemVariants}
                                        initial={shouldReduceMotion ? false : 'closed'}
                                        animate={isOpen ? 'open' : 'closed'}
                                    >
                                        <Link
                                            href={getCategoryHref(item.slug)}
                                            className="flex flex-grow items-center justify-between border-b border-l-4 border-white/10 border-l-transparent p-5 text-left hover:bg-white/10 focus:border-l-white active:bg-white/10"
                                            onClick={onClose}
                                        >
                                            <span className="text-sm font-bold capitalize text-white">{capitalizeTitle(item.name)}</span>
                                        </Link>
                                        {hasChildren && (
                                            <button
                                                onClick={() => setNavStack([...safeStack, getMobileDrillTarget(item)])}
                                                className="flex items-center justify-center border-l border-white/15 px-4 hover:bg-white/10"
                                                title="Ver subcategorías"
                                            >
                                                <ChevronRight className="h-4 w-4 text-white" />
                                            </button>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    /* --- VISTA ESCRITORIO --- */
                    <div className="flex h-full">
                        {/* COLUMNA 1 */}
                        <div className="relative flex w-[400px] flex-col border-r border-white/15 bg-[#08204E] py-6">
                            <div className="flex items-start justify-between p-6 pl-8">
                                <img src="/logo/logoblanco.png" className="h-10 w-auto" alt="Logo" />
                               <button onClick={onClose} className="group ml-auto cursor-pointer rounded-full p-2 text-white transition duration-300 hover:bg-white/10">
                                <X className="h-5 w-5 transition-transform duration-300 hover:rotate-90" />
                                </button>
                            </div>
                            <div className="flex flex-col gap-1 pl-9">
                                <Link
                                    href="/lo-nuevo"
                                    className="font-inter text-[14px] font-bold leading-[26px] tracking-[0.18px] text-[#c1001f] hover:underline hover:underline-offset-4"
                                    onClick={onClose}
                                >
                                    Lo nuevo
                                </Link>
                                <Link
                                    href="/promociones"
                                    className="font-inter text-[14px] font-bold leading-[26px] tracking-[0.18px] text-[#c1001f] hover:underline hover:underline-offset-4"
                                    onClick={onClose}
                                >
                                    Promociones
                                </Link>
                            </div>

                            <nav className="flex-1 overflow-y-auto">
                                {menuData.map((item) => {
                                    const hasChildren = item.children && item.children.length > 0;
                                    const isActive = activeParent?.id === item.id;
                                    return (
                                        <Link
                                            key={item.id}
                                            href={getCategoryHref(item.slug)}
                                            onClick={onClose}
                                            className={`flex cursor-pointer items-center justify-between border-l-6 px-8 py-4 font-inter text-[10px] font-normal leading-[26px] tracking-[0.18px] transition-all hover:bg-white/10 ${isActive
                                                ? 'border-l-white bg-white/15 font-extrabold'
                                                : 'border-l-transparent text-white/80'}`}
                                            onMouseEnter={() => {
                                                if (hasChildren) {
                                                    setActiveParent(item);
                                                    setActiveChild(null);
                                                }
                                            }}
                                        >
                                            <div className="grid w-full grid-cols-2 items-center gap-x-2">
                                                <span className="text-[13px] font-bold capitalize tracking-wider text-white">
                                                    {capitalizeTitle(item.name)}
                                                </span>
                                                <div className='flex justify-end'>
                                                    {hasChildren && <ChevronRight className="h-5 w-5 text-white transition-colors" />}
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </nav>
                        </div>

                        {/* COLUMNA 2 — ancho animado + contenido con slide */}
                        <div
                            className={`galaxia-menu-col-reveal h-full shrink-0 overflow-hidden bg-[#304c94] ${showDesktopSubmenu ? 'max-w-[280px] border-r border-white/15' : 'max-w-0'
                                }`}
                        >
                            {showDesktopSubmenu && activeParent && (
                                <div
                                    key={`sub-${activeParent.id}`}
                                    className="galaxia-menu-submenu-inner h-full w-[280px] shrink-0 bg-[#304c94] py-10"
                                >
                                    {getVisibleSubmenuChildren(activeParent).map((sub) => {
                                        const hasSubChildren = sub.children && sub.children.length > 0;
                                        const isSubActive = activeChild?.id === sub.id;
                                        return (
                                            <Link
                                                key={sub.id}
                                                href={getCategoryHref(sub.slug)}
                                                onClick={onClose}
                                                className={`flex cursor-pointer items-center justify-between border-l-4 px-8 py-3 font-inter text-[10px] font-normal leading-[26px] tracking-[0.18px] transition-all hover:bg-white/10 ${isSubActive
                                                    ? 'border-l-white bg-white/15 font-bold'
                                                    : 'border-l-transparent text-white/80'}`}
                                                onMouseEnter={() => {
                                                    if (hasSubChildren) {
                                                        setActiveChild(sub);
                                                    }
                                                }}
                                            >
                                                <span className="text-[13px] font-bold capitalize text-white">{capitalizeTitle(sub.name)}</span>
                                                {hasSubChildren && <ChevronRight className="h-4 w-4 text-white" />}
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* COLUMNA 3 — panel ancho (grid de subcategorías) */}
                        <div
                            className={`galaxia-menu-col-reveal h-full shrink-0 overflow-hidden bg-[#304c94] ${
                                showDesktopLeaf ? 'max-w-[950px] border-r border-white/15' : 'max-w-0'
                            }`}
                        >
                            {showDesktopLeaf && activeParent && (
                                <div
                                    key={`leaf-${isDesktopFlatCatalog ? activeParent.id : activeChild?.id}`}
                                    className="galaxia-menu-leaf-inner h-full min-w-0 max-w-[950px] shrink-0 overflow-y-auto bg-[#08204E] p-12 lg:min-w-[650px]"
                                >
                                    <h3 className="mb-4 font-inter text-[14px] font-bold capitalize leading-[20px] tracking-[0.18px] tracking-tighter text-white">
                                        {desktopLeafTitle}
                                    </h3>
                                    <div className="grid grid-cols-3 gap-x-12 gap-y-3">
                                        {desktopLeafItems.map((leaf) => (
                                            <Link
                                                key={leaf.id}
                                                href={getCategoryHref(leaf.slug)}
                                                className="block py-1 font-inter text-[12px] capitalize leading-[18px] tracking-[0.2px] text-white/75 transition-all hover:translate-x-1 hover:text-white"
                                                onClick={onClose}
                                            >
                                                {capitalizeTitle(leaf.name)}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                </div>
            </motion.div>
        </div>
    );

    // Evita mismatch de hidratación: en SSR no hay document; el portal solo tras el primer commit en cliente.
    if (!hasMounted) return null;
    return createPortal(menuLayer, document.body);
}