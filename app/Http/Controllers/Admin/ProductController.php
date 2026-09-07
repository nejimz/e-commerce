<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\ProductOption;
use App\Models\ProductVariant;
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
            'categories' => Category::query()->orderBy('name')->get(),
            'brands' => Brand::query()->orderBy('name')->get(),
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
            'categories' => Category::query()->orderBy('name')->get(),
            'brands' => Brand::query()->orderBy('name')->get(),
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
        $stored = app(\App\Services\ImagePipelineService::class)->storeProductImage($request->file('image'));
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
}
