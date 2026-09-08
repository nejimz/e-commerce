import { ShopBadge, type ShopBadgeKind } from '@/components/store/shop-badge';
import { ShopButton } from '@/components/store/shop-button';
import { formatMoney } from '@/lib/money';
import { productImageSrc } from '@/lib/product-image';
import { Link, useForm } from '@inertiajs/react';

export { formatMoney };

export type ProductCardData = {
    id: number;
    name: string;
    slug: string;
    brand?: string | null;
    price: number;
    compare_at_price?: number | null;
    stock: number;
    image?: string | null;
    is_featured?: boolean;
    has_variants?: boolean;
    created_at?: string | null;
};

function isNewArrival(createdAt?: string | null) {
    if (!createdAt) {
        return false;
    }
    const created = new Date(createdAt).getTime();

    return Date.now() - created < 30 * 24 * 60 * 60 * 1000;
}

function cardBadges(product: ProductCardData): ShopBadgeKind[] {
    const kinds: ShopBadgeKind[] = [];
    if (product.stock <= 0) {
        kinds.push('oos');
    }
    if (product.compare_at_price && product.compare_at_price > product.price) {
        kinds.push('sale');
    }
    if (isNewArrival(product.created_at)) {
        kinds.push('new');
    }
    if (product.is_featured) {
        kinds.push('featured');
    }

    return kinds.slice(0, 2);
}

export function ProductCard({ product }: { product: ProductCardData }) {
    const form = useForm({ product_id: product.id, quantity: 1 });
    const oos = product.stock <= 0;
    const alt = [product.brand, product.name].filter(Boolean).join(' ');
    const badges = cardBadges(product);
    const href = `/products/${product.slug}`;

    const cta = (compact = false) => {
        if (oos) {
            return (
                <ShopButton disabled className="w-full" variant="secondary" size={compact ? 'sm' : 'md'}>
                    Out of stock
                </ShopButton>
            );
        }
        if (product.has_variants) {
            return (
                <ShopButton asChild className="w-full" size={compact ? 'sm' : 'md'}>
                    <Link href={href}>Select options</Link>
                </ShopButton>
            );
        }

        return (
            <ShopButton className="w-full" size={compact ? 'sm' : 'md'} disabled={form.processing} onClick={() => form.post('/cart')}>
                {form.processing ? 'Adding…' : 'Add to cart'}
            </ShopButton>
        );
    };

    return (
        <article className="group">
            <div className="relative overflow-hidden rounded-[var(--shop-radius-image)] bg-[var(--shop-surface)]">
                <Link href={href} className="block aspect-square overflow-hidden">
                    <img
                        src={productImageSrc(product.image, product.slug)}
                        alt={alt}
                        loading="lazy"
                        decoding="async"
                        className={`h-full w-full object-cover transition-transform duration-300 ease-[var(--shop-ease)] group-hover:scale-[1.04] ${oos ? 'opacity-45' : ''}`}
                    />
                </Link>
                {badges.length > 0 && (
                    <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                        {badges.map((kind) => (
                            <ShopBadge key={kind} kind={kind} />
                        ))}
                    </div>
                )}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 hidden p-3 opacity-0 transition-opacity duration-[var(--shop-duration)] ease-[var(--shop-ease)] md:block md:group-hover:pointer-events-auto md:group-hover:opacity-100 md:group-focus-within:pointer-events-auto md:group-focus-within:opacity-100">
                    <div className="rounded-[var(--shop-radius-control)] bg-[var(--shop-surface)]/95 p-1 shadow-[var(--shop-shadow-e2)] backdrop-blur-sm">
                        {cta(true)}
                    </div>
                </div>
            </div>
            <div className="space-y-1 pt-3">
                {product.brand && <p className="shop-caption uppercase tracking-[0.12em] text-[var(--shop-text-muted)]">{product.brand}</p>}
                <Link href={href} className="shop-h4 line-clamp-2 hover:text-[var(--shop-accent)]">
                    {product.name}
                </Link>
                <p className="shop-price">
                    {formatMoney(product.price)}
                    {product.compare_at_price && product.compare_at_price > product.price && (
                        <span className="ml-2 text-sm font-normal text-[var(--shop-text-muted)] line-through">{formatMoney(product.compare_at_price)}</span>
                    )}
                </p>
                {product.stock > 0 && product.stock <= 10 && (
                    <p className="shop-caption text-[var(--shop-warning)]">Only {product.stock} left</p>
                )}
                <div className="pt-2 md:hidden">{cta()}</div>
            </div>
        </article>
    );
}
