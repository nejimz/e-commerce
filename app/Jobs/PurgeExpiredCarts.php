<?php

namespace App\Jobs;

use App\Models\Cart;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class PurgeExpiredCarts implements ShouldQueue
{
    use Queueable;

    public function handle(): void
    {
        Cart::query()->where('expires_at', '<', now())->each(function (Cart $cart) {
            $cart->items()->delete();
            $cart->delete();
        });
    }
}
