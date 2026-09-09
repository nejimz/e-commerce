import StoreLayout from '@/layouts/store-layout';
import { ProductCard, type ProductCardData } from '@/components/product-card';
import { ProductGallery } from '@/components/store/product-gallery';
import { ProductGrid } from '@/components/store/product-grid';
import { QuantityStepper } from '@/components/store/quantity-stepper';
import { ShopBreadcrumb } from '@/components/store/shop-breadcrumb';
import { ShopButton } from '@/components/store/shop-button';
import { ShopSectionHeader } from '@/components/store/shop-section-header';
import { CatalogSeoHead, type CatalogSeo } from '@/components/store/catalog-seo-head';
import { formatMoney } from '@/lib/money';
import { Head, Link, useForm } from '@inertiajs/react';
import { RefreshCcw, Truck } from 'lucide-react';
import { useMemo, useState } from 'react';

type Variant = {
    id: number;
    sku: string;
    price: number;
    stock: number;
    is_active: boolean;
    option_value_ids: number[];
    label: string;
};

type Option = {
    id: number;
    name: string;
    values: { id: number; value: string }[];
};

type ProductDetail = {
    id: number;
    name: string;
    slug: string;
    sku: string;
    brand: { name: string; slug: string } | null;
    category: {
        name: string;
        slug: string;
        path: string;
        parent?: { name: string; slug: string; path: string } | null;
    } | null;
    price: number;
    compare_at_price: number | null;
    short_description: string | null;
    description: string | null;
    stock: number;
    has_variants: boolean;
    images: { url: string; alt?: string | null }[];
    options: Option[];
    variants: Variant[];
    meta_title: string;
    meta_description: string | null;
    canonical?: string;
};

