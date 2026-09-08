import { Head, Link, usePage } from '@inertiajs/react';
import { PropsWithChildren } from 'react';

export default function CheckoutLayout({ children, title }: PropsWithChildren<{ title?: string }>) {
    const { name } = usePage<{ name: string }>().props;
    const storeName = name || 'Shop';

    return (
        <div className="shop-root min-h-screen bg-[var(--shop-bg)] text-[var(--shop-text)]">
            {title && <Head title={title} />}
            <header className="border-b border-[var(--shop-border)] bg-[var(--shop-surface)]">
                <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 md:h-16">
                    <Link href="/" className="font-[family-name:var(--shop-display-font)] text-lg tracking-tight md:text-[1.35rem]">
                        {storeName}
                    </Link>
                    <Link href="/cart" className="text-sm text-[var(--shop-text-muted)] hover:text-[var(--shop-text)]">
                        Back to cart
                    </Link>
                </div>
            </header>
            <p className="border-b border-[var(--shop-border)] py-2 text-center text-xs text-[var(--shop-text-muted)]">
                Secure checkout · COD or PayMongo
            </p>
            <main className="mx-auto max-w-5xl px-4 py-8 md:py-12">{children}</main>
        </div>
    );
}
