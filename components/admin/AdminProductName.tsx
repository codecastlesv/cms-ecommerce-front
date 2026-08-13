/** Clase Tailwind estándar para nombres de producto en el panel admin. */
export const ADMIN_PRODUCT_NAME_CLASS = 'uppercase';

type AdminProductNameProps = {
    name: string;
    className?: string;
    as?: 'span' | 'p' | 'h1';
    title?: string;
};

/**
 * Muestra el nombre de un producto siempre en mayúsculas dentro del administrador.
 */
export function AdminProductName({
    name,
    className = '',
    as: Tag = 'span',
    title,
}: AdminProductNameProps) {
    const mergedClassName = [ADMIN_PRODUCT_NAME_CLASS, className].filter(Boolean).join(' ');

    return (
        <Tag className={mergedClassName} title={title ?? name}>
            {name}
        </Tag>
    );
}
