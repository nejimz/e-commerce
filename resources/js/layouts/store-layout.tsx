import { CartDrawer } from '@/components/store/cart-drawer';
import { StoreToast } from '@/components/store/store-toast';
import { ShopButton } from '@/components/store/shop-button';
import { ShopContainer } from '@/components/store/shop-container';
import { ShopInput } from '@/components/store/shop-input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import type { CartPayload } from '@/types/cart';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Menu, Search, ShoppingBag, User, X } from 'lucide-react';
import { FormEvent, PropsWithChildren, useEffect, useRef, useState } from 'react';

type Shared = {
    name: string;
    cartCount: number;
    cart: CartPayload;
    auth: { user: { name: string; role?: string } | null };
    store: { paused: boolean; paused_message?: string; announcement?: string };
    flash: { success?: string; error?: string };
    navCategories: { id: number; name: string; slug: string }[];
};

export default function StoreLayout({
    children,
    title,
    flush = false,
}: PropsWithChildren<{ title?: string; flush?: boolean }>) {
    const { name, cartCount, cart = { id: null, items: [], totals: { subtotal: 0, discount: 0, delivery_fee: 0, packing_fee: 0, vat_amount: 0, total: 0, item_count: 0 } }, auth, store, flash, navCategories = [] } = usePage<Shared>().props;
    const [dismissed, setDismissed] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [cartOpen, setCartOpen] = useState(false);
    const { url } = usePage();
    const desktopCategories = navCategories.slice(0, 5);
    const storeName = name || 'Shop';
    const accountHref = auth.user
        ? auth.user.role === 'admin' || auth.user.role === 'staff'
            ? '/admin'
            : '/account/orders'
        : '/login';

    useEffect(() => {
        if (flash?.success === 'Added to cart.') {
            setCartOpen(true);
        }
    }, [flash?.success, cartCount]);

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
                    <span>{store.announcement}</span>
                    <button
                        className="ml-3 inline-flex h-8 w-8 items-center justify-center rounded-full align-middle hover:bg-white/10"
                        onClick={() => setDismissed(true)}
                        type="button"
                        aria-label="Dismiss announcement"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>
            )}
            {store.paused && (
                <div className="border-b border-[var(--shop-border)] bg-[#fbf3e4] px-4 py-2 text-center text-sm text-[var(--shop-text)]">
                    {store.paused_message || 'The store is paused. Browsing is available; checkout is closed.'}
                </div>
            )}
            <header className="sticky top-0 z-40 border-b border-[var(--shop-border)] bg-[var(--shop-surface)]/90 backdrop-blur-md">
                <div className="shop-container flex h-14 items-center gap-3 md:h-16 md:gap-8">
                    <button
                        type="button"
                        className="shop-icon-btn md:hidden"
                        aria-label="Open menu"
                        onClick={() => setMenuOpen(true)}
                    >
                        <Menu className="h-5 w-5" />
                    </button>
                    <Link
                        href="/"
                        className="shrink-0 font-[family-name:var(--shop-display-font)] text-xl tracking-tight md:text-[1.35rem]"
                    >
                        {storeName}
                    </Link>
                    <nav className="hidden min-w-0 flex-1 items-center gap-6 text-sm md:flex">
                        <Link href="/shop" className="shop-nav-link" data-active={url === '/shop' || url.startsWith('/shop?') ? 'true' : undefined}>
                            Shop
                        </Link>
                        {desktopCategories.map((c) => (
                            <Link
                                key={c.id}
                                href={`/shop/${c.slug}`}
                                className="shop-nav-link truncate"
                                data-active={
                                    url === `/shop/${c.slug}` || url.startsWith(`/shop/${c.slug}/`) || url.startsWith(`/shop/${c.slug}?`)
                                        ? 'true'
                                        : undefined
                                }
                            >
                                {c.name}
                            </Link>
                        ))}
                    </nav>
                    <div className="ml-auto flex items-center gap-0.5 md:gap-1">
                        <div className="hidden md:block">
                            <HeaderSearch />
                        </div>
                        <button
                            type="button"
                            className="shop-icon-btn md:hidden"
                            aria-label={searchOpen ? 'Close search' : 'Search'}
                            onClick={() => setSearchOpen((v) => !v)}
                        >
                            {searchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
                        </button>
                        <Link href={accountHref} className="shop-icon-btn" aria-label={auth.user ? 'Account' : 'Sign in'}>
                            <User className="h-5 w-5" />
                        </Link>
                        <button
                            type="button"
                            className="shop-icon-btn relative"
                            aria-label="Cart"
                            onClick={() => setCartOpen(true)}
                        >
                            <ShoppingBag className="h-5 w-5" />
                            {cartCount > 0 && (
                                <span
                                    key={cartCount}
                                    className="shop-cart-badge absolute right-0.5 top-0.5 min-w-4 rounded-full bg-[var(--shop-accent)] px-1 text-center text-[10px] font-semibold leading-4 text-[var(--shop-on-accent)]"
                                >
                                    {cartCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
                {searchOpen && (
                    <div className="border-t border-[var(--shop-border)] px-4 py-3 md:hidden">
                        <HeaderSearch autoFocus onDone={() => setSearchOpen(false)} />
                    </div>
                )}
            </header>
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                <SheetContent
                    side="left"
                    className="w-[min(100%,20rem)] bg-[var(--shop-surface)] p-6 data-[state=closed]:duration-300 data-[state=open]:duration-300"
                >
                    <SheetHeader>
                        <SheetTitle className="text-left font-[family-name:var(--shop-display-font)] text-xl">{storeName}</SheetTitle>
                    </SheetHeader>
                    <nav className="mt-8 flex flex-col text-base">
                        <Link href="/shop" className="flex min-h-12 items-center border-b border-[var(--shop-border)]" onClick={() => setMenuOpen(false)}>
                            Shop all
                        </Link>
                        {navCategories.map((c) => (
                            <Link
                                key={c.id}
                                href={`/shop/${c.slug}`}
                                className="flex min-h-12 items-center border-b border-[var(--shop-border)] text-[var(--shop-text-muted)]"
                                onClick={() => setMenuOpen(false)}
                            >
                                {c.name}
                            </Link>
                        ))}
                        <Link
                            href={accountHref}
                            className="flex min-h-12 items-center text-[var(--shop-text-muted)]"
                            onClick={() => setMenuOpen(false)}
                        >
                            {auth.user ? 'Account' : 'Sign in'}
                        </Link>
                    </nav>
                </SheetContent>
            </Sheet>
            <CartDrawer cart={cart} open={cartOpen} onOpenChange={setCartOpen} />
            <StoreToast
                flash={{
                    ...(flash || {}),
                    success: flash?.success === 'Added to cart.' ? undefined : flash?.success,
                }}
            />
            <main id="main-content" className={flush ? 'min-h-[60vh]' : 'shop-container min-h-[60vh] py-8 md:py-12'}>
                {children}
            </main>
            <footer className="mt-20 border-t border-[var(--shop-border)] bg-[var(--shop-surface)]">
                <ShopContainer className="grid gap-12 py-14 text-sm md:grid-cols-4">
                    <div className="md:col-span-1">
                        <div className="font-[family-name:var(--shop-display-font)] text-lg text-[var(--shop-text)]">{storeName}</div>
                        <p className="mt-3 max-w-xs leading-relaxed text-[var(--shop-text-muted)]">
                            Everyday pieces, delivered in Metro Manila. Prices in PHP, VAT included when enabled.
                        </p>
                    </div>
                    <div>
                        <p className="shop-caption uppercase tracking-[0.14em] text-[var(--shop-text)]">Shop</p>
                        <ul className="mt-4 space-y-2.5 text-[var(--shop-text-muted)]">
                            <li>
                                <Link href="/shop" className="hover:text-[var(--shop-text)]">
                                    All products
                                </Link>
                            </li>
                            {navCategories.map((c) => (
                                <li key={c.id}>
                                    <Link href={`/shop/${c.slug}`} className="hover:text-[var(--shop-text)]">
                                        {c.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <p className="shop-caption uppercase tracking-[0.14em] text-[var(--shop-text)]">Help</p>
                        <ul className="mt-4 space-y-2.5 text-[var(--shop-text-muted)]">
                            <li>
                                <Link href="/p/shipping" className="hover:text-[var(--shop-text)]">
                                    Shipping
                                </Link>
                            </li>
                            <li>
                                <Link href="/p/returns" className="hover:text-[var(--shop-text)]">
                                    Returns
                                </Link>
                            </li>
                            <li>
                                <Link href="/p/contact" className="hover:text-[var(--shop-text)]">
                                    Contact
                                </Link>
                            </li>
                            <li>
                                <Link href="/cart" className="hover:text-[var(--shop-text)]">
                                    Cart
                                </Link>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <p className="shop-caption uppercase tracking-[0.14em] text-[var(--shop-text)]">Policies</p>
                        <ul className="mt-4 space-y-2.5 text-[var(--shop-text-muted)]">
                            <li>
                                <Link href="/p/terms" className="hover:text-[var(--shop-text)]">
                                    Terms of sale
                                </Link>
                            </li>
                            <li>
                                <Link href="/p/privacy" className="hover:text-[var(--shop-text)]">
                                    Privacy
                                </Link>
                            </li>
                        </ul>
                    </div>
                </ShopContainer>
                <div className="border-t border-[var(--shop-border)]">
                    <ShopContainer className="flex flex-wrap items-center justify-between gap-2 py-5 text-xs text-[var(--shop-text-dim)]">
                        <p>© {new Date().getFullYear()} {storeName}</p>
                        <p>Metro Manila · PHP</p>
                    </ShopContainer>
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
        <form onSubmit={submit} className="relative" role="search">
            <label htmlFor="header-search" className="sr-only">
                Search products
            </label>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--shop-text-dim)]" aria-hidden />
            <ShopInput
                ref={inputRef}
                id="header-search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search products"
                className="h-10 rounded-[var(--shop-radius-pill)] border-[var(--shop-border)] bg-[var(--shop-bg)] pl-9 pr-4 md:w-56"
            />
            <ShopButton type="submit" className="sr-only">
                Search
            </ShopButton>
        </form>
    );
}
