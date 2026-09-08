import { Link, usePage } from '@inertiajs/react';

import { cn } from '@/lib/utils';

const links = [
    { href: '/account/orders', label: 'Orders' },
    { href: '/account/profile', label: 'Profile' },
];

export function AccountNav() {
    const { url } = usePage();

    return (
        <nav aria-label="Account" className="mb-8 flex gap-1 border-b border-[var(--shop-border)]">
            {links.map((link) => {
                const active = url.startsWith(link.href);

                return (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                            '-mb-px border-b-2 px-3 py-2.5 text-sm',
                            active
                                ? 'border-[var(--shop-text)] font-medium text-[var(--shop-text)]'
                                : 'border-transparent text-[var(--shop-text-muted)] hover:text-[var(--shop-text)]',
                        )}
                    >
                        {link.label}
                    </Link>
                );
            })}
        </nav>
    );
}
