/** Orden canónico de tallas de ropa (de menor a mayor). */
const APPAREL_SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const;

const APPAREL_SIZE_RANK = new Map<string, number>(
  APPAREL_SIZE_ORDER.map((size, index) => [size, index]),
);

function normalizeApparelSize(size: string): string {
  return size.trim().toUpperCase().replace(/\s+/g, '');
}

function apparelSizeRank(size: string): number | null {
  const normalized = normalizeApparelSize(size);
  const rank = APPAREL_SIZE_RANK.get(normalized);

  return rank !== undefined ? rank : null;
}

/** Compara dos tallas para ordenar: XS → S → M → L → XL → XXL; luego numéricas; luego alfabético. */
export function compareSizes(a: string, b: string): number {
  if (!a || !b) return 0;

  const aRank = apparelSizeRank(a);
  const bRank = apparelSizeRank(b);

  if (aRank !== null && bRank !== null) {
    return aRank - bRank;
  }
  if (aRank !== null) return -1;
  if (bRank !== null) return 1;

  const aNum = Number(a);
  const bNum = Number(b);
  if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) {
    return aNum - bNum;
  }

  return a.localeCompare(b, 'es', { sensitivity: 'base' });
}

export function sortSizes<T extends string>(sizes: T[]): T[] {
  return [...sizes].sort(compareSizes);
}
