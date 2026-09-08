import StoreLayout from '@/layouts/store-layout';
import { ProductCard, type ProductCardData } from '@/components/product-card';
import { ProductGrid } from '@/components/store/product-grid';
import { ShopButton } from '@/components/store/shop-button';
import { ShopContainer } from '@/components/store/shop-container';
import { ShopSectionHeader } from '@/components/store/shop-section-header';
import { CatalogSeoHead, type CatalogSeo } from '@/components/store/catalog-seo-head';
import { EmptyState } from '@/components/empty-state';
import { placeholderImage, productImageSrc } from '@/lib/product-image';
import { Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';

type CategoryTile = { id: number; name: string; slug: string; path?: string; image?: string | null };

export default function Home({
    featured,
    newArrivals,
    onSale,
    categories,
    hero,
    seo,
}: {
    featured: ProductCardData[];
    newArrivals: ProductCardData[];
    onSale: ProductCardData[];
    categories: CategoryTile[];
    hero?: ProductCardData | null;
    seo?: CatalogSeo | null;
}) {
    const hasProducts = featured.length + newArrivals.length + onSale.length > 0;
    const heroProduct = hero ?? featured[0] ?? newArrivals[0];

    return (
        <StoreLayout title={seo?.title || 'Home'} flush>
            {seo ? <CatalogSeoHead seo={seo} /> : null}

            <section className="border-b border-[var(--shop-border)] bg-[var(--shop-surface)]">
                <ShopContainer className="grid items-center gap-10 py-10 md:grid-cols-2 md:gap-16 md:py-16">
                    <div className="max-w-xl">
                        <p className="shop-caption uppercase tracking-[0.18em] text-[var(--shop-text-muted)]">New season</p>
                        <h1 className="shop-display mt-4">Everyday pieces, delivered in Metro Manila.</h1>
                        <p className="shop-body-lg mt-5 text-[var(--shop-text-muted)]">
                            Quiet design, considered materials, and a checkout that stays honest — cash on delivery or PayMongo.
                        </p>
                        <div className="mt-8 flex flex-wrap items-center gap-3">
                            <ShopButton asChild>
                                <Link href="/shop">Shop now</Link>
                            </ShopButton>
                            {heroProduct && (
                                <ShopButton asChild variant="ghost">
                                    <Link href={`/products/${heroProduct.slug}`}>
                                        View {heroProduct.name}
                                        <ArrowRight className="h-4 w-4" />
                                    </Link>
                                </ShopButton>
                            )}
                        </div>
                    </div>
                    {heroProduct ? (
                        <Link
                            href={`/products/${heroProduct.slug}`}
                            className="relative block aspect-[4/5] overflow-hidden rounded-[var(--shop-radius-modal)] bg-[var(--shop-bg)] md:aspect-[5/6]"
                        >
                            <img
                                src={productImageSrc(heroProduct.image, heroProduct.slug, 1200)}
                                alt={[heroProduct.brand, heroProduct.name].filter(Boolean).join(' ')}
                                className="h-full w-full object-cover"
                            />
                            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/40 to-transparent p-5 text-white">
                                <span className="shop-caption uppercase tracking-[0.14em] opacity-80">{heroProduct.brand || 'Featured'}</span>
                                <span className="mt-1 block font-[family-name:var(--shop-display-font)] text-xl">{heroProduct.name}</span>
                            </span>
                        </Link>
                    ) : (
                        <div className="relative hidden aspect-[5/6] overflow-hidden rounded-[var(--shop-radius-modal)] bg-[var(--shop-bg)] md:block">
                            <img src={placeholderImage('home-hero', 1200, 1440)} alt="" className="h-full w-full object-cover" />
                        </div>
                    )}
                </ShopContainer>
            </section>

            <ShopContainer>
                <ul className="grid gap-8 py-10 text-sm md:grid-cols-3 md:divide-x md:divide-[var(--shop-border)] md:py-14">
                    <li className="md:pr-8">
                        <p className="font-medium text-[var(--shop-text)]">Metro Manila delivery</p>
                        <p className="mt-1.5 leading-relaxed text-[var(--shop-text-muted)]">We ship to serviceable cities only. Check your area at checkout.</p>
                    </li>
                    <li className="md:px-8">
                        <p className="font-medium text-[var(--shop-text)]">Tracked to your door</p>
                        <p className="mt-1.5 leading-relaxed text-[var(--shop-text-muted)]">Follow your order from packed to delivered.</p>
                    </li>
                    <li className="md:pl-8">
                        <p className="font-medium text-[var(--shop-text)]">COD or PayMongo</p>
                        <p className="mt-1.5 leading-relaxed text-[var(--shop-text-muted)]">Pay in cash on arrival, or online at checkout.</p>
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
                        <ShopSectionHeader title="Shop by category" eyebrow="Browse" href="/shop" />
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
                            {categories.map((c) => (
                                <Link
                                    key={c.id}
                                    href={c.path || `/shop/${c.slug}`}
                                    className="group relative aspect-[4/5] overflow-hidden rounded-[var(--shop-radius-card)] bg-[var(--shop-surface)]"
                                >
                                    <img
                                        src={productImageSrc(c.image, c.slug, 800)}
                                        alt=""
                                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 ease-[var(--shop-ease)] group-hover:scale-[1.03]"
                                    />
                                    <span className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
                                    <span className="relative mt-auto flex h-full items-end p-4 font-[family-name:var(--shop-display-font)] text-lg text-white md:p-5 md:text-xl">
                                        {c.name}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {featured.length > 0 && (
                    <section className="shop-section">
                        <ShopSectionHeader title="Featured" eyebrow="Staff picks" href="/shop" />
                        <ProductGrid>
                            {featured.map((p) => (
                                <ProductCard key={p.id} product={p} />
                            ))}
                        </ProductGrid>
                    </section>
                )}
                {newArrivals.length > 0 && (
                    <section className="shop-section">
                        <ShopSectionHeader title="New arrivals" href="/shop?sort=newest" />
                        <ProductGrid>
                            {newArrivals.map((p) => (
                                <ProductCard key={p.id} product={p} />
                            ))}
                        </ProductGrid>
                    </section>
                )}
                {onSale.length > 0 && (
                    <section className="shop-section">
                        <ShopSectionHeader title="On sale" href="/shop" />
                        <ProductGrid>
                            {onSale.map((p) => (
                                <ProductCard key={p.id} product={p} />
                            ))}
                        </ProductGrid>
                    </section>
                )}
            </ShopContainer>
        </StoreLayout>
    );
}
