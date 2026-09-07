import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

export function AdminPanel({
    title,
    description,
    children,
    className,
}: {
    title?: string;
    description?: string;
    children: ReactNode;
    className?: string;
}) {
    return (
        <section
            className={cn(
                'rounded-[10px] bg-[var(--shop-surface)] p-4 shadow-[var(--shop-shadow)] md:p-6',
                className,
            )}
        >
            {title && (
                <header className="mb-4">
                    <h2 className="font-semibold">{title}</h2>
                    {description && <p className="mt-1 text-sm text-[var(--shop-text-muted)]">{description}</p>}
                </header>
            )}
            {children}
        </section>
    );
}
