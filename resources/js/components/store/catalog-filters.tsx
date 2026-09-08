import { ShopCheckbox, ShopInput, ShopLabel } from '@/components/store/shop-input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import { Check, ChevronDown } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';

export type CatalogQuery = Record<string, string>;

export type FacetOption = {
    id: number;
    name: string;
    slug: string;
    parent_id?: number | null;
    count?: number;
};

export type PriceBounds = { min: number; max: number } | null;

export type PricePreset = { min: string; max: string; label: string };

const FACET_KEYS = ['q', 'category', 'brand', 'min_price', 'max_price', 'in_stock'] as const;

export function pricePresets(bounds?: PriceBounds): PricePreset[] {
    const buckets: { min: number | null; max: number | null; label: string }[] = [
        { min: null, max: 500, label: 'Under 500' },
        { min: 500, max: 1000, label: '500–1,000' },
        { min: 1000, max: 2500, label: '1,000–2,500' },
        { min: 2500, max: null, label: '2,500+' },
    ];
    const catalogMin = bounds?.min ?? 0;
    const catalogMax = bounds?.max ?? Number.POSITIVE_INFINITY;

    return buckets
        .filter((bucket) => {
            const lo = bucket.min ?? 0;
            const hi = bucket.max ?? Number.POSITIVE_INFINITY;

            return lo <= catalogMax && hi >= catalogMin;
        })
        .map((bucket) => ({
            min: bucket.min == null ? '' : String(bucket.min),
            max: bucket.max == null ? '' : String(bucket.max),
            label: bucket.label,
        }));
}

export function formatPriceFilterLabel(min?: string, max?: string): string {
    const minN = min ? Number(min) : Number.NaN;
    const maxN = max ? Number(max) : Number.NaN;
    const hasMin = Number.isFinite(minN) && minN > 0;
    const hasMax = Number.isFinite(maxN) && maxN > 0;

    if (hasMin && hasMax) {
        return `${formatMoney(minN)} – ${formatMoney(maxN)}`;
    }
    if (hasMax) {
        return `Under ${formatMoney(maxN)}`;
    }
    if (hasMin) {
        return `${formatMoney(minN)}+`;
    }

    return '';
}

export function facetQueriesEqual(a: CatalogQuery, b: CatalogQuery): boolean {
    return FACET_KEYS.every((key) => (a[key] || '') === (b[key] || ''));
}

function FilterGroup({ title, children, defaultOpen = true }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <Collapsible
            open={open}
            onOpenChange={setOpen}
            className="border-b border-[var(--shop-border)] py-1 first:pt-0 last:border-b-0"
        >
            <CollapsibleTrigger
                type="button"
                className="flex min-h-11 w-full items-center justify-between gap-3 text-left outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--shop-accent)]"
            >
                <span className="shop-caption uppercase tracking-[0.14em] text-[var(--shop-text)]">{title}</span>
                <ChevronDown
                    className={cn(
                        'h-4 w-4 shrink-0 text-[var(--shop-text-muted)] transition-transform duration-[var(--shop-duration-micro)] ease-[var(--shop-ease)]',
                        open && 'rotate-180',
                    )}
                    aria-hidden
                />
            </CollapsibleTrigger>
            <CollapsibleContent className="pb-4">{children}</CollapsibleContent>
        </Collapsible>
    );
}

function FacetRow({
    active,
    children,
    count,
    indent = false,
    onClick,
    shape = 'radio',
}: {
    active: boolean;
    children: string;
    count?: number;
    indent?: boolean;
    onClick: () => void;
    shape?: 'radio' | 'check';
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            className={cn(
                'flex min-h-11 w-full items-center gap-2.5 rounded-[var(--shop-radius-control)] text-left text-sm transition-colors duration-[var(--shop-duration-micro)] ease-[var(--shop-ease)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--shop-accent)]',
                indent ? 'pl-7' : 'px-0.5',
                active ? 'font-medium text-[var(--shop-text)]' : 'text-[var(--shop-text-muted)] hover:text-[var(--shop-text)]',
            )}
        >
            <span
                className={cn(
                    'inline-flex h-4 w-4 shrink-0 items-center justify-center border transition-colors duration-[var(--shop-duration-micro)] ease-[var(--shop-ease)]',
                    shape === 'radio' ? 'rounded-full' : 'rounded-[3px]',
                    active
                        ? 'border-[var(--shop-accent)] bg-[var(--shop-accent)] text-[var(--shop-on-accent)]'
                        : 'border-[var(--shop-border)] bg-[var(--shop-surface)]',
                )}
                aria-hidden
            >
                {active ? <Check className="h-3 w-3" strokeWidth={2.5} /> : null}
            </span>
            <span className="min-w-0 flex-1 truncate">{children}</span>
            {typeof count === 'number' ? (
                <span className="shop-caption shrink-0 tabular-nums text-[var(--shop-text-dim)]">{count}</span>
            ) : null}
        </button>
    );
}

