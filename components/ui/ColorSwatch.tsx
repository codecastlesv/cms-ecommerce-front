interface Props {
    color?: string | null;
    secondary?: string | null;
    image?: string | null;
    size?: 'sm' | 'md' | 'lg' | 'fill';
    shape?: 'circle' | 'square';
    /** Texto del tooltip; si no se pasa, se usa el hex (solo uso interno / admin). */
    title?: string | null;
    className?: string;
}

export function ColorSwatch({
    color,
    secondary,
    image,
    size = 'md',
    shape = 'circle',
    title,
    className = '',
}: Props) {

    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-6 h-6',
        lg: 'w-8 h-8',
        fill: 'w-full h-full',
    };

    const radiusClass = shape === 'square' ? 'rounded-sm' : 'rounded-full';
    const baseClass = `${sizeClasses[size]} ${radiusClass} border border-slate-200 shadow-sm shrink-0 ${className}`;

    const tooltip = title?.trim() || undefined;

    if (image) {
        return (
            <div
                className={`${baseClass} bg-cover bg-center bg-no-repeat`}
                style={{ backgroundImage: `url(${image})` }}
                title={tooltip}
            />
        );
    }

    if (!color) return <div className={`${baseClass} bg-slate-100`} title={tooltip}></div>;

    if (secondary) {
        return (
            <div
                className={baseClass}
                style={{ background: `linear-gradient(135deg, ${color} 50%, ${secondary} 50%)` }}
                title={tooltip}
            />
        );
    }

    return (
        <div
            className={baseClass}
            style={{ backgroundColor: color }}
            title={tooltip}
        />
    );
}