import { Head, Link } from '@inertiajs/react';
import { PropsWithChildren } from 'react';

export default function CheckoutLayout({ children, title }: PropsWithChildren<{ title?: string }>) {
    return (
        <div className="min-h-screen bg-[var(--shop-bg)] text-[var(--shop-text)]">
            {title && <Head title={title} />}
            <header className="border-b border-[var(--shop-border)] bg-[var(--shop-surface)]">
                <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
                    <Link href="/" className="font-semibold">
                        Checkout
                    </Link>
                    <Link href="/cart" className="text-sm text-[var(--shop-text-muted)]">
                        Back to cart
                    </Link>
                </div>
            </header>
            <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>
        </div>
    );
}
