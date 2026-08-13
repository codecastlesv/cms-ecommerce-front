/**
 * Precio de oferta del API: solo es válido si es un número > 0.
 * Evita tratar 0, null, "", "-" como oferta (mostraba $0.00 y "Oferta -100%").
 */
export function parsePositiveSalePrice(raw: unknown): number | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'string') {
    const t = raw.trim();
    if (
      t === '' ||
      t === '-' ||
      t === '—' ||
      t.toLowerCase() === 'null' ||
      t.toLowerCase() === 'undefined'
    ) {
      return null;
    }
    const normalized = t.replace(/\s/g, '').replace(',', '.');
    const n = Number(normalized);
    if (!Number.isFinite(n) || n <= 0) return null;
    return n;
  }
  if (typeof raw === 'number') {
    if (!Number.isFinite(raw) || raw <= 0) return null;
    return raw;
  }
  return null;
}
