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
            ->assertRedirect('/shop/apparel?brand=acme&max_price=1000');

        $this->get('/shop/apparel?brand=acme&max_price=1000')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('store/catalog')
                ->where('listing', 'category')
                ->where('filters.category', 'apparel')
                ->where('filters.brand', 'acme')
                ->where('filters.max_price', '1000')
                ->where('seo.robots', 'noindex,follow')
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

        $this->get('/shop?brand=acme')->assertRedirect('/brands/acme');

        $first = $this->get('/brands/acme')->assertOk();
        $second = $this->get('/brands/acme')->assertOk();

        $first->assertInertia(fn (Assert $page) => $page
            ->component('store/catalog')
            ->where('listing', 'brand')
            ->where('filters.brand', 'acme')
            ->where('seo.robots', 'index,follow')
            ->has('products.data', 1)
            ->where('products.data.0.name', 'Acme Lamp')
        );
        $second->assertInertia(fn (Assert $page) => $page
            ->component('store/catalog')
            ->where('listing', 'brand')
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
                ->where('seo.robots', 'noindex,follow')
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
            ->assertRedirect('/brands/acme?page=2');

        $this->get('/brands/acme?page=2')
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

        $this->get('/shop/apparel?brand=acme')
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

    public function test_category_path_is_indexable_and_uses_category_seo(): void
    {
        $apparel = Category::query()->create([
            'name' => 'Apparel',
            'slug' => 'apparel',
            'description' => 'Shirts and everyday layers.',
            'meta_title' => 'Shop Apparel',
            'meta_description' => 'Browse apparel with prices in PHP.',
            'is_active' => true,
        ]);
        $this->createProduct(['name' => 'Oxford Shirt', 'category_id' => $apparel->id]);

        $this->get('/shop/apparel')
            ->assertOk()
            ->assertSee('rel="canonical"', false)
            ->assertSee(url('/shop/apparel'), false)
            ->assertSee('name="robots"', false)
            ->assertSee('index,follow', false)
            ->assertSee('CollectionPage', false)
            ->assertInertia(fn (Assert $page) => $page
                ->component('store/catalog')
                ->where('listing', 'category')
                ->where('category.slug', 'apparel')
                ->where('seo.title', 'Shop Apparel')
                ->where('seo.description', 'Browse apparel with prices in PHP.')
                ->where('seo.robots', 'index,follow')
                ->where('seo.canonical', url('/shop/apparel'))
                ->where('seo.jsonLd.@type', 'CollectionPage')
                ->has('products.data', 1)
            );
    }

    public function test_child_category_canonicalizes_to_nested_path(): void
    {
        $apparel = Category::query()->create(['name' => 'Apparel', 'slug' => 'apparel', 'is_active' => true]);
        $shirts = Category::query()->create([
            'name' => 'Shirts',
            'slug' => 'shirts',
            'parent_id' => $apparel->id,
            'is_active' => true,
        ]);
        $this->createProduct(['name' => 'Oxford Shirt', 'category_id' => $shirts->id]);

        $this->get('/shop/shirts')->assertRedirect('/shop/apparel/shirts');

        $this->get('/shop/apparel/shirts')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('store/catalog')
                ->where('listing', 'category')
                ->where('category.slug', 'shirts')
                ->where('category.parent.slug', 'apparel')
                ->where('seo.canonical', url('/shop/apparel/shirts'))
                ->has('products.data', 1)
            );
    }

    public function test_inactive_category_and_brand_return_404(): void
    {
        Category::query()->create(['name' => 'Hidden', 'slug' => 'hidden', 'is_active' => false]);
        Brand::query()->create(['name' => 'Ghost', 'slug' => 'ghost', 'is_active' => false]);

        $this->get('/shop/hidden')->assertNotFound();
        $this->get('/brands/ghost')->assertNotFound();
        $this->get('/shop?category=hidden')->assertNotFound();
        $this->get('/shop?brand=ghost')->assertNotFound();
    }

    public function test_brand_page_reuses_catalog_filters(): void
    {
        $apparel = Category::query()->create(['name' => 'Apparel', 'slug' => 'apparel', 'is_active' => true]);
        $home = Category::query()->create(['name' => 'Home', 'slug' => 'home', 'is_active' => true]);
        $acme = Brand::query()->create([
            'name' => 'Acme',
            'slug' => 'acme',
            'description' => 'House brand.',
            'is_active' => true,
        ]);
        $this->createProduct(['name' => 'Acme Shirt', 'category_id' => $apparel->id, 'brand_id' => $acme->id]);
        $this->createProduct(['name' => 'Acme Lamp', 'category_id' => $home->id, 'brand_id' => $acme->id]);

        $this->get('/brands/acme')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('store/catalog')
                ->where('listing', 'brand')
                ->where('brand.slug', 'acme')
                ->where('seo.robots', 'index,follow')
                ->has('products.data', 2)
                ->has('categories', 2)
            );

        $this->get('/brands/acme?category=apparel')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('store/catalog')
                ->where('listing', 'brand')
                ->where('filters.category', 'apparel')
                ->where('seo.robots', 'noindex,follow')
                ->has('products.data', 1)
                ->where('products.data.0.name', 'Acme Shirt')
            );
    }

    public function test_sitemap_lists_category_brand_and_product_urls(): void
    {
        $apparel = Category::query()->create(['name' => 'Apparel', 'slug' => 'apparel', 'is_active' => true]);
        $acme = Brand::query()->create(['name' => 'Acme', 'slug' => 'acme', 'is_active' => true]);
        $product = $this->createProduct([
            'name' => 'Oxford Shirt',
            'slug' => 'oxford-shirt',
            'category_id' => $apparel->id,
            'brand_id' => $acme->id,
        ]);

        $this->get('/sitemap.xml')
            ->assertOk()
            ->assertHeader('Content-Type', 'application/xml; charset=UTF-8')
            ->assertSee(url('/shop/apparel'), false)
            ->assertSee(url('/brands/acme'), false)
            ->assertSee(url('/products/'.$product->slug), false)
            ->assertDontSee('/shop?category=', false);
    }

    public function test_non_production_robots_disallows_indexing(): void
    {
        $this->get('/robots.txt')
            ->assertOk()
            ->assertSee('Disallow: /')
            ->assertDontSee('Sitemap:');
    }
}
