import StoreLayout from '@/layouts/store-layout';
import { ProductCard, type ProductCardData } from '@/components/product-card';
import { ProductGallery } from '@/components/store/product-gallery';
import { ProductGrid } from '@/components/store/product-grid';
import { ShopBreadcrumb } from '@/components/store/shop-breadcrumb';
import { ShopButton } from '@/components/store/shop-button';
import { formatMoney } from '@/lib/money';
import { Head, Link, useForm } from '@inertiajs/react';
import { Minus, Plus } from 'lucide-react';
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
    category: { name: string; slug: string } | null;
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
};

export default function ProductPage({ product, related, jsonLd }: { product: ProductDetail; related: ProductCardData[]; jsonLd: object }) {
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
            return <p className="mt-2 text-sm text-[var(--shop-danger)]">Out of stock</p>;
        }
        if (stock <= 10) {
            return <p className="mt-2 text-sm text-[var(--shop-warning)]">Only {stock} left</p>;
        }

        return <p className="mt-2 text-sm text-[var(--shop-success)]">In stock</p>;
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
        <StoreLayout title={product.meta_title}>
            <Head>
                <meta name="description" content={product.meta_description || ''} />
                <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
            </Head>
            <ShopBreadcrumb
                items={[
                    { label: 'Home', href: '/' },
                    { label: 'Shop', href: '/shop' },
                    ...(product.category
                        ? [{ label: product.category.name, href: `/shop?category=${product.category.slug}` }]
                        : []),
                    { label: product.name },
                ]}
            />
            <div className="grid gap-10 md:grid-cols-2 md:gap-14">
                <ProductGallery images={product.images} productName={product.name} />
                <div>
                    {product.brand && (
                        <Link
                            href={`/brands/${product.brand.slug}`}
                            className="shop-caption uppercase tracking-wide text-[var(--shop-text-muted)] hover:text-[var(--shop-text)]"
                        >
                            {product.brand.name}
                        </Link>
                    )}
                    <h1 className="shop-h1 mt-2">{product.name}</h1>
                    <p className="shop-price-lg mt-3">
                        {formatMoney(price)}
                        {product.compare_at_price && product.compare_at_price > price && (
                            <span className="ml-2 text-base font-normal text-[var(--shop-text-muted)] line-through">
                                {formatMoney(product.compare_at_price)}
                            </span>
                        )}
                    </p>
                    {product.short_description && (
                        <p className="shop-body-lg mt-4 text-[var(--shop-text-muted)]">{product.short_description}</p>
                    )}

                    {product.options.map((opt) => (
                        <div key={opt.id} className="mt-6">
                            <p className="text-sm font-medium">{opt.name}</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {opt.values.map((v) => {
                                    const active = selected[opt.id] === v.id;
                                    const available = isValueAvailable(opt.id, v.id);

                                    return (
                                        <button
                                            key={v.id}
                                            type="button"
                                            disabled={!available && !active}
                                            onClick={() => setSelected({ ...selected, [opt.id]: v.id })}
                                            className={`h-11 min-w-11 rounded-[var(--shop-radius-control)] border px-3 text-sm ${
                                                active
                                                    ? 'border-[var(--shop-accent)] bg-[var(--shop-accent)] text-[var(--shop-on-accent)]'
                                                    : 'border-[var(--shop-border)] bg-[var(--shop-surface)]'
                                            } disabled:cursor-not-allowed disabled:opacity-40`}
                                        >
                                            {v.value}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    <div className="mt-6">
                        <p className="text-sm font-medium">Quantity</p>
                        <div className="mt-2 inline-flex h-11 items-center rounded-[var(--shop-radius-control)] border border-[var(--shop-border)] bg-[var(--shop-surface)]">
                            <button
                                type="button"
                                className="inline-flex h-11 w-11 items-center justify-center"
                                aria-label="Decrease quantity"
                                disabled={quantity <= 1}
                                onClick={() => form.setData('quantity', quantity - 1)}
                            >
                                <Minus className="h-4 w-4" />
                            </button>
                            <span className="min-w-8 text-center tabular-nums" aria-live="polite">
                                {quantity}
                            </span>
                            <button
                                type="button"
                                className="inline-flex h-11 w-11 items-center justify-center"
                                aria-label="Increase quantity"
                                disabled={quantity >= maxQty || comboMissing || oos}
                                onClick={() => form.setData('quantity', quantity + 1)}
                            >
                                <Plus className="h-4 w-4" />
                            </button>
                        </div>
                        {stockLabel()}
                        {reason() && <p className="mt-1 text-sm text-[var(--shop-danger)]">{reason()}</p>}
                    </div>

                    <ShopButton size="lg" className="mt-8 hidden md:inline-flex" disabled={ctaDisabled} onClick={addToCart}>
                        {ctaLabel}
                    </ShopButton>
                </div>
            </div>

            {product.description && (
                <div className="shop-section max-w-3xl">
                    <h2 className="shop-h3 mb-3">Details</h2>
                    <div className="whitespace-pre-wrap text-[var(--shop-text-muted)] leading-relaxed">{product.description}</div>
                </div>
            )}

            {related.length > 0 && (
                <section className="shop-section">
                    <h2 className="shop-h2 mb-6">You may also like</h2>
                    <ProductGrid>
                        {related.map((p) => (
                            <ProductCard key={p.id} product={p} />
                        ))}
                    </ProductGrid>
                </section>
            )}

            <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--shop-border)] bg-[var(--shop-surface)]/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur md:hidden">
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
