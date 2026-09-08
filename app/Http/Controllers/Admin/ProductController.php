<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\ProductVariant;
use App\Services\ImagePipelineService;
use App\Services\InventoryService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $products = Product::query()->with(['brand', 'category'])
            ->when($request->search, fn ($q, $s) => $q->where('name', 'like', "%{$s}%")->orWhere('sku', 'like', "%{$s}%"))
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('admin/products/index', [
            'products' => $products,
            'filters' => $request->only(['search']),
        ]);
    }

    public function create()
    {
        return Inertia::render('admin/products/form', [
            'product' => null,
            'categories' => $this->catalogCategories(),
            'brands' => $this->catalogBrands(),
        ]);
    }

    public function store(Request $request)
    {
        $data = $this->validated($request);
        $data['slug'] = Str::slug($data['name']);
        $product = Product::query()->create($data);

        return redirect()->route('admin.products.edit', $product)->with('success', 'Product created.');
    }

    public function edit(Product $product)
    {
        $product->load(['images', 'options.values', 'variants.optionValues']);

        return Inertia::render('admin/products/form', [
            'product' => $product,
            'categories' => $this->catalogCategories($product->category_id),
            'brands' => $this->catalogBrands($product->brand_id),
        ]);
    }

    public function update(Request $request, Product $product)
    {
        $product->update($this->validated($request, $product->id));

        return back()->with('success', 'Product saved.');
    }

    public function destroy(Product $product)
    {
        $product->delete();

        return redirect()->route('admin.products.index')->with('success', 'Product archived.');
    }

    public function adjustStock(Request $request, Product $product, InventoryService $inventory)
    {
        $data = $request->validate([
            'variant_id' => 'nullable|integer',
            'stock_quantity' => 'required|integer|min:0',
            'reason' => 'required|string|max:200',
        ]);
        $variant = $data['variant_id'] ? ProductVariant::query()->find($data['variant_id']) : null;
        $inventory->adjust($product, $variant, (int) $data['stock_quantity'], $request->user()->id, $data['reason']);

        return back()->with('success', 'Stock updated.');
    }

    public function storeImage(Request $request, Product $product)
    {
        $request->validate(['image' => 'required|image|max:2048']);
        $stored = app(ImagePipelineService::class)->storeProductImage($request->file('image'));
        ProductImage::query()->create([
            'product_id' => $product->id,
            'path' => $stored['path'],
            'path_webp' => $stored['path_webp'],
            'alt_text' => $product->name,
            'is_primary' => $product->images()->count() === 0,
            'sort_order' => $product->images()->count(),
        ]);

        return back()->with('success', 'Image uploaded.');
    }

    private function validated(Request $request, ?int $id = null): array
    {
        return $request->validate([
            'name' => 'required|string|min:2|max:200',
            'sku' => 'nullable|alpha_dash|unique:products,sku,'.($id ?? 'NULL'),
            'category_id' => 'required|exists:categories,id',
            'brand_id' => 'nullable|exists:brands,id',
            'short_description' => 'nullable|string|max:500',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0|max:9999999.99',
            'compare_at_price' => 'nullable|numeric|min:0',
            'stock_quantity' => 'required|integer|min:0',
            'low_stock_threshold' => 'required|integer|min:0',
            'has_variants' => 'boolean',
            'is_featured' => 'boolean',
            'is_active' => 'boolean',
            'meta_title' => 'nullable|string|max:70',
            'meta_description' => 'nullable|string|max:160',
        ]);
    }

    /**
     * @return list<array{id: int, name: string, parent_id: int|null, parent_name: string|null, is_active: bool}>
     */
    private function catalogCategories(?int $keepId = null): array
    {
        $all = Category::query()
            ->with('parent:id,name')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'name', 'parent_id', 'is_active']);

        $parents = $all->whereNull('parent_id');
        $ordered = collect();
        foreach ($parents as $parent) {
            $ordered->push($parent);
            foreach ($all->where('parent_id', $parent->id) as $child) {
                $ordered->push($child);
            }
        }
        foreach ($all as $category) {
            if ($category->parent_id && ! $ordered->contains('id', $category->id)) {
                $ordered->push($category);
            }
        }

        return $ordered
            ->filter(fn (Category $category) => $category->is_active || $category->id === $keepId)
            ->map(fn (Category $category) => [
                'id' => $category->id,
                'name' => $category->name,
                'parent_id' => $category->parent_id,
                'parent_name' => $category->parent?->name,
                'is_active' => $category->is_active,
            ])
            ->values()
            ->all();
    }

    /**
     * @return list<array{id: int, name: string, is_active: bool}>
     */
    private function catalogBrands(?int $keepId = null): array
    {
        return Brand::query()
            ->orderBy('name')
            ->get(['id', 'name', 'is_active'])
            ->filter(fn (Brand $brand) => $brand->is_active || $brand->id === $keepId)
            ->map(fn (Brand $brand) => [
                'id' => $brand->id,
                'name' => $brand->name,
                'is_active' => $brand->is_active,
            ])
            ->values()
            ->all();
    }
}
