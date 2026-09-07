import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes } from 'react';

const variants = {
    primary:
        'bg-[var(--shop-accent)] text-[var(--shop-on-accent)] hover:bg-[var(--shop-accent-hi)]',
    secondary:
        'border border-[var(--shop-border)] bg-[var(--shop-surface)] text-[var(--shop-text)] hover:bg-[var(--shop-bg)]',
    ghost: 'text-[var(--shop-text-muted)] hover:bg-[var(--shop-bg)] hover:text-[var(--shop-text)]',
    danger: 'text-[var(--shop-danger)] hover:bg-[color-mix(in_srgb,var(--shop-danger)_10%,white)]',
};

export const adminBtnClass = {
    primary: cn(
        'inline-flex h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50',
        variants.primary,
    ),
    secondary: cn(
        'inline-flex h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50',
        variants.secondary,
    ),
    ghost: cn(
        'inline-flex h-11 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50',
        variants.ghost,
    ),
    danger: cn(
        'inline-flex h-11 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50',
        variants.danger,
    ),
};

export function AdminButton({
    variant = 'primary',
    className,
    type = 'button',
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof variants }) {
    return <button type={type} className={cn(adminBtnClass[variant], className)} {...props} />;
}
