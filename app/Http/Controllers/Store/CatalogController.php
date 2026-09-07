<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\Setting;
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
        $categories = Category::query()->whereNull('parent_id')->where('is_active', true)->orderBy('sort_order')->get();

        return Inertia::render('store/home', [
            'featured' => $featured->map(fn ($p) => $this->card($p)),
            'newArrivals' => $new->map(fn ($p) => $this->card($p)),
            'onSale' => $sale->map(fn ($p) => $this->card($p)),
            'categories' => $categories,
        ]);
    }

    public function index(Request $request): Response
    {
        $query = Product::query()->active()->with(['brand', 'images', 'category']);

        if ($slug = $request->string('category')->toString()) {
            $cat = Category::query()->where('slug', $slug)->first();
            if ($cat) {
                $ids = Category::query()->where('id', $cat->id)->orWhere('parent_id', $cat->id)->pluck('id');
                $query->whereIn('category_id', $ids);
            }
        }
        if ($brand = $request->string('brand')->toString()) {
            $query->whereHas('brand', fn ($q) => $q->where('slug', $brand));
        }
        if ($request->boolean('in_stock')) {
            $query->where(function ($q) {
                $q->where(function ($s) {
                    $s->where('has_variants', false)->where('stock_quantity', '>', 0);
                })->orWhereHas('variants', fn ($v) => $v->where('is_active', true)->where('stock_quantity', '>', 0));
            });
        }
        if ($request->filled('min_price')) {
            $query->where('price', '>=', $request->input('min_price'));
        }
        if ($request->filled('max_price')) {
            $query->where('price', '<=', $request->input('max_price'));
        }
        if ($q = $request->string('q')->toString()) {
            $like = '%'.$q.'%';
            $query->where(function ($w) use ($like) {
                $w->where('name', 'like', $like)
                    ->orWhere('sku', 'like', $like)
                    ->orWhere('description', 'like', $like)
                    ->orWhereHas('brand', fn ($b) => $b->where('name', 'like', $like));
            });
        }

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

        return Inertia::render('store/catalog', [
            'products' => [
                'data' => $products->getCollection()->map(fn ($p) => $this->card($p)),
                'meta' => [
                    'current_page' => $products->currentPage(),
                    'last_page' => $products->lastPage(),
                    'total' => $products->total(),
                ],
                'links' => $products->linkCollection(),
            ],
            'filters' => $request->only(['category', 'brand', 'q', 'sort', 'in_stock', 'min_price', 'max_price']),
            'categories' => Category::query()->where('is_active', true)->orderBy('sort_order')->get(['id', 'name', 'slug', 'parent_id']),
            'brands' => Brand::query()->where('is_active', true)->orderBy('name')->get(['id', 'name', 'slug']),
        ]);
    }

    public function show(string $slug): Response
    {
        $product = Product::query()->active()->with(['brand', 'category', 'images', 'options.values', 'variants.optionValues'])->where('slug', $slug)->firstOrFail();

        $related = Product::query()->active()->with(['brand', 'images'])
            ->where('category_id', $product->category_id)
            ->where('id', '!=', $product->id)
            ->take(4)
            ->get();

        return Inertia::render('store/product', [
            'product' => [
                'id' => $product->id,
                'name' => $product->name,
                'slug' => $product->slug,
                'sku' => $product->sku,
                'brand' => $product->brand?->only(['name', 'slug']),
                'category' => $product->category?->only(['name', 'slug']),
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
            ],
            'related' => $related->map(fn ($p) => $this->card($p)),
            'jsonLd' => [
                '@context' => 'https://schema.org',
                '@type' => 'Product',
                'name' => $product->name,
                'brand' => $product->brand?->name,
                'sku' => $product->sku,
                'offers' => [
                    '@type' => 'Offer',
                    'priceCurrency' => 'PHP',
                    'price' => $product->price,
                    'availability' => $product->isInStock() ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
                ],
            ],
        ]);
    }

    public function brand(string $slug): Response
    {
        $brand = Brand::query()->where('slug', $slug)->where('is_active', true)->firstOrFail();
        $products = Product::query()->active()->with(['brand', 'images'])->where('brand_id', $brand->id)->paginate(12);

        return Inertia::render('store/brand', [
            'brand' => $brand,
            'products' => [
                'data' => $products->getCollection()->map(fn ($p) => $this->card($p)),
                'meta' => [
                    'current_page' => $products->currentPage(),
                    'last_page' => $products->lastPage(),
                    'total' => $products->total(),
                ],
            ],
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

    private function card(Product $p): array
    {
        return [
            'id' => $p->id,
            'name' => $p->name,
            'slug' => $p->slug,
            'brand' => $p->brand?->name,
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