export function CatalogFilterFields({
    filters,
    categories,
    brands,
    onChange,
    includeSearch = true,
    includeCategory = true,
    idPrefix = '',
    priceBounds = null,
}: {
    filters: CatalogQuery;
    categories: FacetOption[];
    brands: { id: number; name: string; slug: string; count?: number }[];
    onChange: (next: CatalogQuery) => void;
    includeSearch?: boolean;
    includeCategory?: boolean;
    idPrefix?: string;
    priceBounds?: PriceBounds;
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

    const commitPrices = (nextMin = minPrice, nextMax = maxPrice) => {
        const next = { ...filters };
        if (nextMin) {
            next.min_price = nextMin;
        } else {
            delete next.min_price;
        }
        if (nextMax) {
            next.max_price = nextMax;
        } else {
            delete next.max_price;
        }
        delete next.page;
        onChange(next);
    };

    const applyPreset = (preset: PricePreset) => {
        const same = (filters.min_price || '') === preset.min && (filters.max_price || '') === preset.max;
        if (same) {
            setMinPrice('');
            setMaxPrice('');
            commitPrices('', '');
            return;
        }
        setMinPrice(preset.min);
        setMaxPrice(preset.max);
        commitPrices(preset.min, preset.max);
    };

    const parents = categories.filter((c) => !c.parent_id);
    const childrenOf = (id: number) => categories.filter((c) => c.parent_id === id);
    const selected = categories.find((c) => c.slug === filters.category);
    const presets = pricePresets(priceBounds);

    const showChildren = (parent: FacetOption) => {
        if (!filters.category) {
            return false;
        }

        return filters.category === parent.slug || selected?.parent_id === parent.id;
    };

    return (
        <div>
            {includeSearch && (
                <div className="border-b border-[var(--shop-border)] pb-4">
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
            {includeCategory && (
                <FilterGroup title="Category">
                    <div className="space-y-0.5">
                        <FacetRow active={!filters.category} onClick={() => patch('category', '')}>
                            All
                        </FacetRow>
                        {parents.map((c) => (
                            <div key={c.id}>
                                <FacetRow
                                    active={filters.category === c.slug || selected?.parent_id === c.id}
                                    count={c.count}
                                    onClick={() => patch('category', c.slug)}
                                >
                                    {c.name}
                                </FacetRow>
                                {showChildren(c) &&
                                    childrenOf(c.id).map((child) => (
                                        <FacetRow
                                            key={child.id}
                                            active={filters.category === child.slug}
                                            count={child.count}
                                            indent
                                            onClick={() => patch('category', child.slug)}
                                        >
                                            {child.name}
                                        </FacetRow>
                                    ))}
                            </div>
                        ))}
                    </div>
                </FilterGroup>
            )}
            <FilterGroup title="Brand">
                <div className="max-h-56 space-y-0.5 overflow-y-auto pr-1">
                    <FacetRow active={!filters.brand} onClick={() => patch('brand', '')}>
                        All
                    </FacetRow>
                    {brands.map((b) => (
                        <FacetRow key={b.id} active={filters.brand === b.slug} count={b.count} onClick={() => patch('brand', b.slug)}>
                            {b.name}
                        </FacetRow>
                    ))}
                </div>
            </FilterGroup>
            <FilterGroup title="Price">
                {presets.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-1.5">
                        {presets.map((preset) => {
                            const active = (filters.min_price || '') === preset.min && (filters.max_price || '') === preset.max;

                            return (
                                <button
                                    key={preset.label}
                                    type="button"
                                    aria-pressed={active}
                                    onClick={() => applyPreset(preset)}
                                    className={cn(
                                        'inline-flex h-9 items-center rounded-[var(--shop-radius-pill)] border px-3 text-sm transition-colors duration-[var(--shop-duration-micro)] ease-[var(--shop-ease)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--shop-accent)]',
                                        active
                                            ? 'border-[var(--shop-text)] bg-[var(--shop-surface)] text-[var(--shop-text)]'
                                            : 'border-[var(--shop-border)] bg-[var(--shop-surface)] text-[var(--shop-text-muted)] hover:text-[var(--shop-text)]',
                                    )}
                                >
                                    {preset.label}
                                </button>
                            );
                        })}
                    </div>
                )}
                <ShopLabel className="sr-only">Price (PHP)</ShopLabel>
                <div className="flex items-center gap-2">
                    <ShopInput
                        inputMode="numeric"
                        placeholder="Min"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        onBlur={() => commitPrices()}
                        aria-label="Minimum price"
                    />
                    <span className="text-[var(--shop-text-dim)]">–</span>
                    <ShopInput
                        inputMode="numeric"
                        placeholder="Max"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        onBlur={() => commitPrices()}
                        aria-label="Maximum price"
                    />
                </div>
            </FilterGroup>
            <FilterGroup title="Availability">
                <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-sm">
                    <ShopCheckbox checked={Boolean(filters.in_stock)} onChange={(e) => patch('in_stock', e.target.checked ? '1' : '')} />
                    In stock only
                </label>
            </FilterGroup>
        </div>
    );
}

export function activeFilterCount(filters: CatalogQuery): number {
    return FACET_KEYS.filter((key) => Boolean(filters[key])).length;
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

export function productCountLabel(total: number): string {
    return `${total} ${total === 1 ? 'product' : 'products'}`;
}
