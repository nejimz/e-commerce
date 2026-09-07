<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AuthorizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_cannot_open_admin(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->get('/admin')->assertForbidden();
    }

    public function test_staff_cannot_open_settings_or_promos(): void
    {
        $staff = User::factory()->staff()->create();

        $this->actingAs($staff)->get('/admin')->assertOk();
        $this->actingAs($staff)->get('/admin/settings')->assertForbidden();
        $this->actingAs($staff)->get('/admin/coupons')->assertForbidden();
    }

    public function test_admin_can_open_settings(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)->get('/admin/settings')->assertInertia(fn (Assert $page) => $page->component('admin/settings'));
        $this->actingAs($admin)->get('/admin/orders')->assertInertia(fn (Assert $page) => $page->component('admin/orders/index')->has('orders.data'));
        $this->actingAs($admin)->get('/admin/products')->assertInertia(fn (Assert $page) => $page->component('admin/products/index')->has('products.data')->has('filters'));
        $this->actingAs($admin)->get('/admin/customers')->assertInertia(fn (Assert $page) => $page->component('admin/customers/index')->has('customers.data')->has('filters'));
        $this->actingAs($admin)->get('/admin/coupons')->assertInertia(fn (Assert $page) => $page->component('admin/coupons/index'));
        $this->actingAs($admin)->get('/admin/areas')->assertInertia(fn (Assert $page) => $page->component('admin/areas/index'));
        $this->actingAs($admin)->get('/admin')->assertInertia(fn (Assert $page) => $page->component('admin/dashboard')->has('stats'));
    }

    public function test_staff_can_open_ops_pages(): void
    {
        $staff = User::factory()->staff()->create();

        $this->actingAs($staff)->get('/admin')->assertOk();
        $this->actingAs($staff)->get('/admin/orders')->assertOk();
        $this->actingAs($staff)->get('/admin/products')->assertOk();
        $this->actingAs($staff)->get('/admin/customers')->assertOk();
        $this->actingAs($staff)->get('/admin/areas')->assertForbidden();
    }
}
