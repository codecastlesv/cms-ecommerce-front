import React from 'react';

interface BadgeProps {
    children: React.ReactNode;
    variant?: 'success' | 'danger' | 'warning' | 'neutral' | 'info';
    className?: string;
}

export default function Badge({
    children,
    variant = 'neutral',
    className = ''
}: BadgeProps) {

    const variants = {
        success: 'bg-green-100 text-green-700 border-green-200',
        danger: 'bg-red-100 text-red-700 border-red-200',
        warning: 'bg-orange-100 text-orange-700 border-orange-200',
        neutral: 'bg-slate-100 text-slate-600 border-slate-200',
        info: 'bg-blue-100 text-blue-700 border-blue-200',
    };

    const variantStyles = variants[variant] || variants.neutral;

    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${variantStyles} ${className}`}>
            {children}
        </span>
    );
}