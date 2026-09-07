import { ShopInput, ShopLabel, ShopSelect } from '@/components/store/shop-input';
import { useEffect, useState } from 'react';

export type CatalogQuery = Record<string, string>;

export type FacetOption = { id: number; name: string; slug: string; parent_id?: number | null };

export function CatalogFilterFields({
    filters,
    categories,
    brands,
    onChange,
    includeSearch = true,
    idPrefix = '',
}: {
    filters: CatalogQuery;
    categories: FacetOption[];
    brands: { id: number; name: string; slug: string }[];
    onChange: (next: CatalogQuery) => void;
    includeSearch?: boolean;
    idPrefix?: string;
}) {
    const [minPrice, setMinPrice] = useState(filters.min_price || '');
    const [maxPrice, setMaxPrice] = useState(filters.max_price || '');

    useEffect(() => {
        setMinPrice(filters.min_price || '');
        setMaxPrice(filters.max_price || '');
    }, [filters.min_price, filters.max_price]);

    const patch = (key: string, value: string) => {
        const next = { ...filters, [key]: value };
        if (!value) {
            delete next[key];
        }
        delete next.page;
        onChange(next);
    };

    const commitPrices = () => {
        const next = { ...filters };
        if (minPrice) {
            next.min_price = minPrice;
        } else {
            delete next.min_price;
        }
        if (maxPrice) {
            next.max_price = maxPrice;
        } else {
            delete next.max_price;
        }
        delete next.page;
        onChange(next);
    };

    return (
        <div className="space-y-5">
            {includeSearch && (
                <div>
                    <ShopLabel htmlFor={`${idPrefix}catalog-q`}>Search</ShopLabel>
                    <ShopInput
                        id={`${idPrefix}catalog-q`}
                        name="q"
                        key={filters.q || ''}
                        defaultValue={filters.q || ''}
                        placeholder="Name, brand, or SKU"
                        onBlur={(e) => patch('q', e.target.value.trim())}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                patch('q', (e.target as HTMLInputElement).value.trim());
                            }
                        }}
                    />
                </div>
            )}
            <div>
                <ShopLabel htmlFor={`${idPrefix}catalog-category`}>Category</ShopLabel>
                <ShopSelect id={`${idPrefix}catalog-category`} value={filters.category || ''} onChange={(e) => patch('category', e.target.value)}>
                    <option value="">All</option>
                    {categories.map((c) => (
                        <option key={c.id} value={c.slug}>
                            {c.parent_id ? `— ${c.name}` : c.name}
                        </option>
                    ))}
                </ShopSelect>
            </div>
            <div>
                <ShopLabel htmlFor={`${idPrefix}catalog-brand`}>Brand</ShopLabel>
                <ShopSelect id={`${idPrefix}catalog-brand`} value={filters.brand || ''} onChange={(e) => patch('brand', e.target.value)}>
                    <option value="">All</option>
                    {brands.map((b) => (
                        <option key={b.id} value={b.slug}>
                            {b.name}
                        </option>
                    ))}
                </ShopSelect>
            </div>
            <div>
                <ShopLabel>Price (PHP)</ShopLabel>
                <div className="flex gap-2">
                    <ShopInput
                        inputMode="numeric"
                        placeholder="Min"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        onBlur={commitPrices}
                        aria-label="Minimum price"
                    />
                    <ShopInput
                        inputMode="numeric"
                        placeholder="Max"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        onBlur={commitPrices}
                        aria-label="Maximum price"
                    />
                </div>
            </div>
            <label className="flex min-h-11 items-center gap-2 text-sm">
                <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-[var(--shop-border)] accent-[var(--shop-accent)]"
                    checked={Boolean(filters.in_stock)}
                    onChange={(e) => patch('in_stock', e.target.checked ? '1' : '')}
                />
                In stock only
            </label>
        </div>
    );
}

export function activeFilterCount(filters: CatalogQuery): number {
    return ['q', 'category', 'brand', 'min_price', 'max_price', 'in_stock'].filter((key) => Boolean(filters[key])).length;
}

export function catalogHref(filters: CatalogQuery, page?: number): string {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
        if (v && k !== 'page') {
            params.set(k, v);
        }
    });
    if (page && page > 1) {
        params.set('page', String(page));
    }
    const qs = params.toString();

    return qs ? `/shop?${qs}` : '/shop';
}
