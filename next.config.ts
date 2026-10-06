import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'prcastella-api.olimpotec.net',
        port: '8443',
        pathname: '/**',
      },
    ],
  },
  // Solo rewrites (pretty URL → ruta real).
  // NO poner redirects inversos (/info/history → /historia): con Turbopack
  // eso crea un ciclo y termina en 404.
  async rewrites() {
    return [
      { source: "/embajadores", destination: "/info/ambassadors" },
      { source: "/uniformes-personalizados", destination: "/info/customuniforms" },
      { source: "/galaxia-factory", destination: "/info/factory" },
      { source: "/giftcard", destination: "/info/giftcard" },
      { source: "/historia", destination: "/info/history" },
      { source: "/tiendas", destination: "/info/locations" },
      { source: "/starcard", destination: "/info/starcard" },
      { source: "/mayoreo", destination: "/info/wholesale" },
      { source: "/talento", destination: "/info/workwithus" },
      { source: "/distribuidores-instaladores", destination: "/info/partners" },
    ];
  },
};

export default nextConfig;
