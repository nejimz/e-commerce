import StoreLayout from '@/layouts/store-layout';
import { ProductCard, type ProductCardData } from '@/components/product-card';
import { ProductCardSkeleton } from '@/components/store/product-card-skeleton';
import { ProductGrid } from '@/components/store/product-grid';
import { ShopBreadcrumb } from '@/components/store/shop-breadcrumb';
import { ShopButton } from '@/components/store/shop-button';
import { ShopPagination } from '@/components/store/shop-pagination';
import { ShopSelect } from '@/components/store/shop-input';
import {
    activeFilterCount,
    CatalogFilterFields,
    catalogHref,
    type CatalogQuery,
    type FacetOption,
} from '@/components/store/catalog-filters';
import { EmptyState } from '@/components/empty-state';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Head, router } from '@inertiajs/react';
import { SlidersHorizontal, X } from 'lucide-react';
import { useMemo, useState } from 'react';

export default function Catalog({
    products,
    filters,
    categories,
    brands,
}: {
    products: { data: ProductCardData[]; meta: { current_page: number; last_page: number; total: number } };
    filters: CatalogQuery;
    categories: FacetOption[];
    brands: { id: number; name: string; slug: string }[];
}) {
    const [pending, setPending] = useState(false);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const query = useMemo(() => {
        const next: CatalogQuery = {};
        Object.entries(filters || {}).forEach(([k, v]) => {
            if (v) {
                next[k] = String(v);
            }
        });

        return next;
    }, [filters]);

    const apply = (next: CatalogQuery) => {
        const payload: Record<string, string> = {};
        Object.entries(next).forEach(([k, v]) => {
            if (v) {
                payload[k] = v;
            }
        });
        router.get('/shop', payload, {
            preserveState: true,
            preserveScroll: true,
            onStart: () => setPending(true),
            onFinish: () => setPending(false),
        });
    };

    const count = activeFilterCount(query);
    const category = categories.find((c) => c.slug === query.category);
    const crumbs = [
        { label: 'Home', href: '/' },
        { label: 'Shop', href: '/shop' },
        ...(category ? [{ label: category.name }] : query.q ? [{ label: `Results for “${query.q}”` }] : []),
    ];

    const chips = useMemo(() => {
        const items: { key: string; label: string }[] = [];
        if (query.q) {
            items.push({ key: 'q', label: `“${query.q}”` });
        }
        if (category) {
            items.push({ key: 'category', label: category.name });
        }
        const brand = brands.find((b) => b.slug === query.brand);
        if (brand) {
            items.push({ key: 'brand', label: brand.name });
        }
        if (query.min_price || query.max_price) {
            items.push({ key: 'price', label: `PHP ${query.min_price || '0'}–${query.max_price || '∞'}` });
        }
        if (query.in_stock) {
            items.push({ key: 'in_stock', label: 'In stock' });
        }

        return items;
    }, [query, category, brands]);

    const removeChip = (key: string) => {
        const next = { ...query };
        if (key === 'price') {
            delete next.min_price;
            delete next.max_price;
        } else {
            delete next[key];
        }
        apply(next);
    };

    return (
        <StoreLayout title="Shop">
            <Head title="Shop" />
            <ShopBreadcrumb items={crumbs} />
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="shop-h1">{category ? category.name : 'Shop'}</h1>
                    <p className="mt-1 text-sm text-[var(--shop-text-muted)]">
                        {products.meta.total} {products.meta.total === 1 ? 'product' : 'products'}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <label htmlFor="catalog-sort" className="sr-only">
                        Sort
                    </label>
                    <ShopSelect
                        id="catalog-sort"
                        value={query.sort || ''}
                        onChange={(e) => apply({ ...query, sort: e.target.value })}
                        className="w-44"
                    >
                        <option value="">Featured</option>
                        <option value="newest">Newest</option>
                        <option value="price_asc">Price: low to high</option>
                        <option value="price_desc">Price: high to low</option>
                        <option value="name">Name A–Z</option>
                    </ShopSelect>
                </div>
            </div>

            <div className="sticky top-14 z-20 -mx-4 mb-4 flex items-center justify-between border-y border-[var(--shop-border)] bg-[var(--shop-bg)]/95 px-4 py-2 backdrop-blur min-[992px]:hidden">
                <button
                    type="button"
                    className="inline-flex h-11 items-center gap-2 text-sm font-medium"
                    onClick={() => setFiltersOpen(true)}
                >
                    <SlidersHorizontal className="h-4 w-4" />
                    Filter{count > 0 ? ` (${count})` : ''}
                </button>
                {count > 0 && (
                    <button type="button" className="text-sm text-[var(--shop-text-muted)] underline" onClick={() => apply({})}>
                        Clear
                    </button>
                )}
            </div>

            {chips.length > 0 && (
                <div className="mb-6 flex flex-wrap gap-2">
                    {chips.map((chip) => (
                        <button
                            key={chip.key}
                            type="button"
                            onClick={() => removeChip(chip.key)}
                            className="inline-flex h-9 items-center gap-1.5 rounded-[var(--shop-radius-pill)] bg-[var(--shop-surface)] px-3 text-sm shadow-[var(--shop-shadow-e1)]"
                        >
                            {chip.label}
                            <X className="h-3.5 w-3.5" aria-hidden />
                            <span className="sr-only">Remove {chip.label}</span>
                        </button>
                    ))}
                    <button type="button" className="h-9 px-2 text-sm text-[var(--shop-text-muted)] underline" onClick={() => apply({})}>
                        Clear filters
                    </button>
                </div>
            )}

            <div className="grid gap-10 min-[992px]:grid-cols-[260px_1fr]">
                <aside className="hidden min-[992px]:block">
                    <div className="sticky top-24">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-sm font-medium">Filters</h2>
                            {count > 0 && (
                                <button type="button" className="text-sm text-[var(--shop-text-muted)] underline" onClick={() => apply({})}>
                                    Clear
                                </button>
                            )}
                        </div>
                        <CatalogFilterFields idPrefix="desktop-" filters={query} categories={categories} brands={brands} onChange={apply} />
                    </div>
                </aside>
                <div>
                    {pending ? (
                        <ProductGrid>
                            {Array.from({ length: 8 }).map((_, i) => (
                                <ProductCardSkeleton key={i} />
                            ))}
                        </ProductGrid>
                    ) : products.data.length === 0 ? (
                        <EmptyState title="No products match" body="Try clearing filters or searching a different term.">
                            <ShopButton variant="secondary" onClick={() => apply({})}>
                                Clear filters
                            </ShopButton>
                        </EmptyState>
                    ) : (
                        <ProductGrid>
                            {products.data.map((p) => (
                                <ProductCard key={p.id} product={p} />
                            ))}
                        </ProductGrid>
                    )}
                    <ShopPagination
                        current={products.meta.current_page}
                        last={products.meta.last_page}
                        buildHref={(page) => catalogHref(query, page)}
                    />
                </div>
            </div>

            <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
                <SheetContent
                    side="bottom"
                    className="max-h-[85vh] overflow-y-auto rounded-t-[var(--shop-radius-modal)] bg-[var(--shop-surface)] data-[state=closed]:duration-300 data-[state=open]:duration-300"
                >
                    <SheetHeader>
                        <SheetTitle>Filters</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6 pb-8">
                        <CatalogFilterFields idPrefix="mobile-" filters={query} categories={categories} brands={brands} onChange={apply} />
                    </div>
                </SheetContent>
            </Sheet>
        </StoreLayout>
    );
}
