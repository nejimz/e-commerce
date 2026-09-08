<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\Setting;
use App\Support\CatalogSeo;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CatalogController extends Controller
{
    public function home(): Response
    {
        $featured = Product::query()->active()->with(['brand', 'images', 'category'])->where('is_featured', true)->take(8)->get();
        $new = Product::query()->active()->with(['brand', 'images'])->latest()->take(8)->get();
        $sale = Product::query()->active()->with(['brand', 'images'])->whereNotNull('compare_at_price')->whereColumn('compare_at_price', '>', 'price')->take(8)->get();
        $categories = Category::query()->active()->whereNull('parent_id')->orderBy('sort_order')->get();
        $children = Category::query()->whereIn('parent_id', $categories->pluck('id'))->get(['id', 'parent_id']);
        $idsByTop = [];
        foreach ($categories as $category) {
            $idsByTop[$category->id] = [$category->id];
        }
        foreach ($children as $child) {
            $idsByTop[$child->parent_id][] = $child->id;
        }
        $covers = Product::query()
            ->active()
            ->with('images')
            ->whereIn('category_id', collect($idsByTop)->flatten()->unique()->values())
            ->orderByDesc('is_featured')
            ->latest()
            ->get()
            ->groupBy('category_id');

        $categoryPayload = $categories->map(function (Category $category) use ($idsByTop, $covers) {
            $image = $category->imageUrl();
            if (! $image) {
                foreach ($idsByTop[$category->id] ?? [] as $categoryId) {
                    $cover = $covers->get($categoryId)?->first();
                    if ($cover?->primaryImage()) {
                        $image = $cover->primaryImage()->url();
                        break;
                    }
                }
            }

            return [
                'id' => $category->id,
                'name' => $category->name,
                'slug' => $category->slug,
                'path' => $category->storePath(),
                'image' => $image,
            ];
        });

        $hero = $featured->first(fn (Product $product) => $product->primaryImage())
            ?? $new->first(fn (Product $product) => $product->primaryImage());

        $storeName = (string) Setting::get('store_name', config('app.name'));
        $seo = [
            'title' => $storeName,
            'description' => 'Shop everyday pieces delivered in Metro Manila. Prices in PHP.',
            'canonical' => url('/'),
            'robots' => 'index,follow',
            'og_image' => $hero?->primaryImage()?->url(),
            'og_type' => 'website',
            'jsonLd' => null,
        ];

        return Inertia::render('store/home', [
            'featured' => $featured->map(fn ($p) => $this->card($p)),
            'newArrivals' => $new->map(fn ($p) => $this->card($p)),
            'onSale' => $sale->map(fn ($p) => $this->card($p)),
            'categories' => $categoryPayload,
            'hero' => $hero ? $this->card($hero) : null,
            'seo' => $seo,
        ]);
    }

    public function index(Request $request): Response|RedirectResponse
    {
        if ($redirect = $this->redirectQueryLandings($request)) {
            return $redirect;
        }

        return $this->listing($request);
    }

    public function category(Request $request, string $category, ?string $subcategory = null): Response|RedirectResponse
    {
        $resolved = $this->resolveCategoryFromPath($category, $subcategory);
        $canonical = $resolved->storePath();
        $current = $subcategory ? '/shop/'.$category.'/'.$subcategory : '/shop/'.$category;
        if ($canonical !== $current) {
            $qs = $request->getQueryString();

            return redirect()->to($qs ? $canonical.'?'.$qs : $canonical, 301);
        }

        return $this->listing($request, $resolved);
    }

    public function brand(Request $request, string $slug): Response
    {
        $brand = Brand::query()->active()->where('slug', $slug)->firstOrFail();

        return $this->listing($request, null, $brand);
    }

    public function show(string $slug): Response
    {
        $product = Product::query()->active()->with(['brand', 'category.parent', 'images', 'options.values', 'variants.optionValues'])->where('slug', $slug)->firstOrFail();

        $related = Product::query()->active()->with(['brand', 'images'])
            ->where('category_id', $product->category_id)
            ->where('id', '!=', $product->id)
            ->take(4)
            ->get();

        $canonical = url('/products/'.$product->slug);
        $ogImage = $product->primaryImage()?->url();
        $jsonLd = [
            '@context' => 'https://schema.org',
            '@type' => 'Product',
            'name' => $product->name,
            'brand' => $product->brand?->name,
            'sku' => $product->sku,
            'url' => $canonical,
            'image' => $ogImage,
            'offers' => [
                '@type' => 'Offer',
                'priceCurrency' => 'PHP',
                'price' => $product->price,
                'availability' => $product->isInStock() ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
                'url' => $canonical,
            ],
        ];
        $seo = [
            'title' => $product->meta_title ?: $product->name,
            'description' => $product->meta_description ?: $product->short_description,
            'canonical' => $canonical,
            'robots' => 'index,follow',
            'og_image' => $ogImage,
            'og_type' => 'product',
            'jsonLd' => $jsonLd,
        ];

        return Inertia::render('store/product', [
            'product' => [
                'id' => $product->id,
                'name' => $product->name,
                'slug' => $product->slug,
                'sku' => $product->sku,
                'brand' => $product->brand?->only(['name', 'slug']),
                'category' => $product->category ? [
                    'name' => $product->category->name,
                    'slug' => $product->category->slug,
                    'path' => $product->category->storePath(),
                    'parent' => $product->category->parent && $product->category->parent->is_active
                        ? [
                            'name' => $product->category->parent->name,
                            'slug' => $product->category->parent->slug,
                            'path' => $product->category->parent->storePath(),
                        ]
                        : null,
                ] : null,
                'price' => (float) $product->price,
                'compare_at_price' => $product->compare_at_price ? (float) $product->compare_at_price : null,
                'short_description' => $product->short_description,
                'description' => $product->description,
                'stock' => $product->availableStock(),
                'has_variants' => $product->has_variants,
                'images' => $product->images->map(fn ($i) => ['url' => $i->url(), 'alt' => $i->alt_text]),
                'options' => $product->options->map(fn ($o) => [
                    'id' => $o->id,
                    'name' => $o->name,
                    'values' => $o->values->map(fn ($v) => ['id' => $v->id, 'value' => $v->value]),
                ]),
                'variants' => $product->variants->map(fn ($v) => [
                    'id' => $v->id,
                    'sku' => $v->sku,
                    'price' => (float) $v->price(),
                    'stock' => $v->stock_quantity,
                    'is_active' => $v->is_active,
                    'option_value_ids' => $v->optionValues->pluck('id'),
                    'label' => $v->optionLabel(),
                ]),
                'meta_title' => $product->meta_title ?: $product->name,
                'meta_description' => $product->meta_description ?: $product->short_description,
                'canonical' => $canonical,
            ],
            'related' => $related->map(fn ($p) => $this->card($p)),
            'jsonLd' => $jsonLd,
            'seo' => $seo,
        ]);
    }

    public function page(string $slug): Response
    {
        $pages = [
            'terms' => ['title' => 'Terms of Sale', 'body' => Setting::get('page_terms', 'Terms of sale will be published here.')],
            'privacy' => ['title' => 'Privacy Notice', 'body' => Setting::get('page_privacy', 'Privacy notice will be published here.')],
            'shipping' => ['title' => 'Shipping & Delivery', 'body' => Setting::get('page_shipping', 'Shipping policy will be published here.')],
            'returns' => ['title' => 'Returns Policy', 'body' => Setting::get('page_returns', 'Returns policy will be published here.')],
            'contact' => ['title' => 'Contact', 'body' => Setting::get('page_contact', 'Email us at hello@example.com')],
        ];
        abort_unless(isset($pages[$slug]), 404);

        return Inertia::render('store/page', $pages[$slug]);
    }

    private function listing(Request $request, ?Category $category = null, ?Brand $brand = null): Response
    {
        if ($category) {
            $request->merge(['category' => $category->slug]);
        }
        if ($brand) {
            $request->merge(['brand' => $brand->slug]);
        }

        $query = $this->applyStorefrontFilters(Product::query()->active()->with(['brand', 'images', 'category']), $request);

        $query->when($request->string('sort')->toString(), function ($q, $sort) {
            match ($sort) {
                'price_asc' => $q->orderBy('price'),
                'price_desc' => $q->orderByDesc('price'),
                'name' => $q->orderBy('name'),
                'newest' => $q->latest(),
                default => $q->orderByDesc('is_featured')->latest(),
            };

            return $q;
        }, fn ($q) => $q->orderByDesc('is_featured')->latest());

        $products = $query->paginate(12)->withQueryString();
        $categories = Category::query()->active()->orderBy('sort_order')->orderBy('name')->get(['id', 'name', 'slug', 'parent_id']);
        $brands = Brand::query()->active()->orderBy('name')->get(['id', 'name', 'slug']);
        $countsByCategoryId = $this->applyStorefrontFilters(Product::query()->active(), $request, ['category'])
            ->selectRaw('category_id, COUNT(*) as aggregate')
            ->groupBy('category_id')
            ->pluck('aggregate', 'category_id');
        $countsByBrandId = $this->applyStorefrontFilters(Product::query()->active(), $request, ['brand'])
            ->whereNotNull('brand_id')
            ->selectRaw('brand_id, COUNT(*) as aggregate')
            ->groupBy('brand_id')
            ->pluck('aggregate', 'brand_id');
        $priceBounds = Product::query()->active()->selectRaw('MIN(price) as min_price, MAX(price) as max_price')->first();

        $filters = $request->only(['category', 'brand', 'q', 'sort', 'in_stock', 'min_price', 'max_price']);
        $cards = $products->getCollection()->map(fn ($p) => $this->card($p))->values();
        $storeName = (string) Setting::get('store_name', config('app.name'));
        $search = $request->string('q')->toString();
        $heading = $brand?->name
            ?? $category?->name
            ?? ($search !== '' ? 'Results for “'.$search.'”' : 'Shop');
        $path = $brand?->storePath() ?? $category?->storePath() ?? '/shop';
        $seo = CatalogSeo::listing(
            $storeName,
            $path,
            $heading,
            $brand?->description ?? $category?->description,
            $brand?->meta_title ?? $category?->meta_title,
            $brand?->meta_description ?? $category?->meta_description,
            $filters,
            $products->currentPage(),
            $products->total(),
            $cards,
            (bool) $category,
            (bool) $brand,
            $brand?->logoUrl() ?? $category?->imageUrl(),
        );

        $parent = $category?->parent_id
            ? ($category->relationLoaded('parent') ? $category->parent : $category->parent()->first())
            : null;

        return Inertia::render('store/catalog', [
            'listing' => $brand ? 'brand' : ($category ? 'category' : 'shop'),
            'category' => $category ? [
                'name' => $category->name,
                'slug' => $category->slug,
                'description' => $category->description,
                'path' => $category->storePath(),
                'image' => $category->imageUrl(),
                'parent' => $parent && $parent->is_active ? [
                    'name' => $parent->name,
                    'slug' => $parent->slug,
                    'path' => $parent->storePath(),
                ] : null,
            ] : null,
            'brand' => $brand ? [
                'name' => $brand->name,
                'slug' => $brand->slug,
                'description' => $brand->description,
                'logo' => $brand->logoUrl(),
            ] : null,
            'seo' => $seo,
            'products' => [
                'data' => $cards,
                'meta' => [
                    'current_page' => $products->currentPage(),
                    'last_page' => $products->lastPage(),
                    'total' => $products->total(),
                ],
                'links' => $products->linkCollection(),
            ],
            'filters' => $filters,
            'categories' => $categories->map(function (Category $item) use ($categories, $countsByCategoryId) {
                $ids = [$item->id];
                if (! $item->parent_id) {
                    $ids = array_merge($ids, $categories->where('parent_id', $item->id)->pluck('id')->all());
                }

                return [
                    'id' => $item->id,
                    'name' => $item->name,
                    'slug' => $item->slug,
                    'parent_id' => $item->parent_id,
                    'count' => collect($ids)->sum(fn ($id) => (int) ($countsByCategoryId[$id] ?? 0)),
                ];
            }),
            'brands' => $brands->map(fn (Brand $item) => [
                'id' => $item->id,
                'name' => $item->name,
                'slug' => $item->slug,
                'count' => (int) ($countsByBrandId[$item->id] ?? 0),
            ]),
            'price_bounds' => $priceBounds && $priceBounds->min_price !== null
                ? ['min' => (float) $priceBounds->min_price, 'max' => (float) $priceBounds->max_price]
                : null,
        ]);
    }

    private function redirectQueryLandings(Request $request): ?RedirectResponse
    {
        $categorySlug = $request->string('category')->toString();
        if ($categorySlug !== '') {
            $category = Category::query()->active()->with('parent')->where('slug', $categorySlug)->firstOrFail();
            $query = $request->except(['category']);

            return $this->permanentTo($category->storePath(), $query);
        }

        $brandSlug = $request->string('brand')->toString();
        if ($brandSlug !== '') {
            $brand = Brand::query()->active()->where('slug', $brandSlug)->firstOrFail();
            $query = $request->except(['brand']);

            return $this->permanentTo($brand->storePath(), $query);
        }

        return null;
    }

    /**
     * @param  array<string, mixed>  $query
     */
    /**
     * @param  array<string, mixed>  $query
     */
    private function permanentTo(string $path, array $query): RedirectResponse
    {
        $qs = http_build_query($query);

        return redirect()->to($qs !== '' ? $path.'?'.$qs : $path, 301);
    }

    private function resolveCategoryFromPath(string $category, ?string $subcategory): Category
    {
        if ($subcategory) {
            $parent = Category::query()->active()->where('slug', $category)->whereNull('parent_id')->firstOrFail();

            return Category::query()->active()->with('parent')->where('slug', $subcategory)->where('parent_id', $parent->id)->firstOrFail();
        }

        return Category::query()->active()->with('parent')->where('slug', $category)->firstOrFail();
    }

    private function applyStorefrontFilters(Builder $query, Request $request, array $except = []): Builder
    {
        if (! in_array('category', $except, true) && ($slug = $request->string('category')->toString())) {
            $cat = Category::query()->active()->where('slug', $slug)->first();
            if ($cat) {
                $query->whereIn('category_id', $cat->descendantAndSelfIds());
            } else {
                $query->whereRaw('0 = 1');
            }
        }
        if (! in_array('brand', $except, true) && ($brand = $request->string('brand')->toString())) {
            $query->whereHas('brand', fn ($q) => $q->active()->where('slug', $brand));
        }
        if (! in_array('in_stock', $except, true) && $request->boolean('in_stock')) {
            $query->where(function ($q) {
                $q->where(function ($s) {
                    $s->where('has_variants', false)->where('stock_quantity', '>', 0);
                })->orWhereHas('variants', fn ($v) => $v->where('is_active', true)->where('stock_quantity', '>', 0));
            });
        }
        if (! in_array('min_price', $except, true) && $request->filled('min_price')) {
            $query->where('price', '>=', $request->input('min_price'));
        }
        if (! in_array('max_price', $except, true) && $request->filled('max_price')) {
            $query->where('price', '<=', $request->input('max_price'));
        }
        if (! in_array('q', $except, true) && ($q = $request->string('q')->toString())) {
            $like = '%'.$q.'%';
            $query->where(function ($w) use ($like) {
                $w->where('name', 'like', $like)
                    ->orWhere('sku', 'like', $like)
                    ->orWhere('description', 'like', $like)
                    ->orWhereHas('brand', fn ($b) => $b->where('name', 'like', $like));
            });
        }

        return $query;
    }

    private function card(Product $p): array
    {
        return [
            'id' => $p->id,
            'name' => $p->name,
            'slug' => $p->slug,
            'brand' => $p->brand?->name,
            'brand_slug' => $p->brand?->slug,
            'price' => (float) $p->price,
            'compare_at_price' => $p->compare_at_price ? (float) $p->compare_at_price : null,
            'stock' => $p->availableStock(),
            'image' => $p->primaryImage()?->url(),
            'is_featured' => $p->is_featured,
            'has_variants' => (bool) $p->has_variants,
            'created_at' => $p->created_at?->toIso8601String(),
        ];
    }
}
