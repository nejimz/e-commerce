<?php

namespace Tests\Feature;

use App\Enums\OrderStatus;
use App\Models\Coupon;
use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CheckoutTest extends TestCase
{
    use RefreshDatabase;

    public function test_paused_store_blocks_checkout(): void
    {
        $this->allowMakati();
        $product = $this->createProduct();
        $this->putSetting('store_paused', true);

        $this->post('/cart', ['product_id' => $product->id, 'quantity' => 1])
            ->assertStatus(423);
    }

    public function test_undeliverable_area_is_blocked_by_default(): void
    {
        $this->allowMakati();
        $product = $this->createProduct();
        $this->post('/cart', ['product_id' => $product->id, 'quantity' => 1]);

        $this->from('/checkout')->post('/checkout', $this->checkoutPayload([
            'city' => 'Davao City',
            'province' => 'Davao del Sur',
        ]))->assertSessionHasErrors('checkout');
    }

    public function test_cod_order_computes_fees_vat_and_discount(): void
    {
        Mail::fake();
        $this->allowMakati();
        $product = $this->createProduct(['price' => 1000, 'stock_quantity' => 5]);
        Coupon::query()->create([
            'code' => 'WELCOME10',
            'type' => 'percentage',
            'value' => 10,
            'minimum_purchase' => 500,
            'is_active' => true,
        ]);
        $this->putSetting('vat_enabled', true);
        $this->putSetting('vat_rate', 12);
        $this->putSetting('packing_fee', 20);

        $this->post('/cart', ['product_id' => $product->id, 'quantity' => 1])
            ->assertSessionHasNoErrors();
        $this->post('/cart/coupon', ['code' => 'WELCOME10'])
            ->assertSessionHasNoErrors();

        $this->post('/checkout', $this->checkoutPayload())
            ->assertSessionHasNoErrors()
            ->assertRedirect();

        $order = Order::query()->first();
        $this->assertNotNull($order);
        $this->assertEquals(1000, (float) $order->subtotal);
        $this->assertEquals(100, (float) $order->discount_amount);
        $this->assertEquals(80, (float) $order->delivery_fee);
        $this->assertEquals(20, (float) $order->packing_fee);
        $this->assertEquals(1000, (float) $order->total);
        $this->assertEquals(round(1000 * 12 / 112, 2), (float) $order->vat_amount);
        $this->assertEquals(4, $product->fresh()->stock_quantity);
    }

    public function test_unknown_coupon_has_a_distinct_message(): void
    {
        $this->from('/cart')->post('/cart/coupon', ['code' => 'NOPE'])
            ->assertSessionHasErrors(['coupon']);
    }

    public function test_idempotent_checkout_does_not_double_charge(): void
    {
        Mail::fake();
        $this->allowMakati();
        $product = $this->createProduct(['stock_quantity' => 5]);
        $this->post('/cart', ['product_id' => $product->id, 'quantity' => 1]);
        $payload = $this->checkoutPayload(['idempotency_key' => 'same-key-once']);

        $this->post('/checkout', $payload)->assertSessionHasNoErrors()->assertRedirect();
        $this->post('/cart', ['product_id' => $product->id, 'quantity' => 1]);
        $this->post('/checkout', $payload)->assertRedirect();

        $this->assertEquals(1, Order::query()->count());
        $this->assertEquals(4, $product->fresh()->stock_quantity);
    }

    public function test_last_unit_second_checkout_rolls_back(): void
    {
        Mail::fake();
        $this->allowMakati();
        $product = $this->createProduct(['stock_quantity' => 1]);

        $alice = User::factory()->create(['email' => 'alice@example.com']);
        $bob = User::factory()->create(['email' => 'bob@example.com']);

        $this->actingAs($alice)->post('/cart', ['product_id' => $product->id, 'quantity' => 1]);
        $this->actingAs($bob)->post('/cart', ['product_id' => $product->id, 'quantity' => 1]);

        $this->actingAs($alice)->post('/checkout', $this->checkoutPayload(['email' => $alice->email]))
            ->assertRedirect();

        $this->actingAs($bob)->from('/checkout')->post('/checkout', $this->checkoutPayload([
            'email' => $bob->email,
            'idempotency_key' => 'bob-key',
        ]))->assertSessionHasErrors('checkout');

        $this->assertEquals(1, Order::query()->count());
        $this->assertEquals(0, $product->fresh()->stock_quantity);
        $this->assertEquals(OrderStatus::Pending, Order::query()->first()->order_status);
    }

    public function test_guest_cannot_view_another_customers_order(): void
    {
        Mail::fake();
        $this->allowMakati();
        $product = $this->createProduct();
        $owner = User::factory()->create();
        $this->actingAs($owner)->post('/cart', ['product_id' => $product->id, 'quantity' => 1]);
        $this->actingAs($owner)->post('/checkout', $this->checkoutPayload(['email' => $owner->email]));
        $order = Order::query()->first();

        $stranger = User::factory()->create();
        $this->actingAs($stranger)->get('/orders/'.$order->order_number)->assertNotFound();
    }

    public function test_shared_cart_includes_items_after_add(): void
    {
        $this->allowMakati();
        $product = $this->createProduct();

        $this->post('/cart', ['product_id' => $product->id, 'quantity' => 2])
            ->assertSessionHas('success', 'Added to cart.');

        $this->get('/shop')->assertInertia(fn (Assert $page) => $page
            ->has('cart.items', 1)
            ->where('cartCount', 2)
            ->where('cart.items.0.quantity', 2)
        );
    }

    public function test_checkout_accepts_optional_delivery_and_gift_fields(): void
    {
        Mail::fake();
        $this->allowMakati();
        $product = $this->createProduct();
        $this->post('/cart', ['product_id' => $product->id, 'quantity' => 1]);

        $this->post('/checkout', $this->checkoutPayload([
            'line2' => 'Unit 5A',
            'barangay' => 'Poblacion',
            'notes' => 'Leave at lobby',
            'gift_message' => 'Happy birthday',
            'hide_prices' => true,
        ]))->assertSessionHasNoErrors()->assertRedirect();

        $order = Order::query()->first();
        $this->assertNotNull($order);
        $this->assertEquals('Unit 5A', $order->shipping_line2);
        $this->assertEquals('Poblacion', $order->shipping_barangay);
        $this->assertEquals('Leave at lobby', $order->customer_note);
        $this->assertEquals('Happy birthday', $order->gift_message);
        $this->assertTrue((bool) $order->hide_prices);
    }

    public function test_checkout_recalculates_fees_for_address(): void
    {
        $this->allowMakati();
        $product = $this->createProduct(['price' => 1000]);
        $this->post('/cart', ['product_id' => $product->id, 'quantity' => 1]);

        $this->get('/checkout?province=Metro+Manila&city=Makati')->assertInertia(fn (Assert $page) => $page
            ->component('store/checkout')
            ->where('cart.totals.delivery_fee', 80)
        );
    }

    public function test_international_country_quote_and_cod_are_blocked(): void
    {
        $this->allowMakati();
        $this->allowCountry('US', 950);
        $product = $this->createProduct(['price' => 1000]);
        $this->post('/cart', ['product_id' => $product->id, 'quantity' => 1]);

        $this->get('/checkout?country_code=US&city=New+York&province=NY')->assertInertia(fn (Assert $page) => $page
            ->component('store/checkout')
            ->where('cart.totals.delivery_fee', 950)
        );

        $this->from('/checkout')->post('/checkout', $this->checkoutPayload([
            'country_code' => 'US',
            'city' => 'New York',
            'province' => 'NY',
            'postal_code' => '10001',
            'payment_method' => 'cod',
        ]))->assertSessionHasErrors('checkout');
    }

    public function test_free_shipping_threshold_does_not_zero_international_fee(): void
    {
        $this->allowCountry('SG', 450);
        $this->putSetting('free_delivery_enabled', true);
        $this->putSetting('free_delivery_threshold', 500);
        $product = $this->createProduct(['price' => 1000]);
        $this->post('/cart', ['product_id' => $product->id, 'quantity' => 1]);

        $this->get('/checkout?country_code=SG&city=Singapore')->assertInertia(fn (Assert $page) => $page
            ->component('store/checkout')
            ->where('cart.totals.delivery_fee', 450)
        );
    }

    public function test_unlisted_country_is_blocked(): void
    {
        $this->allowMakati();
        $product = $this->createProduct();
        $this->post('/cart', ['product_id' => $product->id, 'quantity' => 1]);

        $this->from('/checkout')->post('/checkout', $this->checkoutPayload([
            'country_code' => 'FR',
            'city' => 'Paris',
            'province' => 'Île-de-France',
            'postal_code' => '75001',
            'payment_method' => 'paymongo',
        ]))->assertSessionHasErrors('checkout');
    }
}
