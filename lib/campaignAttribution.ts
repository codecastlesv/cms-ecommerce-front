const ATTRIBUTION_COOKIE = 'castella_campaign_attribution';

interface CampaignAttribution {
  campaign_link_id: number;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string;
}

/** Lee la cookie que pone /c/[code] al redirigir (ver app/(shop)/c/[code]/route.ts). */
export function getCampaignAttribution(): CampaignAttribution | null {
  if (typeof document === 'undefined') return null;

  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${ATTRIBUTION_COOKIE}=`));

  if (!match) return null;

  try {
    const raw = decodeURIComponent(match.split('=').slice(1).join('='));
    return JSON.parse(raw) as CampaignAttribution;
  } catch {
    return null;
  }
}
