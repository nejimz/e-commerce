<?php

namespace Tests;

use App\Models\Category;
use App\Models\DeliveryArea;
use App\Models\Product;
use App\Models\Setting;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Str;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
    }
    protected function createProduct(array $attrs = []): Product
    {
        $category = Category::query()->first() ?? Category::query()->create([
            'name' => 'Apparel',
            'slug' => 'apparel',
            'is_active' => true,
        ]);

        return Product::query()->create(array_merge([
            'category_id' => $category->id,
            'name' => 'Test Item',
            'slug' => 'test-item-'.Str::random(8),
            'sku' => 'SKU-'.Str::random(8),
            'price' => 1000,
            'stock_quantity' => 10,
            'low_stock_threshold' => 5,
            'is_active' => true,
        ], $attrs));
    }

    protected function allowMakati(): DeliveryArea
    {
        return DeliveryArea::query()->create([
            'country_code' => 'PH',
            'province' => 'Metro Manila',
            'city' => 'Makati',
            'mode' => 'allow',
            'delivery_fee' => 80,
            'free_shipping_eligible' => true,
            'is_active' => true,
        ]);
    }

    protected function allowCountry(string $code, float $fee = 450): DeliveryArea
    {
        return DeliveryArea::query()->create([
            'country_code' => $code,
            'province' => null,
            'city' => null,
            'mode' => 'allow',
            'delivery_fee' => $fee,
            'free_shipping_eligible' => false,
            'same_day_eligible' => false,
            'is_active' => true,
        ]);
    }

    protected function checkoutPayload(array $over = []): array
    {
        return array_merge([
            'name' => 'Jane Customer',
            'email' => 'jane@example.com',
            'phone' => '09171234567',
            'line1' => '123 Test Street',
            'city' => 'Makati',
            'province' => 'Metro Manila',
            'postal_code' => '1200',
            'payment_method' => 'cod',
            'terms' => true,
            'idempotency_key' => (string) Str::uuid(),
        ], $over);
    }

    protected function putSetting(string $key, mixed $value): void
    {
        Setting::put($key, $value);
    }
}
