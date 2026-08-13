'use client';

import Link from 'next/link';
import {
  buildCatalogBreadcrumbTrail,
  formatCategoryBreadcrumb,
  getCategoryHref,
  type CategoryBreadcrumbItem,
} from '@/lib/categoryUrls';

interface CategoryNavItem {
  id: number;
  name: string;
  slug: string;
  products_count?: number;
  sub_categories?: CategoryNavItem[];
}

interface CategoryBreadcrumbsProps {
  currentCategory: CategoryBreadcrumbItem;
  categoryBreadcrumb?: CategoryBreadcrumbItem[];
  categoryNavigation?: CategoryNavItem[];
  selectedCategorySlug: string;
  className?: string;
}

function breadcrumbLabel(name: string): string {
  return formatCategoryBreadcrumb(name) || name.trim();
}

export default function CategoryBreadcrumbs({
  currentCategory,
  categoryBreadcrumb,
  categoryNavigation = [],
  selectedCategorySlug,
  className = '',
}: CategoryBreadcrumbsProps) {
  const trail = buildCatalogBreadcrumbTrail(
    currentCategory,
    categoryBreadcrumb,
    categoryNavigation,
    selectedCategorySlug,
  );

  if (trail.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className={`font-inter ${className}`}>
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-gray-500">
        <li className="inline-flex items-center gap-1.5">
          <Link href="/" className="transition-colors hover:text-gray-800">
            Inicio
          </Link>
        </li>

        {trail.map((crumb, index) => {
          const isLast = index === trail.length - 1;
          const label = breadcrumbLabel(crumb.name);

          return (
            <li key={`${crumb.slug}-${index}`} className="inline-flex items-center gap-1.5">
              <span aria-hidden className="text-gray-300">
                &gt;
              </span>
              {isLast ? (
                <span className="font-medium text-gray-800" aria-current="page">
                  {label}
                </span>
              ) : (
                <Link
                  href={getCategoryHref(crumb.slug)}
                  className="transition-colors hover:text-gray-800"
                >
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
