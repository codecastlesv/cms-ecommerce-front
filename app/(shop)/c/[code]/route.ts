import { NextRequest, NextResponse } from 'next/server';

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api').replace(
  /:\/\/localhost(?=[:/]|$)/i,
  '://127.0.0.1',
);

const ATTRIBUTION_COOKIE = 'castella_campaign_attribution';
const ATTRIBUTION_DAYS = 7;

export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const origin = request.nextUrl.origin;

  let resolved: {
    campaign_link_id: number;
    campaign_slug: string;
    utm_source: string | null;
    utm_medium: string | null;
    utm_campaign: string;
  } | null = null;

  try {
    const res = await fetch(`${API_ORIGIN}/shop/campaign-links/${encodeURIComponent(code)}`, {
      cache: 'no-store',
    });
    if (res.ok) {
      resolved = await res.json();
    }
  } catch {
    resolved = null;
  }

  if (!resolved) {
    return NextResponse.redirect(`${origin}/`);
  }

  const destination = new URL(`${origin}/promos/${resolved.campaign_slug}`);
  if (resolved.utm_source) destination.searchParams.set('utm_source', resolved.utm_source);
  if (resolved.utm_medium) destination.searchParams.set('utm_medium', resolved.utm_medium);
  destination.searchParams.set('utm_campaign', resolved.utm_campaign);

  const response = NextResponse.redirect(destination);

  response.cookies.set(ATTRIBUTION_COOKIE, JSON.stringify({
    campaign_link_id: resolved.campaign_link_id,
    utm_source: resolved.utm_source,
    utm_medium: resolved.utm_medium,
    utm_campaign: resolved.utm_campaign,
  }), {
    maxAge: ATTRIBUTION_DAYS * 24 * 60 * 60,
    path: '/',
    sameSite: 'lax',
  });

  return response;
}
