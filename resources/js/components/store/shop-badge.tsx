import { cn } from '@/lib/utils';

export type ShopBadgeKind = 'oos' | 'sale' | 'new' | 'featured';

const styles: Record<ShopBadgeKind, string> = {
    oos: 'bg-[var(--shop-text)] text-white',
    sale: 'bg-[var(--shop-danger)] text-white',
    new: 'bg-[var(--shop-accent)] text-[var(--shop-on-accent)]',
    featured: 'bg-[var(--shop-surface)] text-[var(--shop-text)] shadow-[var(--shop-shadow-e1)]',
};

const labels: Record<ShopBadgeKind, string> = {
    oos: 'Out of stock',
    sale: 'Sale',
    new: 'New',
    featured: 'Featured',
};

export function ShopBadge({ kind, className }: { kind: ShopBadgeKind; className?: string }) {
    return (
        <span
            className={cn(
                'shop-caption inline-flex rounded-[var(--shop-radius-pill)] px-2 py-0.5 uppercase tracking-wide',
                styles[kind],
                className,
            )}
        >
            {labels[kind]}
        </span>
    );
}
