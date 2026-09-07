import StoreLayout from '@/layouts/store-layout';
import { ProductCard, type ProductCardData } from '@/components/product-card';
import { ProductGrid } from '@/components/store/product-grid';
import { ShopBreadcrumb } from '@/components/store/shop-breadcrumb';
import { ShopButton } from '@/components/store/shop-button';
import { ShopPagination } from '@/components/store/shop-pagination';
import { EmptyState } from '@/components/empty-state';
import { Link } from '@inertiajs/react';

export default function BrandPage({
    brand,
    products,
}: {
    brand: { name: string; slug: string; description?: string | null };
    products: { data: ProductCardData[]; meta: { current_page: number; last_page: number; total: number } };
}) {
    return (
        <StoreLayout title={brand.name}>
            <ShopBreadcrumb
                items={[
                    { label: 'Home', href: '/' },
                    { label: 'Shop', href: '/shop' },
                    { label: brand.name },
                ]}
            />
            <h1 className="shop-h1">{brand.name}</h1>
            {brand.description && <p className="shop-body-lg mt-3 max-w-2xl text-[var(--shop-text-muted)]">{brand.description}</p>}
            <p className="mt-2 text-sm text-[var(--shop-text-muted)]">
                {products.meta.total} {products.meta.total === 1 ? 'product' : 'products'}
            </p>
            <div className="mt-8">
                {products.data?.length ? (
                    <ProductGrid>
                        {products.data.map((p) => (
                            <ProductCard key={p.id} product={p} />
                        ))}
                    </ProductGrid>
                ) : (
                    <EmptyState title="No products yet" body="This brand has no active listings right now.">
                        <ShopButton asChild variant="secondary">
                            <Link href="/shop">Browse shop</Link>
                        </ShopButton>
                    </EmptyState>
                )}
            </div>
            <ShopPagination
                current={products.meta.current_page}
                last={products.meta.last_page}
                buildHref={(page) => (page > 1 ? `/brands/${brand.slug}?page=${page}` : `/brands/${brand.slug}`)}
            />
        </StoreLayout>
    );
}
