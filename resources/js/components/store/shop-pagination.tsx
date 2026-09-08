import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '@/lib/utils';

function pageList(current: number, last: number): (number | 'ellipsis')[] {
    if (last <= 7) {
        return Array.from({ length: last }, (_, i) => i + 1);
    }

    const pages = new Set<number>([1, last, current, current - 1, current + 1]);
    const sorted = [...pages].filter((p) => p >= 1 && p <= last).sort((a, b) => a - b);
    const out: (number | 'ellipsis')[] = [];

    sorted.forEach((p, i) => {
        const prev = sorted[i - 1];
        if (i > 0 && prev !== undefined && p - prev > 1) {
            out.push('ellipsis');
        }
        out.push(p);
    });

    return out;
}

export function ShopPagination({
    current,
    last,
    buildHref,
}: {
    current: number;
    last: number;
    buildHref: (page: number) => string;
}) {
    if (last <= 1) {
        return null;
    }

    const pages = pageList(current, last);

    return (
        <nav aria-label="Pagination" className="mt-12 flex flex-wrap items-center justify-center gap-1.5">
            {current > 1 ? (
                <Link
                    href={buildHref(current - 1)}
                    className="inline-flex h-11 min-w-11 items-center justify-center rounded-[var(--shop-radius-control)] border border-[var(--shop-border)] bg-[var(--shop-surface)] px-3 text-sm"
                    preserveScroll
                >
                    <ChevronLeft className="h-4 w-4" aria-hidden />
                    <span className="sr-only">Previous page</span>
                </Link>
            ) : (
                <span className="inline-flex h-11 min-w-11 items-center justify-center rounded-[var(--shop-radius-control)] border border-[var(--shop-border)] px-3 text-sm opacity-40">
                    <ChevronLeft className="h-4 w-4" aria-hidden />
                </span>
            )}
            {pages.map((p, i) =>
                p === 'ellipsis' ? (
                    <span key={`e-${i}`} className="px-1 text-[var(--shop-text-dim)]">
                        …
                    </span>
                ) : (
                    <Link
                        key={p}
                        href={buildHref(p)}
                        preserveScroll
                        aria-current={p === current ? 'page' : undefined}
                        className={cn(
                            'inline-flex h-11 min-w-11 items-center justify-center rounded-[var(--shop-radius-control)] px-3 text-sm tabular-nums',
                            p === current
                                ? 'bg-[var(--shop-accent)] font-medium text-[var(--shop-on-accent)]'
                                : 'border border-[var(--shop-border)] bg-[var(--shop-surface)] hover:border-[var(--shop-text-dim)]',
                        )}
                    >
                        {p}
                    </Link>
                ),
            )}
            {current < last ? (
                <Link
                    href={buildHref(current + 1)}
                    className="inline-flex h-11 min-w-11 items-center justify-center rounded-[var(--shop-radius-control)] border border-[var(--shop-border)] bg-[var(--shop-surface)] px-3 text-sm"
                    preserveScroll
                >
                    <ChevronRight className="h-4 w-4" aria-hidden />
                    <span className="sr-only">Next page</span>
                </Link>
            ) : (
                <span className="inline-flex h-11 min-w-11 items-center justify-center rounded-[var(--shop-radius-control)] border border-[var(--shop-border)] px-3 text-sm opacity-40">
                    <ChevronRight className="h-4 w-4" aria-hidden />
                </span>
            )}
        </nav>
    );
}
