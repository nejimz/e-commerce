import { Link } from '@inertiajs/react';
import type { ReactNode } from 'react';

export function ShopSectionHeader({
    title,
    eyebrow,
    href,
    actionLabel = 'View all',
    children,
}: {
    title: string;
    eyebrow?: string;
    href?: string;
    actionLabel?: string;
    children?: ReactNode;
}) {
    return (
        <div className="mb-6 flex items-end justify-between gap-4 md:mb-8">
            <div>
                {eyebrow && <p className="shop-caption mb-2 uppercase tracking-[0.16em] text-[var(--shop-text-muted)]">{eyebrow}</p>}
                <h2 className="shop-h2">{title}</h2>
                {children}
            </div>
            {href && (
                <Link href={href} className="shop-caption shrink-0 pb-1 text-[var(--shop-text-muted)] underline-offset-4 hover:text-[var(--shop-text)] hover:underline">
                    {actionLabel}
                </Link>
            )}
        </div>
    );
}
