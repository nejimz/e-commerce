import { ReactNode } from 'react';

export function EmptyState({ title, body, children }: { title: string; body?: string; children?: ReactNode }) {
    return (
        <div className="rounded-[var(--shop-radius-card)] px-6 py-16 text-center">
            <h2 className="shop-h3">{title}</h2>
            {body && <p className="shop-body-sm mt-2 text-[var(--shop-text-muted)]">{body}</p>}
            {children && <div className="mt-6">{children}</div>}
        </div>
    );
}

export function Skeleton({ className = '' }: { className?: string }) {
    return <div className={`animate-pulse rounded bg-[var(--shop-border)] ${className}`} />;
}
