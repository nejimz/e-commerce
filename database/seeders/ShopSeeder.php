<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Coupon;
use App\Models\DeliveryArea;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\ProductOption;
use App\Models\ProductVariant;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ShopSeeder extends Seeder
{
    public function run(): void
    {
        User::query()->updateOrCreate(['email' => 'admin@example.com'], [
            'name' => 'Store Admin',
            'phone' => '09171234567',
            'password' => Hash::make('password'),
            'role' => UserRole::Admin,
            'is_active' => true,
        ]);
        User::query()->updateOrCreate(['email' => 'staff@example.com'], [
            'name' => 'Fulfilment Staff',
            'phone' => '09181234567',
            'password' => Hash::make('password'),
            'role' => UserRole::Staff,
            'is_active' => true,
        ]);
        User::query()->updateOrCreate(['email' => 'customer@example.com'], [
            'name' => 'Jane Customer',
            'phone' => '09191234567',
            'password' => Hash::make('password'),
            'role' => UserRole::Customer,
            'is_active' => true,
        ]);

        $settings = [
            'store_name' => 'Shop',
            'announcement' => 'Free delivery over PHP 2,000 in Metro Manila.',
            'store_paused' => '0',
            'store_paused_message' => 'We are closed for stocktake. Browse as usual — checkout reopens soon.',
            'ordering_hours_enabled' => '0',
            'ordering_hours_start' => '08:00',
            'ordering_hours_end' => '22:00',
            'unlisted_area_default' => 'block',
            'default_delivery_fee' => '120',
            'free_delivery_enabled' => '1',
            'free_delivery_threshold' => '2000',
            'packing_fee' => '0',
            'vat_enabled' => '1',
            'vat_rate' => '12',
            'cod_maximum' => '8000',
            'unpaid_release_minutes' => '60',
        ];
        foreach ($settings as $k => $v) {
            Setting::put($key = $k, $v);
        }

        $mm = ['Quezon City', 'Makati', 'Manila', 'Pasig', 'Taguig', 'Mandaluyong'];
        foreach ($mm as $city) {
            DeliveryArea::query()->updateOrCreate(
                ['province' => 'Metro Manila', 'city' => $city],
                ['mode' => 'allow', 'delivery_fee' => 80, 'same_day_eligible' => true, 'is_active' => true],
            );
        }
        DeliveryArea::query()->updateOrCreate(
            ['province' => 'Cebu', 'city' => 'Cebu City'],
            ['mode' => 'allow', 'delivery_fee' => 180, 'same_day_eligible' => false, 'is_active' => true],
        );

        Coupon::query()->updateOrCreate(['code' => 'WELCOME10'], [
            'type' => 'percentage',
            'value' => 10,
            'minimum_purchase' => 500,
            'is_active' => true,
        ]);

        $apparel = Category::query()->updateOrCreate(['slug' => 'apparel'], ['name' => 'Apparel', 'is_active' => true, 'sort_order' => 1]);
        $home = Category::query()->updateOrCreate(['slug' => 'home'], ['name' => 'Home', 'is_active' => true, 'sort_order' => 2]);
        $shirts = Category::query()->updateOrCreate(['slug' => 'shirts'], ['name' => 'Shirts', 'parent_id' => $apparel->id, 'is_active' => true, 'sort_order' => 1]);
        $kitchen = Category::query()->updateOrCreate(['slug' => 'kitchen'], ['name' => 'Kitchen', 'parent_id' => $home->id, 'is_active' => true, 'sort_order' => 1]);

        $acme = Brand::query()->updateOrCreate(['slug' => 'acme'], ['name' => 'Acme', 'is_active' => true]);
        $hearth = Brand::query()->updateOrCreate(['slug' => 'hearth'], ['name' => 'Hearth', 'is_active' => true]);

        $this->simpleProduct($shirts, $acme, 'Classic Oxford Shirt', 1290, 40, true);
        $this->variantShirt($shirts, $acme);
        $this->simpleProduct($shirts, $acme, 'Linen Camp Shirt', 1590, 18, false, 1890);
        $this->simpleProduct($kitchen, $hearth, 'Ceramic Pour-Over Set', 980, 25, true);
        $this->simpleProduct($kitchen, $hearth, 'Cast Iron Skillet 25cm', 2450, 12, true);
        $this->simpleProduct($kitchen, $hearth, 'Cotton Kitchen Towel 3-pack', 390, 60, false);
        $this->simpleProduct($home, $hearth, 'Wool Throw Blanket', 1890, 8, true);
        $this->simpleProduct($home, $hearth, 'Cedar Storage Box', 720, 20, false);
        $this->simpleProduct($apparel, $acme, 'Everyday Crew Socks', 250, 80, false);
        $this->simpleProduct($home, $hearth, 'Stoneware Mug', 320, 45, false);
        $this->simpleProduct($shirts, $acme, 'Merino Polo', 2100, 6, true, 2400);
        $this->simpleProduct($kitchen, $hearth, 'Bamboo Cutting Board', 650, 22, false);

        $this->categoryPhoto($apparel);
        $this->categoryPhoto($home);
        $this->categoryPhoto($shirts);
        $this->categoryPhoto($kitchen);
    }

    private function simpleProduct(Category $cat, Brand $brand, string $name, float $price, int $stock, bool $featured, ?float $compare = null): Product
    {
        $product = Product::query()->updateOrCreate(['slug' => Str::slug($name)], [
            'category_id' => $cat->id,
            'brand_id' => $brand->id,
            'name' => $name,
            'sku' => strtoupper(Str::slug($name, '-')),
            'short_description' => $name.' — a well-made everyday piece.',
            'description' => 'Quality materials, considered details, made to last. '.$name.' belongs in a simple, useful home.',
            'price' => $price,
            'compare_at_price' => $compare,
            'stock_quantity' => $stock,
            'low_stock_threshold' => 5,
            'has_variants' => false,
            'is_featured' => $featured,
            'is_active' => true,
        ]);
        $this->placeholderImage($product);

        return $product;
    }

    private function variantShirt(Category $cat, Brand $brand): void
    {
        $product = Product::query()->updateOrCreate(['slug' => 'everyday-tee'], [
            'category_id' => $cat->id,
            'brand_id' => $brand->id,
            'name' => 'Everyday Tee',
            'sku' => null,
            'short_description' => 'Soft cotton tee in core colors.',
            'description' => 'A mid-weight cotton tee. Choose color and size.',
            'price' => 590,
            'stock_quantity' => 0,
            'has_variants' => true,
            'is_featured' => true,
            'is_active' => true,
        ]);
        $this->placeholderImage($product);

        $color = ProductOption::query()->updateOrCreate(['product_id' => $product->id, 'name' => 'Color'], ['sort_order' => 1]);
        $size = ProductOption::query()->updateOrCreate(['product_id' => $product->id, 'name' => 'Size'], ['sort_order' => 2]);
        $colors = [];
        foreach (['Bone', 'Navy', 'Ink'] as $i => $v) {
            $colors[$v] = $color->values()->updateOrCreate(['value' => $v], ['sort_order' => $i]);
        }
        $sizes = [];
        foreach (['S', 'M', 'L'] as $i => $v) {
            $sizes[$v] = $size->values()->updateOrCreate(['value' => $v], ['sort_order' => $i]);
        }

        $sku = 1;
        foreach ($colors as $cName => $cVal) {
            foreach ($sizes as $sName => $sVal) {
                $variant = ProductVariant::query()->updateOrCreate(
                    ['sku' => 'TEE-'.$cName.'-'.$sName],
                    ['product_id' => $product->id, 'stock_quantity' => 12, 'is_active' => true],
                );
                $variant->optionValues()->sync([$cVal->id, $sVal->id]);
                $sku++;
            }
        }
    }

    private function placeholderImage(Product $product): void
    {
        $existing = $product->images()->orderBy('sort_order')->get();
        $primary = $existing->firstWhere('is_primary', true) ?? $existing->first();
        if ($primary && ! $this->isBlankStoredImage($primary->path)) {
            return;
        }

        $slug = Str::slug($product->name);
        $stored = $this->storeRandomPhoto("products/{$slug}.jpg", $slug, 1200, 1200);
        if (! $stored) {
            if ($primary) {
                return;
            }
            $stored = $this->storeSvgPlaceholder($slug, $product->name);
        }

        if ($primary) {
            if ($primary->path !== $stored) {
                Storage::disk('public')->delete($primary->path);
            }
            $primary->update([
                'path' => $stored,
                'path_webp' => null,
                'alt_text' => $product->name,
            ]);

            return;
        }

        ProductImage::query()->create([
            'product_id' => $product->id,
            'path' => $stored,
            'alt_text' => $product->name,
            'is_primary' => true,
            'sort_order' => 0,
        ]);
    }

    private function categoryPhoto(Category $category): void
    {
        if ($category->image && ! $this->isBlankStoredImage($category->image)) {
            return;
        }

        $path = $this->storeRandomPhoto('categories/'.$category->slug.'.jpg', 'category-'.$category->slug, 800, 1000);
        if (! $path) {
            return;
        }

        if ($category->image && $category->image !== $path) {
            Storage::disk('public')->delete($category->image);
        }

        $category->update(['image' => $path]);
    }

    private function storeRandomPhoto(string $path, string $seed, int $width, int $height): ?string
    {
        $binary = $this->fetchRandomPhoto($seed, $width, $height);
        if ($binary === null) {
            return null;
        }

        Storage::disk('public')->put($path, $binary);

        return $path;
    }

    private function fetchRandomPhoto(string $seed, int $width, int $height): ?string
    {
        if (app()->runningUnitTests()) {
            return null;
        }

        try {
            $response = Http::timeout(20)
                ->withHeaders(['Accept' => 'image/jpeg,image/*,*/*'])
                ->get('https://picsum.photos/seed/'.rawurlencode($seed)."/{$width}/{$height}");

            if ($response->successful() && str_contains(strtolower($response->header('Content-Type', '')), 'image/') && strlen($response->body()) > 2000) {
                return $response->body();
            }
        } catch (\Throwable $e) {
            $this->command?->warn("Could not fetch photo for {$seed}: ".$e->getMessage());
        }

        return null;
    }

    private function storeSvgPlaceholder(string $slug, string $label): string
    {
        $svg = '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200"><rect fill="#F7F5F2" width="1200" height="1200"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#1F6B4A" font-size="48" font-family="sans-serif">'.htmlspecialchars($label).'</text></svg>';
        $path = "products/{$slug}.svg";
        Storage::disk('public')->put($path, $svg);

        return $path;
    }

    private function isBlankStoredImage(?string $path): bool
    {
        return $path === null || $path === '' || str_ends_with(strtolower($path), '.svg');
    }
}
