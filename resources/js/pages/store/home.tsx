import StoreLayout from '@/layouts/store-layout';
import { ProductCard, type ProductCardData } from '@/components/product-card';
import { ProductGrid } from '@/components/store/product-grid';
import { ShopButton } from '@/components/store/shop-button';
import { EmptyState } from '@/components/empty-state';
import { Head, Link } from '@inertiajs/react';
import { Banknote, MapPin, Truck } from 'lucide-react';

export default function Home({
    featured,
    newArrivals,
    onSale,
    categories,
}: {
    featured: ProductCardData[];
    newArrivals: ProductCardData[];
    onSale: ProductCardData[];
    categories: { id: number; name: string; slug: string }[];
}) {
    const hasProducts = featured.length + newArrivals.length + onSale.length > 0;

    return (
        <StoreLayout title="Home">
            <Head>
                <meta name="description" content="Shop apparel and home goods. Prices in PHP." />
            </Head>
            <section className="max-w-2xl py-6 md:py-12">
                <p className="shop-caption uppercase tracking-[0.16em] text-[var(--shop-text-muted)]">New season</p>
                <h1 className="shop-display mt-3">Everyday pieces, delivered in Metro Manila.</h1>
                <p className="shop-body-lg mt-4 text-[var(--shop-text-muted)]">
                    Browse the catalog, check your area, and check out with cash on delivery or PayMongo.
                </p>
                <ShopButton asChild className="mt-8">
                    <Link href="/shop">Shop now</Link>
                </ShopButton>
            </section>

            <ul className="mt-8 grid gap-6 border-y border-[var(--shop-border)] py-6 text-sm md:grid-cols-3 md:py-8">
                <li className="flex gap-3">
                    <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[var(--shop-accent)]" aria-hidden />
                    <div>
                        <p className="font-medium text-[var(--shop-text)]">Metro Manila delivery</p>
                        <p className="text-[var(--shop-text-muted)]">We ship to serviceable cities only.</p>
                    </div>
                </li>
                <li className="flex gap-3">
                    <Truck className="mt-0.5 h-5 w-5 shrink-0 text-[var(--shop-accent)]" aria-hidden />
                    <div>
                        <p className="font-medium text-[var(--shop-text)]">Tracked to your door</p>
                        <p className="text-[var(--shop-text-muted)]">Follow your order from packed to delivered.</p>
                    </div>
                </li>
                <li className="flex gap-3">
                    <Banknote className="mt-0.5 h-5 w-5 shrink-0 text-[var(--shop-accent)]" aria-hidden />
                    <div>
                        <p className="font-medium text-[var(--shop-text)]">COD or PayMongo</p>
                        <p className="text-[var(--shop-text-muted)]">Pay in cash or online at checkout.</p>
                    </div>
                </li>
            </ul>

            {!hasProducts && (
                <div className="shop-section">
                    <EmptyState title="The catalog is being prepared" body="Check back soon, or browse anyway if listings just went live.">
                        <ShopButton asChild>
                            <Link href="/shop">Browse shop</Link>
                        </ShopButton>
                    </EmptyState>
                </div>
            )}

            {categories.length > 0 && (
                <section className="shop-section">
                    <h2 className="shop-h2 mb-6">Shop by category</h2>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
                        {categories.map((c) => (
                            <Link
                                key={c.id}
                                href={`/shop?category=${c.slug}`}
                                className="flex min-h-[7rem] items-end rounded-[var(--shop-radius-card)] bg-[var(--shop-surface)] px-5 py-4 text-left shadow-[var(--shop-shadow-e1)] transition-shadow duration-[var(--shop-duration)] ease-[var(--shop-ease)] hover:shadow-[var(--shop-shadow-e2)]"
                            >
                                <span className="shop-h4">{c.name}</span>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {featured.length > 0 && (
                <section className="shop-section">
                    <div className="mb-6 flex items-end justify-between gap-4">
                        <h2 className="shop-h2">Featured</h2>
                        <Link href="/shop" className="shop-caption text-[var(--shop-text-muted)] hover:text-[var(--shop-text)]">
                            View all
                        </Link>
                    </div>
                    <ProductGrid>
                        {featured.map((p) => (
                            <ProductCard key={p.id} product={p} />
                        ))}
                    </ProductGrid>
                </section>
            )}
            {newArrivals.length > 0 && (
                <section className="shop-section">
                    <h2 className="shop-h2 mb-6">New arrivals</h2>
                    <ProductGrid>
                        {newArrivals.map((p) => (
                            <ProductCard key={p.id} product={p} />
                        ))}
                    </ProductGrid>
                </section>
            )}
            {onSale.length > 0 && (
                <section className="shop-section">
                    <h2 className="shop-h2 mb-6">On sale</h2>
                    <ProductGrid>
                        {onSale.map((p) => (
                            <ProductCard key={p.id} product={p} />
                        ))}
                    </ProductGrid>
                </section>
            )}
        </StoreLayout>
    );
}
