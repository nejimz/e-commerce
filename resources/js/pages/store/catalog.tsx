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
    facetQueriesEqual,
    formatPriceFilterLabel,
    productCountLabel,
    type CatalogQuery,
    type FacetOption,
    type PriceBounds,
} from '@/components/store/catalog-filters';
import { EmptyState } from '@/components/empty-state';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Head, router } from '@inertiajs/react';
import { SlidersHorizontal, X } from 'lucide-react';
import { useMemo, useState } from 'react';

function SortSelect({
    id,
    value,
    onChange,
    className,
}: {
    id: string;
    value: string;
    onChange: (value: string) => void;
    className?: string;
}) {
    return (
        <>
            <label htmlFor={id} className="sr-only">
                Sort
            </label>
            <ShopSelect id={id} value={value} onChange={(e) => onChange(e.target.value)} className={className}>
                <option value="">Featured</option>
                <option value="newest">Newest</option>
                <option value="price_asc">Price: low to high</option>
                <option value="price_desc">Price: high to low</option>
                <option value="name">Name A–Z</option>
            </ShopSelect>
        </>
    );
}

function CategoryPill({
    active,
    children,
    onClick,
}: {
    active: boolean;
    children: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            className={`h-9 shrink-0 rounded-[var(--shop-radius-pill)] border px-3.5 text-sm transition-colors duration-[var(--shop-duration-micro)] ease-[var(--shop-ease)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--shop-accent)] ${
                active
                    ? 'border-[var(--shop-text)] bg-[var(--shop-surface)] text-[var(--shop-text)]'
                    : 'border-transparent text-[var(--shop-text-muted)] hover:text-[var(--shop-text)]'
            }`}
        >
            {children}
        </button>
    );
}

