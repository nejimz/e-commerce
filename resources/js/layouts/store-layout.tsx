import { StoreToast } from '@/components/store/store-toast';
import { ShopButton } from '@/components/store/shop-button';
import { ShopInput } from '@/components/store/shop-input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Menu, Search, ShoppingBag, User, X } from 'lucide-react';
import { FormEvent, PropsWithChildren, useEffect, useRef, useState } from 'react';

type Shared = {
    name: string;
    cartCount: number;
    auth: { user: { name: string; role?: string } | null };
    store: { paused: boolean; paused_message?: string; announcement?: string };
    flash: { success?: string; error?: string };
    navCategories: { id: number; name: string; slug: string }[];
};

export default function StoreLayout({ children, title }: PropsWithChildren<{ title?: string }>) {
    const { name, cartCount, auth, store, flash, navCategories = [] } = usePage<Shared>().props;
    const [dismissed, setDismissed] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);

    return (
        <div className="shop-root min-h-screen bg-[var(--shop-bg)] text-[var(--shop-text)]">
            {title && <Head title={title} />}
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-[var(--shop-radius-control)] focus:bg-[var(--shop-surface)] focus:px-3 focus:py-2"
            >
                Skip to content
            </a>
            {store.announcement && !dismissed && (
                <div className="bg-[var(--shop-accent)] px-4 py-2 text-center text-sm text-[var(--shop-on-accent)]">
                    {store.announcement}
                    <button className="ml-3 underline" onClick={() => setDismissed(true)} type="button">
                        Dismiss
                    </button>
                </div>
            )}
            {store.paused && (
                <div className="bg-[var(--shop-warning)] px-4 py-2 text-center text-sm text-[var(--shop-on-accent)]">
                    {store.paused_message || 'The store is paused. Browsing is available; checkout is closed.'}
                </div>
            )}
            <header className="sticky top-0 z-40 border-b border-[var(--shop-border)] bg-[var(--shop-surface)]/95 backdrop-blur">
                <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 md:h-16 md:gap-6 md:px-6">
                    <button
                        type="button"
                        className="inline-flex h-11 w-11 items-center justify-center rounded-[var(--shop-radius-control)] md:hidden"
                        aria-label="Open menu"
                        onClick={() => setMenuOpen(true)}
                    >
                        <Menu className="h-5 w-5" />
                    </button>
                    <Link href="/" className="font-semibold tracking-tight">
                        {name || 'Shop'}
                    </Link>
                    <nav className="hidden min-w-0 flex-1 items-center gap-6 text-sm md:flex">
                        <Link href="/shop" className="text-[var(--shop-text-muted)] hover:text-[var(--shop-text)]">
                            Shop
                        </Link>
                        {navCategories.map((c) => (
                            <Link
                                key={c.id}
                                href={`/shop?category=${c.slug}`}
                                className="truncate text-[var(--shop-text-muted)] hover:text-[var(--shop-text)]"
                            >
                                {c.name}
                            </Link>
                        ))}
                    </nav>
                    <div className="ml-auto flex items-center gap-1 md:gap-2">
                        <div className="hidden md:block">
                            <HeaderSearch />
                        </div>
                        <button
                            type="button"
                            className="inline-flex h-11 w-11 items-center justify-center rounded-[var(--shop-radius-control)] md:hidden"
                            aria-label="Search"
                            onClick={() => setSearchOpen((v) => !v)}
                        >
                            {searchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
                        </button>
                        {auth.user ? (
                            <Link
                                href={auth.user.role === 'admin' || auth.user.role === 'staff' ? '/admin' : '/account/orders'}
                                className="inline-flex h-11 w-11 items-center justify-center rounded-[var(--shop-radius-control)]"
                                aria-label="Account"
                            >
                                <User className="h-5 w-5" />
                            </Link>
                        ) : (
                            <Link href="/login" className="inline-flex h-11 w-11 items-center justify-center rounded-[var(--shop-radius-control)]" aria-label="Sign in">
                                <User className="h-5 w-5" />
                            </Link>
                        )}
                        <Link href="/cart" className="relative inline-flex h-11 w-11 items-center justify-center rounded-[var(--shop-radius-control)]" aria-label="Cart">
                            <ShoppingBag className="h-5 w-5" />
                            {cartCount > 0 && (
                                <span className="absolute right-1 top-1 min-w-4 rounded-full bg-[var(--shop-accent)] px-1 text-center text-[10px] font-semibold leading-4 text-[var(--shop-on-accent)]">
                                    {cartCount}
                                </span>
                            )}
                        </Link>
                    </div>
                </div>
                {searchOpen && (
                    <div className="border-t border-[var(--shop-border)] px-4 py-3 md:hidden">
                        <HeaderSearch autoFocus onDone={() => setSearchOpen(false)} />
                    </div>
                )}
            </header>
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                <SheetContent side="left" className="w-[min(100%,20rem)] bg-[var(--shop-surface)] p-6 data-[state=closed]:duration-300 data-[state=open]:duration-300">
                    <SheetHeader>
                        <SheetTitle className="text-left">{name || 'Shop'}</SheetTitle>
                    </SheetHeader>
                    <nav className="mt-8 flex flex-col gap-1 text-base">
                        <Link href="/shop" className="flex min-h-11 items-center" onClick={() => setMenuOpen(false)}>
                            Shop all
                        </Link>
                        {navCategories.map((c) => (
                            <Link
                                key={c.id}
                                href={`/shop?category=${c.slug}`}
                                className="flex min-h-11 items-center text-[var(--shop-text-muted)]"
                                onClick={() => setMenuOpen(false)}
                            >
                                {c.name}
                            </Link>
                        ))}
                    </nav>
                </SheetContent>
            </Sheet>
            <StoreToast flash={flash || {}} />
            <main id="main-content" className="mx-auto min-h-[60vh] max-w-7xl px-4 py-8 md:px-6 md:py-10">
                {children}
            </main>
            <footer className="mt-16 border-t border-[var(--shop-border)]">
                <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 text-sm text-[var(--shop-text-muted)] md:grid-cols-[1.4fr_1fr] md:px-6">
                    <div>
                        <div className="text-base font-medium text-[var(--shop-text)]">{name || 'Shop'}</div>
                        <p className="mt-2 max-w-sm leading-relaxed">Everyday pieces, delivered in Metro Manila. Prices in PHP, VAT included when enabled.</p>
                    </div>
                    <div className="flex flex-wrap gap-x-6 gap-y-3 md:justify-end">
                        <Link href="/p/shipping">Shipping</Link>
                        <Link href="/p/returns">Returns</Link>
                        <Link href="/p/terms">Terms</Link>
                        <Link href="/p/privacy">Privacy</Link>
                        <Link href="/p/contact">Contact</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}

function HeaderSearch({ autoFocus, onDone }: { autoFocus?: boolean; onDone?: () => void }) {
    const { url } = usePage();
    const initial = new URLSearchParams(url.split('?')[1] || '').get('q') || '';
    const [q, setQ] = useState(initial);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (autoFocus) {
            inputRef.current?.focus();
        }
    }, [autoFocus]);

    const submit = (e: FormEvent) => {
        e.preventDefault();
        router.get('/shop', q.trim() ? { q: q.trim() } : {});
        onDone?.();
    };

    return (
        <form onSubmit={submit} className="flex items-center gap-2" role="search">
            <label htmlFor="header-search" className="sr-only">
                Search products
            </label>
            <ShopInput
                ref={inputRef}
                id="header-search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search"
                className="h-11 md:w-52"
            />
            <ShopButton type="submit" variant="ghost" size="sm" className="h-11 px-3" aria-label="Submit search">
                <Search className="h-4 w-4" />
            </ShopButton>
        </form>
    );
}
