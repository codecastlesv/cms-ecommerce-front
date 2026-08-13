/**
 * URLs y etiquetas de categoría sin segmentos N/A del catálogo Brilo/Excel.
 */

export function isNaCategoryLabel(name: string | null | undefined): boolean {
  if (!name?.trim()) {
    return true;
  }

  const normalized = name.trim().toUpperCase();
  return normalized === 'N/A' || normalized === 'NA';
}

/** Quita segmentos `-na-` / `-n-a-` del slug almacenado en BD. */
export function normalizeCategoryPublicSlug(slug: string): string {
  return slug
    .trim()
    .toLowerCase()
    .replace(/-(?:n-a|na)(?=-|$)/gi, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function getCategoryHref(slug: string): string {
  const clean = normalizeCategoryPublicSlug(slug);
  return clean ? `/${clean}` : '/';
}

/** 'Accesorio Deportivo > N/A > Mochilas' → 'Accesorio Deportivo > Mochilas' */
export function formatCategoryBreadcrumb(label: string | null | undefined): string {
  if (!label?.trim()) {
    return '';
  }

  return label
    .split('>')
    .map((part) => part.trim())
    .filter((part) => part && !isNaCategoryLabel(part))
    .join(' > ');
}

export function categorySlugsMatch(a: string, b: string): boolean {
  return normalizeCategoryPublicSlug(a) === normalizeCategoryPublicSlug(b);
}

export type CategoryBreadcrumbItem = {
  name: string;
  slug: string;
};

type CategoryNavNode = {
  name: string;
  slug: string;
  sub_categories?: CategoryNavNode[];
};

function cleanBreadcrumbItems(items: CategoryBreadcrumbItem[]): CategoryBreadcrumbItem[] {
  return items.filter((item) => item.name?.trim() && !isNaCategoryLabel(item.name));
}

function findNavBreadcrumbTrail(
  items: CategoryNavNode[],
  targetSlug: string,
): CategoryBreadcrumbItem[] {
  for (const item of items) {
    if (categorySlugsMatch(item.slug, targetSlug)) {
      return [{ name: item.name, slug: item.slug }];
    }
    if (item.sub_categories?.length) {
      const childTrail = findNavBreadcrumbTrail(item.sub_categories, targetSlug);
      if (childTrail.length > 0) {
        return [{ name: item.name, slug: item.slug }, ...childTrail];
      }
    }
  }

  return [];
}

/** Construye la ruta de migas para el catálogo (API + navegación lateral). */
export function buildCatalogBreadcrumbTrail(
  currentCategory: CategoryBreadcrumbItem,
  apiTrail: CategoryBreadcrumbItem[] | undefined,
  categoryNavigation: CategoryNavNode[],
  selectedSlug: string,
): CategoryBreadcrumbItem[] {
  const baseTrail = cleanBreadcrumbItems(apiTrail?.length ? apiTrail : [currentCategory]);

  if (categorySlugsMatch(selectedSlug, currentCategory.slug)) {
    return baseTrail;
  }

  const navTrail = cleanBreadcrumbItems(findNavBreadcrumbTrail(categoryNavigation, selectedSlug));

  if (navTrail.length === 0) {
    return baseTrail;
  }

  const seen = new Set(baseTrail.map((item) => normalizeCategoryPublicSlug(item.slug)));
  const merged = [...baseTrail];

  for (const item of navTrail) {
    const key = normalizeCategoryPublicSlug(item.slug);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    merged.push(item);
  }

  return merged;
}
