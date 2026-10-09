import { NextRequest, NextResponse } from 'next/server';
import { SHOP_PUBLIC_ORIGIN } from '@/lib/shopPublicOrigin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function extractSpiTokenFromParams(params: URLSearchParams): string | null {
  const candidates = ['SpiToken', 'spiToken', 'spi_token', 'token'];
  for (const key of candidates) {
    const value = params.get(key);
    if (value && value.trim() !== '') {
      return value.trim();
    }
  }

  const responseField = params.get('Response');
  if (responseField) {
    try {
      const decoded = JSON.parse(responseField) as { SpiToken?: string; spiToken?: string };
      const nested = decoded.SpiToken ?? decoded.spiToken;
      if (typeof nested === 'string' && nested.trim() !== '') {
        return nested.trim();
      }
    } catch {
      // ignore malformed nested JSON
    }
  }

  return null;
}

async function extractSpiToken(request: NextRequest): Promise<string | null> {
  const fromQuery = extractSpiTokenFromParams(request.nextUrl.searchParams);
  if (fromQuery) {
    return fromQuery;
  }

  const contentType = request.headers.get('content-type') ?? '';

  try {
    if (contentType.includes('application/json')) {
      const json = (await request.json()) as Record<string, unknown>;
      const fromJson = json.SpiToken ?? json.spiToken ?? json.spi_token;
      if (typeof fromJson === 'string' && fromJson.trim() !== '') {
        return fromJson.trim();
      }
      return null;
    }

    const raw = await request.text();
    if (!raw) {
      return null;
    }

    if (raw.trim().startsWith('{')) {
      try {
        const json = JSON.parse(raw) as Record<string, unknown>;
        const fromJson = json.SpiToken ?? json.spiToken ?? json.spi_token;
        if (typeof fromJson === 'string' && fromJson.trim() !== '') {
          return fromJson.trim();
        }
      } catch {
        // fall through to form parsing
      }
    }

    return extractSpiTokenFromParams(new URLSearchParams(raw));
  } catch {
    return null;
  }
}

function breakoutHtml(spiToken: string | null): NextResponse {
  const target = spiToken
    ? `${SHOP_PUBLIC_ORIGIN}/checkout/verify?token=${encodeURIComponent(spiToken)}`
    : `${SHOP_PUBLIC_ORIGIN}/checkout/error`;

  const html = `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <title>3-D Secure</title>
    <script>
      (function () {
        var target = ${JSON.stringify(target)};
        var token = ${JSON.stringify(spiToken ?? '')};
        var payload = { type: 'powertranz-3ds-complete', token: token };
        try {
          if (window.parent && window.parent !== window) {
            window.parent.postMessage(payload, ${JSON.stringify(SHOP_PUBLIC_ORIGIN)});
            window.parent.postMessage(payload, 'http://127.0.0.1:3000');
          }
        } catch (e) {}
        try {
          window.top.location.href = target;
        } catch (e) {
          window.location.href = target;
        }
      })();
    </script>
  </head>
  <body>
    <p>Completando autenticación…</p>
  </body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

export async function GET(request: NextRequest) {
  return breakoutHtml(await extractSpiToken(request));
}

export async function POST(request: NextRequest) {
  return breakoutHtml(await extractSpiToken(request));
}
