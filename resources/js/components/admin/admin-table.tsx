import { cn } from '@/lib/utils';
import { router } from '@inertiajs/react';
import { KeyboardEvent, ReactNode } from 'react';

export function AdminTable({
    children,
    className,
    plain,
}: {
    children: ReactNode;
    className?: string;
    plain?: boolean;
}) {
    return (
        <div
            className={cn(
                'overflow-x-auto',
                !plain && 'rounded-[10px] bg-[var(--shop-surface)] shadow-[var(--shop-shadow)]',
                className,
            )}
        >
            <table className={cn('w-full text-left text-sm', plain ? 'min-w-[20rem]' : 'min-w-[36rem]')}>{children}</table>
        </div>
    );
}

export function AdminThead({ children }: { children: ReactNode }) {
    return (
        <thead className="sticky top-0 z-10 bg-[var(--shop-surface)] text-[var(--shop-text-muted)]">
            {children}
        </thead>
    );
}

export function AdminTh({
    children,
    numeric,
    className,
}: {
    children?: ReactNode;
    numeric?: boolean;
    className?: string;
}) {
    return (
        <th className={cn('px-4 py-3 text-xs font-medium uppercase tracking-wide', numeric && 'text-right', className)}>
            {children}
        </th>
    );
}

export function AdminTd({
    children,
    numeric,
    className,
}: {
    children?: ReactNode;
    numeric?: boolean;
    className?: string;
}) {
    return <td className={cn('px-4 py-3', numeric && 'text-right tabular-nums', className)}>{children}</td>;
}

export function AdminRow({ href, children }: { href?: string; children: ReactNode }) {
    const visit = () => {
        if (href) {
            router.visit(href);
        }
    };

    const onKeyDown = (e: KeyboardEvent<HTMLTableRowElement>) => {
        if (!href) {
            return;
        }
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            router.visit(href);
        }
    };

    return (
        <tr
            className={cn(
                'border-t border-[var(--shop-border)]',
                href && 'cursor-pointer hover:bg-[var(--shop-bg)] focus-visible:bg-[var(--shop-bg)] focus-visible:outline-none',
            )}
            onClick={href ? visit : undefined}
            onKeyDown={href ? onKeyDown : undefined}
            tabIndex={href ? 0 : undefined}
            role={href ? 'link' : undefined}
        >
            {children}
        </tr>
    );
}