export default function Catalog({
    products,
    filters,
    categories,
    brands,
    price_bounds = null,
}: {
    products: { data: ProductCardData[]; meta: { current_page: number; last_page: number; total: number } };
    filters: CatalogQuery;
    categories: FacetOption[];
    brands: { id: number; name: string; slug: string; count?: number }[];
    price_bounds?: PriceBounds;
}) {
    const [pending, setPending] = useState(false);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [draft, setDraft] = useState<CatalogQuery>({});
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
            if (v && k !== 'page') {
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

    const clearFilters = () => {
        const next: CatalogQuery = {};
        if (query.sort) {
            next.sort = query.sort;
        }
        apply(next);
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
            items.push({ key: 'price', label: formatPriceFilterLabel(query.min_price, query.max_price) });
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

    const setSort = (sort: string) => apply({ ...query, sort });

    const topCategories = categories.filter((c) => !c.parent_id);
    const railParentId = category ? (category.parent_id ?? category.id) : null;
    const railChildren = railParentId ? categories.filter((c) => c.parent_id === railParentId) : [];

    const openSheet = (open: boolean) => {
        setFiltersOpen(open);
        if (open) {
            setDraft(query);
        }
    };

    const applyDraft = () => {
        const next = { ...draft };
        if (query.sort) {
            next.sort = query.sort;
        } else {
            delete next.sort;
        }
        apply(next);
        setFiltersOpen(false);
    };

    const clearDraft = () => {
        const next: CatalogQuery = {};
        if (query.sort) {
            next.sort = query.sort;
        }
        setDraft(next);
    };

    const draftMatches = facetQueriesEqual(query, draft);

    return (
        <StoreLayout title="Shop">
            <Head title="Shop" />
            <ShopBreadcrumb items={crumbs} />
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="shop-caption uppercase tracking-[0.16em] text-[var(--shop-text-muted)]">Catalog</p>
                    <h1 className="shop-h1 mt-2">{category ? category.name : query.q ? `Results for “${query.q}”` : 'Shop'}</h1>
                    <p className="mt-2 text-sm text-[var(--shop-text-muted)]">{productCountLabel(products.meta.total)}</p>
                </div>
                <div className="hidden min-[992px]:block">
                    <SortSelect id="catalog-sort" value={query.sort || ''} onChange={setSort} className="w-52 bg-[var(--shop-surface)]" />
                </div>
            </div>

            {topCategories.length > 0 && (
                <div className="mb-4">
                    <div className="-mx-1 flex gap-1 overflow-x-auto pb-1">
                        <CategoryPill active={!query.category} onClick={() => apply({ ...query, category: '' })}>
                            All
                        </CategoryPill>
                        {topCategories.map((c) => (
                            <CategoryPill
                                key={c.id}
                                active={query.category === c.slug || category?.parent_id === c.id}
                                onClick={() => apply({ ...query, category: c.slug })}
                            >
                                {c.name}
                            </CategoryPill>
                        ))}
                    </div>
                    {railChildren.length > 0 && (
                        <div className="-mx-1 mt-1 flex gap-1 overflow-x-auto pb-1">
                            {railChildren.map((c) => (
                                <CategoryPill
                                    key={c.id}
                                    active={query.category === c.slug}
                                    onClick={() => apply({ ...query, category: c.slug })}
                                >
                                    {c.name}
                                </CategoryPill>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <div className="sticky top-14 z-20 -mx-4 mb-4 flex items-center gap-2 border-b border-[var(--shop-border)] bg-[var(--shop-surface)]/95 px-4 py-2 backdrop-blur min-[992px]:hidden">
                <button
                    type="button"
                    className="inline-flex h-11 min-w-11 items-center gap-2 rounded-[var(--shop-radius-control)] px-2 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--shop-accent)]"
                    onClick={() => openSheet(true)}
                >
                    <SlidersHorizontal className="h-4 w-4" />
                    Filter{count > 0 ? ` (${count})` : ''}
                </button>
                <div className="ml-auto min-w-0 flex-1 max-w-52">
                    <SortSelect id="catalog-sort-mobile" value={query.sort || ''} onChange={setSort} className="bg-[var(--shop-surface)]" />
                </div>
            </div>

            {chips.length > 0 && (
                <div className="mb-6 flex flex-wrap items-center gap-2">
                    {chips.map((chip) => (
                        <span
                            key={chip.key}
                            className="inline-flex h-9 items-center gap-1 rounded-[var(--shop-radius-pill)] border border-[var(--shop-border)] bg-[var(--shop-surface)] pl-3 pr-1 text-sm"
                        >
                            {chip.label}
                            <button
                                type="button"
                                onClick={() => removeChip(chip.key)}
                                className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[var(--shop-text-muted)] hover:bg-[var(--shop-bg)] hover:text-[var(--shop-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--shop-accent)]"
                            >
                                <X className="h-3.5 w-3.5" aria-hidden />
                                <span className="sr-only">Remove {chip.label}</span>
                            </button>
                        </span>
                    ))}
                    <button
                        type="button"
                        className="h-9 px-2 text-sm text-[var(--shop-text-muted)] hover:text-[var(--shop-text)]"
                        onClick={clearFilters}
                    >
                        Clear filters
                    </button>
                </div>
            )}

            <div className="sr-only" aria-live="polite">
                {pending ? 'Updating products' : productCountLabel(products.meta.total)}
            </div>

            <div className="grid gap-12 min-[992px]:grid-cols-[260px_1fr]">
                <aside className="hidden min-[992px]:block">
                    <div className="sticky top-24">
                        <div className="mb-2 flex h-11 items-center justify-between">
                            <h2 className="shop-caption uppercase tracking-[0.14em]">Filters</h2>
                            {count > 0 && (
                                <button
                                    type="button"
                                    className="text-sm text-[var(--shop-text-muted)] hover:text-[var(--shop-text)]"
                                    onClick={clearFilters}
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                        <CatalogFilterFields
                            idPrefix="desktop-"
                            filters={query}
                            categories={categories}
                            brands={brands}
                            onChange={apply}
                            includeSearch={false}
                            includeCategory={false}
                            priceBounds={price_bounds}
                        />
                    </div>
                </aside>
                <div aria-busy={pending}>
                    {pending ? (
                        <ProductGrid>
                            {Array.from({ length: 8 }).map((_, i) => (
                                <ProductCardSkeleton key={i} />
                            ))}
                        </ProductGrid>
                    ) : products.data.length === 0 ? (
                        <EmptyState title="No products match these filters" body="Try clearing filters or searching a different term.">
                            <ShopButton variant="secondary" onClick={clearFilters}>
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

            <Sheet open={filtersOpen} onOpenChange={openSheet}>
                <SheetContent
                    side="bottom"
                    className="flex max-h-[85vh] flex-col overflow-hidden rounded-t-[var(--shop-radius-modal)] px-0 pb-0"
                >
                    <SheetHeader className="px-5 text-left">
                        <SheetTitle className="font-[family-name:var(--shop-display-font)] text-xl font-normal">Filters</SheetTitle>
                    </SheetHeader>
                    <div className="flex-1 overflow-y-auto px-5 py-2">
                        <CatalogFilterFields
                            idPrefix="mobile-"
                            filters={draft}
                            categories={categories}
                            brands={brands}
                            onChange={setDraft}
                            priceBounds={price_bounds}
                        />
                    </div>
                    <div className="flex gap-2 border-t border-[var(--shop-border)] px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                        <ShopButton variant="secondary" className="flex-1" onClick={clearDraft}>
                            Clear
                        </ShopButton>
                        <ShopButton className="flex-1" onClick={applyDraft}>
                            {draftMatches ? `Show ${products.meta.total} products` : 'Show products'}
                        </ShopButton>
                    </div>
                </SheetContent>
            </Sheet>
        </StoreLayout>
    );
}
