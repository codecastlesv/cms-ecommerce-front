import type { ProductVariant } from '@/types';

/** Nombre legible del color de una variante (mayúsculas, para UI admin). */
export function getVariantColorLabel(variant: ProductVariant): string | null {
    const direct = variant.variant_color?.trim();
    if (direct && direct.toUpperCase() !== 'N/A') {
        return direct.toUpperCase();
    }

    const attrs = variant.attributes_json;
    if (attrs && typeof attrs === 'object') {
        const fromAttrs =
            attrs.color
            ?? attrs.Color
            ?? attrs.COLOR
            ?? attrs.colour
            ?? attrs.Colour;

        if (fromAttrs != null && String(fromAttrs).trim() !== '') {
            return String(fromAttrs).trim().toUpperCase();
        }
    }

    return null;
}

/**
 * Clave de agrupación en el formulario admin (estilo → código, si no color, si no «Sin grupo»).
 */
export function getVariantGroupKey(variant: ProductVariant): string {
    const style = variant.style_code?.trim();
    if (style) {
        return style;
    }

    const color = getVariantColorLabel(variant);
    if (color) {
        return color;
    }

    return 'Sin grupo';
}

/** Deep link desde el listado: apunta al bloque de estilo en el formulario. */
export function resolveStyleRowGroupKey(variants: ProductVariant[], styleCode: string): string {
    const code = styleCode?.trim();
    if (code && code !== '—') {
        return code;
    }

    if (variants.length > 0) {
        return getVariantGroupKey(variants[0]);
    }

    return 'Sin grupo';
}

/** Id DOM estable para auto-scroll a un bloque de variantes (estilo o color legacy). */
export function colorGroupElementId(groupKey: string): string {
    return `variant-group-${encodeURIComponent(groupKey)}`;
}

export type VariantDeepLinkMode = 'style' | 'color';

/** Lee `?style=` (prioritario) o `?color=` (legacy) desde query params. */
export function resolveVariantDeepLinkTarget(params: {
    style?: string | null;
    color?: string | null;
}): { target: string | null; mode: VariantDeepLinkMode | null } {
    const style = params.style?.trim();
    if (style) {
        return { target: style, mode: 'style' };
    }

    const color = params.color?.trim();
    if (color) {
        return { target: color, mode: 'color' };
    }

    return { target: null, mode: null };
}

/** URL de edición admin con deep link al bloque de estilo. */
export function buildAdminProductVariantEditUrl(productId: number | string, styleCode: string): string {
    return `/products/${productId}?style=${encodeURIComponent(styleCode)}`;
}

/**
 * Resuelve el bloque de variantes para auto-scroll.
 * - mode `style`: coincide por código de estilo (grupo actual).
 * - mode `color`: legacy — resuelve por nombre de color en las filas del grupo.
 */
export function resolveVariantGroupScrollKey(
    groups: Array<{ groupKey: string; groupVariants: ProductVariant[] }>,
    target: string,
    mode: VariantDeepLinkMode = 'style',
): string | null {
    const normalizedTarget = target.trim();
    if (!normalizedTarget) {
        return null;
    }

    const targetUpper = normalizedTarget.toUpperCase();

    if (mode === 'style') {
        const byStyle = groups.find(
            (g) => g.groupKey === normalizedTarget || g.groupKey.toUpperCase() === targetUpper,
        );

        return byStyle?.groupKey ?? null;
    }

    const byColor = groups.find((g) =>
        g.groupVariants.some((v) => {
            const color = getVariantColorLabel(v);
            return color !== null && color === targetUpper;
        }),
    );

    return byColor?.groupKey ?? null;
}
