import { adminBtnClass } from '@/components/admin/admin-button';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export type PaginatorLink = { url: string | null; label: string; active: boolean };

export type Paginator<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
    links: PaginatorLink[];
    prev_page_url: string | null;
    next_page_url: string | null;
};

function pageLabel(label: string) {
    if (label.includes('Previous')) {
        return <ChevronLeft className="size-4" aria-hidden />;
    }
    if (label.includes('Next')) {
        return <ChevronRight className="size-4" aria-hidden />;
    }
    return <span dangerouslySetInnerHTML={{ __html: label }} />;
}

export function AdminPagination({ paginator }: { paginator: Paginator<unknown> }) {
    if (paginator.last_page <= 1) {
        return null;
    }

    return (
        <nav className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--shop-text-muted)]" aria-label="Pagination">
            <p>
                Showing {paginator.from ?? 0}–{paginator.to ?? 0} of {paginator.total}
            </p>
            <div className="flex flex-wrap gap-1">
                {paginator.links.map((link, i) => {
                    const label = pageLabel(link.label);
                    const isIcon = link.label.includes('Previous') || link.label.includes('Next');
                    const className = cn(
                        adminBtnClass.secondary,
                        'min-w-11 px-0',
                        isIcon ? 'px-0' : 'px-3',
                        link.active &&
                            'border-transparent bg-[var(--shop-accent)] text-[var(--shop-on-accent)] hover:bg-[var(--shop-accent-hi)]',
                    );

                    if (!link.url) {
                        return (
                            <span key={i} className={cn(className, 'pointer-events-none opacity-40')} aria-hidden>
                                {label}
                            </span>
                        );
                    }

                    return (
                        <Link
                            key={i}
                            href={link.url}
                            preserveState
                            preserveScroll
                            className={className}
                            aria-current={link.active ? 'page' : undefined}
                            aria-label={link.label.replace(/<[^>]+>/g, '')}
                        >
                            {label}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
