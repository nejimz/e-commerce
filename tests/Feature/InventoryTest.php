<?php

namespace Tests\Feature;

use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InventoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_cannot_add_more_than_available_stock(): void
    {
        $product = $this->createProduct(['stock_quantity' => 2]);

        $this->from('/products/'.$product->slug)
            ->post('/cart', ['product_id' => $product->id, 'quantity' => 5])
            ->assertSessionHasErrors('cart');
    }
}
