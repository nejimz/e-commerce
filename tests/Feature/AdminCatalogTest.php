<?php

namespace Tests\Feature;

use App\Models\Brand;
use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminCatalogTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_top_level_and_child_category(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)->post('/admin/categories', [
            'name' => 'Apparel',
            'is_active' => true,
        ])->assertRedirect();

        $apparel = Category::query()->where('slug', 'apparel')->first();
        $this->assertNotNull($apparel);
        $this->assertNull($apparel->parent_id);
        $this->assertTrue($apparel->is_active);

        $this->actingAs($admin)->post('/admin/categories', [
            'name' => 'Shirts',
            'parent_id' => $apparel->id,
            'is_active' => true,
        ])->assertRedirect();

        $shirts = Category::query()->where('slug', 'shirts')->first();
        $this->assertNotNull($shirts);
        $this->assertSame($apparel->id, $shirts->parent_id);
    }

    public function test_staff_cannot_manage_categories(): void
    {
        $staff = User::factory()->staff()->create();

        $this->actingAs($staff)->get('/admin/categories')->assertForbidden();
        $this->actingAs($staff)->post('/admin/categories', ['name' => 'Apparel'])->assertForbidden();
    }

    public function test_third_level_parent_is_rejected(): void
    {
        $admin = User::factory()->admin()->create();
        $apparel = Category::query()->create(['name' => 'Apparel', 'slug' => 'apparel', 'is_active' => true]);
        $shirts = Category::query()->create([
            'name' => 'Shirts',
            'slug' => 'shirts',
            'parent_id' => $apparel->id,
            'is_active' => true,
        ]);

        $this->actingAs($admin)->post('/admin/categories', [
            'name' => 'Oxford',
            'parent_id' => $shirts->id,
            'is_active' => true,
        ])->assertSessionHasErrors('parent_id');

        $this->assertDatabaseMissing('categories', ['name' => 'Oxford']);
    }

    public function test_delete_is_refused_when_category_has_products(): void
    {
        $admin = User::factory()->admin()->create();
        $apparel = Category::query()->create(['name' => 'Apparel', 'slug' => 'apparel', 'is_active' => true]);
        $this->createProduct(['category_id' => $apparel->id]);

        $this->actingAs($admin)
            ->from('/admin/categories')
            ->delete('/admin/categories/'.$apparel->id)
            ->assertRedirect('/admin/categories')
            ->assertSessionHas('error');

        $this->assertFalse($apparel->fresh()->trashed());
    }

    public function test_deactivating_a_category_hides_it_on_the_storefront(): void
    {
        $admin = User::factory()->admin()->create();
        $apparel = Category::query()->create(['name' => 'Apparel', 'slug' => 'apparel', 'is_active' => true]);

        $this->get('/shop/apparel')->assertOk();

        $this->actingAs($admin)->patch('/admin/categories/'.$apparel->id, [
            'name' => 'Apparel',
            'is_active' => false,
        ])->assertRedirect();

        $this->assertFalse($apparel->fresh()->is_active);
        $this->get('/shop/apparel')->assertNotFound();
    }

    public function test_move_up_swaps_sibling_order(): void
    {
        $admin = User::factory()->admin()->create();
        $first = Category::query()->create(['name' => 'Apparel', 'slug' => 'apparel', 'sort_order' => 1, 'is_active' => true]);
        $second = Category::query()->create(['name' => 'Home', 'slug' => 'home', 'sort_order' => 2, 'is_active' => true]);

        $this->actingAs($admin)
            ->from('/admin/categories')
            ->patch('/admin/categories/'.$second->id.'/move', ['direction' => 'up'])
            ->assertRedirect('/admin/categories');

        $this->assertSame(1, $second->fresh()->sort_order);
        $this->assertSame(2, $first->fresh()->sort_order);
    }

    public function test_product_create_lists_nested_category_labels(): void
    {
        $admin = User::factory()->admin()->create();
        $apparel = Category::query()->create(['name' => 'Apparel', 'slug' => 'apparel', 'sort_order' => 1, 'is_active' => true]);
        Category::query()->create([
            'name' => 'Shirts',
            'slug' => 'shirts',
            'parent_id' => $apparel->id,
            'sort_order' => 1,
            'is_active' => true,
        ]);

        $this->actingAs($admin)
            ->get('/admin/products/create')
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/products/form')
                ->has('categories', 2)
                ->where('categories.0.name', 'Apparel')
                ->where('categories.0.parent_name', null)
                ->where('categories.1.name', 'Shirts')
                ->where('categories.1.parent_name', 'Apparel')
            );
    }

    public function test_admin_can_create_and_update_brand(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)->post('/admin/brands', [
            'name' => 'Acme',
            'description' => 'House brand.',
            'is_active' => true,
        ])->assertRedirect();

        $brand = Brand::query()->where('slug', 'acme')->first();
        $this->assertNotNull($brand);
        $this->assertSame('House brand.', $brand->description);
        $this->assertTrue($brand->is_active);

        $this->actingAs($admin)->patch('/admin/brands/'.$brand->id, [
            'name' => 'Acme Co',
            'description' => 'Updated.',
            'is_active' => true,
            'meta_title' => 'Acme products',
        ])->assertRedirect();

        $this->assertSame('Acme Co', $brand->fresh()->name);
        $this->assertSame('Acme products', $brand->fresh()->meta_title);
    }

    public function test_staff_cannot_manage_brands(): void
    {
        $staff = User::factory()->staff()->create();

        $this->actingAs($staff)->get('/admin/brands')->assertForbidden();
        $this->actingAs($staff)->post('/admin/brands', ['name' => 'Acme'])->assertForbidden();
    }

    public function test_delete_is_refused_when_brand_has_products(): void
    {
        $admin = User::factory()->admin()->create();
        $brand = Brand::query()->create(['name' => 'Acme', 'slug' => 'acme', 'is_active' => true]);
        $this->createProduct(['brand_id' => $brand->id]);

        $this->actingAs($admin)
            ->from('/admin/brands')
            ->delete('/admin/brands/'.$brand->id)
            ->assertRedirect('/admin/brands')
            ->assertSessionHas('error');

        $this->assertFalse($brand->fresh()->trashed());
    }

    public function test_deactivating_a_brand_hides_it_on_the_storefront(): void
    {
        $admin = User::factory()->admin()->create();
        $brand = Brand::query()->create(['name' => 'Acme', 'slug' => 'acme', 'is_active' => true]);

        $this->get('/brands/acme')->assertOk();

        $this->actingAs($admin)->patch('/admin/brands/'.$brand->id, [
            'name' => 'Acme',
            'is_active' => false,
        ])->assertRedirect();

        $this->assertFalse($brand->fresh()->is_active);
        $this->get('/brands/acme')->assertNotFound();
    }

    public function test_product_create_lists_active_brands_only(): void
    {
        $admin = User::factory()->admin()->create();
        Brand::query()->create(['name' => 'Acme', 'slug' => 'acme', 'is_active' => true]);
        Brand::query()->create(['name' => 'Ghost', 'slug' => 'ghost', 'is_active' => false]);

        $this->actingAs($admin)
            ->get('/admin/products/create')
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/products/form')
                ->has('brands', 1)
                ->where('brands.0.name', 'Acme')
                ->where('brands.0.is_active', true)
            );
    }

    public function test_product_edit_keeps_inactive_assigned_brand(): void
    {
        $admin = User::factory()->admin()->create();
        $brand = Brand::query()->create(['name' => 'Ghost', 'slug' => 'ghost', 'is_active' => false]);
        $product = $this->createProduct(['brand_id' => $brand->id]);

        $this->actingAs($admin)
            ->get('/admin/products/'.$product->id.'/edit')
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/products/form')
                ->has('brands', 1)
                ->where('brands.0.id', $brand->id)
                ->where('brands.0.is_active', false)
            );
    }
}
