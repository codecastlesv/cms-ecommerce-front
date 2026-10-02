export const TOP_LINKS = [
    { label: 'Sucursales', href: '/tiendas' },
    { label: 'Ayuda', href: '#footer' },
    { label: 'Contáctanos', href: '#footer' },
] as const;

// "Proyectos e inspiración" y "Servicio" ocultos temporalmente a pedido del cliente.
export const MAIN_NAV = [
    { label: 'Ofertas', href: '/', highlight: true },
    { label: 'Tienda', href: '/tienda' },
    { label: 'Marcas', href: '/marcas' },
    { label: 'Nosotros', href: '/nosotros' },
    { label: 'Alianzas', href: '/distribuidores-instaladores' },
] as const;