export default function ProductPage({ product, related, jsonLd, seo }: { product: ProductDetail; related: ProductCardData[]; jsonLd: object; seo?: CatalogSeo }) {
    const [selected, setSelected] = useState<Record<number, number>>({});
    const variant = useMemo(() => {
        if (!product.has_variants) {
            return null;
        }
        const ids = Object.values(selected).map(Number);

        return product.variants.find((v) => {
            const valueIds = (v.option_value_ids ?? []).map(Number);

            return valueIds.length === ids.length && valueIds.every((id) => ids.includes(id));
        });
    }, [product, selected]);

    const price = variant ? variant.price : product.price;
    const stock = variant ? variant.stock : product.stock;
    const comboMissing = product.has_variants && !variant;
    const oos = !comboMissing && stock <= 0;
    const saving =
        product.compare_at_price && product.compare_at_price > price
            ? Math.round((1 - price / product.compare_at_price) * 100)
            : null;

    const form = useForm({
        product_id: product.id,
        variant_id: variant?.id ?? null,
        quantity: 1,
    });

    const maxQty = Math.max(1, oos || comboMissing ? 1 : stock);
    const quantity = Math.min(Math.max(1, form.data.quantity), maxQty);

    const reason = () => {
        if (!product.has_variants) {
            return '';
        }
        if (Object.keys(selected).length < product.options.length) {
            return 'Select all options to add this item.';
        }
        if (!variant) {
            return 'This combination is not available.';
        }
        if (!variant.is_active || variant.stock <= 0) {
            return 'This combination is out of stock.';
        }

        return '';
    };

    const isValueAvailable = (optId: number, valueId: number) => {
        const tentative = { ...selected, [optId]: valueId };
        const ids = Object.values(tentative).map(Number);

        return product.variants.some(
            (v) => v.is_active && v.stock > 0 && ids.every((id) => v.option_value_ids.map(Number).includes(id)),
        );
    };

    const stockLabel = () => {
        if (comboMissing) {
            return null;
        }
        if (stock <= 0) {
            return <p className="mt-3 text-sm text-[var(--shop-danger)]">Out of stock</p>;
        }
        if (stock <= 10) {
            return <p className="mt-3 text-sm text-[var(--shop-warning)]">Only {stock} left</p>;
        }

        return <p className="mt-3 text-sm text-[var(--shop-success)]">In stock</p>;
    };

    const addToCart = () => {
        form.transform((data) => ({
            ...data,
            variant_id: variant?.id ?? null,
            quantity,
        }));
        form.post('/cart');
    };

    const ctaLabel = oos ? 'Out of stock' : form.processing ? 'Adding…' : 'Add to cart';
    const ctaDisabled = oos || comboMissing || form.processing;

    return (
        <StoreLayout title={seo?.title || product.meta_title}>
            {seo ? (
                <CatalogSeoHead seo={seo} />
            ) : (
                <Head>
                    <meta name="description" content={product.meta_description || ''} />
                    {product.canonical ? <link rel="canonical" href={product.canonical} /> : null}
                    <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
                </Head>
            )}
            <ShopBreadcrumb
                items={[
                    { label: 'Home', href: '/' },
                    { label: 'Shop', href: '/shop' },
                    ...(product.category?.parent
                        ? [{ label: product.category.parent.name, href: product.category.parent.path }]
                        : []),
                    ...(product.category
                        ? [{ label: product.category.name, href: product.category.path }]
                        : []),
                    { label: product.name },
                ]}
            />
            <div className="grid gap-10 md:grid-cols-2 md:items-start md:gap-16">
                <ProductGallery images={product.images} productName={product.name} />
                <div className="md:sticky md:top-24">
                    {product.brand && (
                        <Link
                            href={`/brands/${product.brand.slug}`}
                            className="shop-caption uppercase tracking-[0.14em] text-[var(--shop-text-muted)] hover:text-[var(--shop-text)]"
                        >
                            {product.brand.name}
                        </Link>
                    )}
                    <h1 className="shop-h1 mt-2">{product.name}</h1>
                    <div className="mt-4 flex flex-wrap items-baseline gap-3">
                        <p className="shop-price-lg">{formatMoney(price)}</p>
                        {product.compare_at_price && product.compare_at_price > price && (
                            <>
                                <span className="text-base text-[var(--shop-text-muted)] line-through">{formatMoney(product.compare_at_price)}</span>
                                {saving ? (
                                    <span className="shop-caption rounded-[var(--shop-radius-pill)] bg-[var(--shop-danger)] px-2 py-0.5 text-white">
                                        Save {saving}%
                                    </span>
                                ) : null}
                            </>
                        )}
                    </div>
                    {product.short_description && (
                        <p className="shop-body-lg mt-5 text-[var(--shop-text-muted)]">{product.short_description}</p>
                    )}

                    {product.options.map((opt) => (
                        <div key={opt.id} className="mt-7">
                            <p className="text-sm font-medium">
                                {opt.name}
                                {selected[opt.id] && (
                                    <span className="ml-2 font-normal text-[var(--shop-text-muted)]">
                                        {opt.values.find((v) => v.id === selected[opt.id])?.value}
                                    </span>
                                )}
                            </p>
                            <div className="mt-2.5 flex flex-wrap gap-2">
                                {opt.values.map((v) => {
                                    const active = selected[opt.id] === v.id;
                                    const available = isValueAvailable(opt.id, v.id);

                                    return (
                                        <button
                                            key={v.id}
                                            type="button"
                                            disabled={!available && !active}
                                            onClick={() => setSelected({ ...selected, [opt.id]: v.id })}
                                            className={`h-11 min-w-11 rounded-[var(--shop-radius-pill)] border px-4 text-sm transition-colors duration-[var(--shop-duration-micro)] ease-[var(--shop-ease)] ${
                                                active
                                                    ? 'border-[var(--shop-text)] bg-[var(--shop-text)] text-[var(--shop-surface)]'
                                                    : 'border-[var(--shop-border)] bg-[var(--shop-surface)] hover:border-[var(--shop-text-dim)]'
                                            } disabled:cursor-not-allowed disabled:opacity-40`}
                                        >
                                            {v.value}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    <div className="mt-7">
                        <p className="text-sm font-medium">Quantity</p>
                        <div className="mt-2.5 hidden items-center gap-3 md:flex">
                            <QuantityStepper
                                value={quantity}
                                max={maxQty}
                                disabled={comboMissing || oos}
                                onChange={(next) => form.setData('quantity', next)}
                            />
                            <ShopButton className="min-w-[12rem] flex-1" size="md" disabled={ctaDisabled} onClick={addToCart}>
                                {ctaLabel}
                            </ShopButton>
                        </div>
                        <div className="mt-2.5 md:hidden">
                            <QuantityStepper
                                value={quantity}
                                max={maxQty}
                                disabled={comboMissing || oos}
                                onChange={(next) => form.setData('quantity', next)}
                            />
                        </div>
                        {stockLabel()}
                        {reason() && <p className="mt-1 text-sm text-[var(--shop-danger)]">{reason()}</p>}
                        {form.errors.cart && <p className="mt-2 text-sm text-[var(--shop-danger)]">{form.errors.cart}</p>}
                    </div>

                    <ul className="mt-8 space-y-3 border-t border-[var(--shop-border)] pt-6 text-sm text-[var(--shop-text-muted)]">
                        <li className="flex gap-3">
                            <Truck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--shop-accent)]" aria-hidden />
                            Ships to the Philippines and selected countries. Fees shown at checkout.
                        </li>
                        <li className="flex gap-3">
                            <RefreshCcw className="mt-0.5 h-4 w-4 shrink-0 text-[var(--shop-accent)]" aria-hidden />
                            Easy returns — see our{' '}
                            <Link href="/p/returns" className="underline underline-offset-2 hover:text-[var(--shop-text)]">
                                returns policy
                            </Link>
                            .
                        </li>
                    </ul>
                </div>
            </div>

            {product.description && (
                <div className="shop-section max-w-[40rem]">
                    <h2 className="shop-h3 mb-4">Details</h2>
                    <div className="shop-body-lg whitespace-pre-wrap text-[var(--shop-text-muted)]">{product.description}</div>
                </div>
            )}

            {related.length > 0 && (
                <section className="shop-section">
                    <ShopSectionHeader title="You may also like" href={product.category?.path || '/shop'} />
                    <ProductGrid>
                        {related.map((p) => (
                            <ProductCard key={p.id} product={p} />
                        ))}
                    </ProductGrid>
                </section>
            )}

            <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--shop-border)] bg-[var(--shop-surface)]/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur md:hidden">
                {form.errors.cart && <p className="mb-2 text-sm text-[var(--shop-danger)]">{form.errors.cart}</p>}
                <div className="flex items-center gap-4">
                    <p className="shop-price">{formatMoney(price)}</p>
                    <ShopButton className="flex-1" disabled={ctaDisabled} onClick={addToCart}>
                        {ctaLabel}
                    </ShopButton>
                </div>
            </div>
            <div className="h-24 md:hidden" />
        </StoreLayout>
    );
}
