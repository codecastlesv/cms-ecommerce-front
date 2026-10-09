import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SHOP_PUBLIC_ORIGIN } from '@/lib/shopPublicOrigin';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') ?? '';
  const isNgrok = host.includes('ngrok');
  const { pathname } = request.nextUrl;

  // El banco debe poder POST/GET el callback 3DS en el túnel.
  if (pathname.startsWith('/powertranz/merchant-response')) {
    return NextResponse.next();
  }

  // Cualquier otra visita por ngrok vuelve a localhost para no romper CORS/loopback.
  if (isNgrok) {
    const local = new URL(pathname + request.nextUrl.search, SHOP_PUBLIC_ORIGIN);
    return NextResponse.redirect(local);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
