import { Link } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';

export type Crumb = { label: string; href?: string };

export function ShopBreadcrumb({ items }: { items: Crumb[] }) {
    return (
        <nav aria-label="Breadcrumb" className="shop-caption mb-6 flex flex-wrap items-center gap-1 text-[var(--shop-text-muted)]">
            {items.map((item, i) => {
                const last = i === items.length - 1;

                return (
                    <span key={`${item.label}-${i}`} className="flex items-center gap-1">
                        {i > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden />}
                        {item.href && !last ? (
                            <Link href={item.href} className="hover:text-[var(--shop-text)]">
                                {item.label}
                            </Link>
                        ) : (
                            <span className={last ? 'text-[var(--shop-text)]' : undefined} aria-current={last ? 'page' : undefined}>
                                {item.label}
                            </span>
                        )}
                    </span>
                );
            })}
        </nav>
    );
}
