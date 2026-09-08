<?php

namespace Tests\Feature;

use App\Models\Brand;
use App\Models\Category;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class StoreCatalogTest extends TestCase
{
    use RefreshDatabase;

    public function test_combined_facets_return_only_matching_products(): void
    {
        $apparel = Category::query()->create(['name' => 'Apparel', 'slug' => 'apparel', 'is_active' => true]);
        $home = Category::query()->create(['name' => 'Home', 'slug' => 'home', 'is_active' => true]);
        $acme = Brand::query()->create(['name' => 'Acme', 'slug' => 'acme', 'is_active' => true]);
        $other = Brand::query()->create(['name' => 'Other', 'slug' => 'other', 'is_active' => true]);

        $this->createProduct([
            'name' => 'Matching Shirt',
            'category_id' => $apparel->id,
            'brand_id' => $acme->id,
            'price' => 800,
        ]);
        $this->createProduct([
            'name' => 'Wrong Category',
            'category_id' => $home->id,
            'brand_id' => $acme->id,
            'price' => 800,
        ]);
        $this->createProduct([
            'name' => 'Wrong Brand',
            'category_id' => $apparel->id,
            'brand_id' => $other->id,
            'price' => 800,
        ]);
        $this->createProduct([
            'name' => 'Too Expensive',
            'category_id' => $apparel->id,
            'brand_id' => $acme->id,
            'price' => 2000,
        ]);

        $this->get('/shop?category=apparel&brand=acme&max_price=1000')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('store/catalog')
                ->where('filters.category', 'apparel')
                ->where('filters.brand', 'acme')
                ->where('filters.max_price', '1000')
                ->has('products.data', 1)
                ->where('products.data.0.name', 'Matching Shirt')
                ->where('products.meta.total', 1)
            );
    }

    public function test_filtered_url_reproduces_the_same_results(): void
    {
        $acme = Brand::query()->create(['name' => 'Acme', 'slug' => 'acme', 'is_active' => true]);
        $this->createProduct(['name' => 'Acme Lamp', 'brand_id' => $acme->id]);
        $this->createProduct(['name' => 'Plain Lamp']);

        $first = $this->get('/shop?brand=acme')->assertOk();
        $second = $this->get('/shop?brand=acme')->assertOk();

        $first->assertInertia(fn (Assert $page) => $page
            ->component('store/catalog')
            ->where('filters.brand', 'acme')
            ->has('products.data', 1)
            ->where('products.data.0.name', 'Acme Lamp')
        );
        $second->assertInertia(fn (Assert $page) => $page
            ->component('store/catalog')
            ->where('filters.brand', 'acme')
            ->has('products.data', 1)
            ->where('products.data.0.name', 'Acme Lamp')
        );
    }

    public function test_empty_search_renders_catalog_with_no_products(): void
    {
        $this->createProduct(['name' => 'Visible Item']);

        $this->get('/shop?q=zzznomatch')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('store/catalog')
                ->where('filters.q', 'zzznomatch')
                ->has('products.data', 0)
                ->where('products.meta.total', 0)
                ->has('categories')
                ->has('brands')
                ->has('price_bounds')
            );
    }

    public function test_pagination_preserves_filters(): void
    {
        $brand = Brand::query()->create(['name' => 'Acme', 'slug' => 'acme', 'is_active' => true]);
        for ($i = 1; $i <= 13; $i++) {
            $this->createProduct([
                'name' => 'Paged Item '.$i,
                'brand_id' => $brand->id,
            ]);
        }

        $this->get('/shop?brand=acme&page=2')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('store/catalog')
                ->where('filters.brand', 'acme')
                ->where('products.meta.current_page', 2)
                ->where('products.meta.last_page', 2)
                ->where('products.meta.total', 13)
                ->has('products.data', 1)
            );
    }

    public function test_facet_counts_ignore_the_current_facet_dimension(): void
    {
        $apparel = Category::query()->create(['name' => 'Apparel', 'slug' => 'apparel', 'is_active' => true]);
        $home = Category::query()->create(['name' => 'Home', 'slug' => 'home', 'is_active' => true]);
        $acme = Brand::query()->create(['name' => 'Acme', 'slug' => 'acme', 'is_active' => true]);
        $other = Brand::query()->create(['name' => 'Other', 'slug' => 'other', 'is_active' => true]);

        $this->createProduct(['category_id' => $apparel->id, 'brand_id' => $acme->id, 'price' => 500]);
        $this->createProduct(['category_id' => $apparel->id, 'brand_id' => $other->id, 'price' => 500]);
        $this->createProduct(['category_id' => $home->id, 'brand_id' => $acme->id, 'price' => 500]);

        $this->get('/shop?category=apparel&brand=acme')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('store/catalog')
                ->where('price_bounds.min', 500)
                ->where('price_bounds.max', 500)
                ->has('brands', 2)
                ->where('brands.0.slug', 'acme')
                ->where('brands.0.count', 1)
                ->where('brands.1.slug', 'other')
                ->where('brands.1.count', 1)
                ->has('categories', 2)
                ->where('categories.0.slug', 'apparel')
                ->where('categories.0.count', 1)
                ->where('categories.1.slug', 'home')
                ->where('categories.1.count', 1)
            );
    }
}
