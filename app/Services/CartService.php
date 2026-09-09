<?php

namespace App\Services;

use App\Exceptions\ShopException;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Setting;
use App\Models\User;
use App\Support\Money;
use Illuminate\Http\Request;

class CartService
{
    public function __construct(
        private StorePolicyService $policy,
        private DiscountService $discounts,
        private ShippingService $shipping,
    ) {}

    public function current(Request $request): Cart
    {
        $user = $request->user();
        if ($user) {
            $cart = Cart::query()->firstOrCreate(
                ['user_id' => $user->id],
                ['expires_at' => now()->addDays(30)],
            );
        } else {
            $cart = $this->guestCart($request);
        }

        return $cart->load(['items.product.images', 'items.variant.optionValues', 'coupon']);
    }

    private function guestCart(Request $request): Cart
    {
        $cartId = $request->session()->get('cart_id');
        if ($cartId) {
            $cart = Cart::query()->whereKey($cartId)->whereNull('user_id')->first();
            if ($cart) {
                if ($cart->session_id !== $request->session()->getId()) {
                    $cart->session_id = $request->session()->getId();
                    $cart->save();
                }

                return $cart;
            }
        }

        $sid = $request->session()->getId();
        $cart = Cart::query()->firstOrCreate(
            ['session_id' => $sid, 'user_id' => null],
            ['expires_at' => now()->addDays(30)],
        );
        $request->session()->put('cart_id', $cart->id);

        return $cart;
    }

    public function mergeGuestCart(Request $request, User $user): void
    {
        $sid = $request->session()->getId();
        $guest = Cart::query()->whereNull('user_id')
            ->where(function ($q) use ($request, $sid) {
                $q->where('session_id', $sid);
                if ($request->session()->get('cart_id')) {
                    $q->orWhere('id', $request->session()->get('cart_id'));
                }
            })
            ->first();
        if (! $guest) {
            return;
        }

        $customer = Cart::query()->firstOrCreate(['user_id' => $user->id], ['expires_at' => now()->addDays(30)]);

        foreach ($guest->items as $item) {
            $existing = $customer->items()
                ->where('product_id', $item->product_id)
                ->where('variant_id', $item->variant_id)
                ->first();
            if ($existing) {
                $existing->quantity += $item->quantity;
                $existing->save();
            } else {
                $customer->items()->create($item->only(['product_id', 'variant_id', 'quantity', 'unit_price_snapshot']));
            }
        }

        if ($guest->coupon_id && ! $customer->coupon_id) {
            $customer->coupon_id = $guest->coupon_id;
            $customer->save();
        }

        $guest->items()->delete();
        $guest->delete();
    }

    public function add(Request $request, int $productId, ?int $variantId, int $quantity): Cart
    {
        $this->policy->assertStoreOpen();
        $product = Product::query()->with('variants')->findOrFail($productId);

        if (! $product->is_active) {
            throw ShopException::inactiveProduct($product->name);
        }

        if ($product->has_variants && ! $variantId) {
            throw ShopException::inactiveProduct('Please choose a variant before adding to cart.');
        }

        $variant = $variantId ? ProductVariant::query()->where('product_id', $product->id)->findOrFail($variantId) : null;
        $price = $variant ? (float) $variant->price() : (float) $product->price;
        $stock = $variant ? (int) $variant->stock_quantity : (int) $product->stock_quantity;

        if ($quantity < 1) {
            $quantity = 1;
        }
        if ($quantity > $stock && ! $product->allow_backorder) {
            throw ShopException::insufficientStock($product->name, $stock);
        }

        $cart = $this->current($request);
        $line = $cart->items()
            ->where('product_id', $product->id)
            ->where('variant_id', $variantId)
            ->first();

        if ($line) {
            $newQty = $line->quantity + $quantity;
            if ($newQty > $stock && ! $product->allow_backorder) {
                throw ShopException::insufficientStock($product->name, $stock);
            }
            $line->quantity = $newQty;
            $line->unit_price_snapshot = $price;
            $line->save();
        } else {
            $cart->items()->create([
                'product_id' => $product->id,
                'variant_id' => $variantId,
                'quantity' => $quantity,
                'unit_price_snapshot' => $price,
            ]);
        }

        return $this->current($request);
    }

    public function updateQty(Request $request, int $itemId, int $quantity): Cart
    {
        $cart = $this->current($request);
        $item = $cart->items()->whereKey($itemId)->firstOrFail();

        if ($quantity < 1) {
            $item->delete();

            return $this->current($request);
        }

        $stock = $item->variant_id
            ? (int) $item->variant->stock_quantity
            : (int) $item->product->stock_quantity;

        if ($quantity > $stock && ! $item->product->allow_backorder) {
            throw ShopException::insufficientStock($item->product->name, $stock);
        }

        $item->quantity = $quantity;
        $item->unit_price_snapshot = $item->variant ? (float) $item->variant->price() : (float) $item->product->price;
        $item->save();

        return $this->current($request);
    }

    public function remove(Request $request, int $itemId): Cart
    {
        $cart = $this->current($request);
        $cart->items()->whereKey($itemId)->delete();

        return $this->current($request);
    }

    public function clear(Request $request): Cart
    {
        $cart = $this->current($request);
        $cart->items()->delete();
        $cart->coupon_id = null;
        $cart->save();

        return $this->current($request);
    }

    public function totals(Cart $cart, ?string $province = null, ?string $city = null, ?string $postal = null, ?int $userId = null, ?string $email = null, ?string $country = null): array
    {
        $cart->loadMissing(['items.product', 'items.variant', 'coupon']);
        $subtotal = 0.0;
        foreach ($cart->items as $item) {
            $price = $item->variant ? (float) $item->variant->price() : (float) $item->product->price;
            $item->unit_price_snapshot = $price;
            $item->save();
            $subtotal += $price * $item->quantity;
        }
        $subtotal = round($subtotal, 2);

        $area = null;
        if ($city || $country) {
            $area = $this->policy->resolveArea((string) $province, (string) $city, $postal, $country);
        }
        $quote = $this->shipping->quote($area, $subtotal);
        $delivery = $quote['delivery_fee'];
        $packing = $quote['packing_fee'];
        $discount = 0.0;

        if ($cart->coupon) {
            try {
                $coupon = $this->discounts->findValid($cart->coupon->code, $subtotal, $userId, $email);
                $applied = $this->discounts->discountAmount($coupon, $subtotal, $delivery, (bool) $quote['free_shipping_eligible']);
                $discount = $applied['discount'];
                $delivery = $applied['delivery_fee'];
            } catch (\Throwable) {
                $cart->coupon_id = null;
                $cart->save();
            }
        }

        $total = round(max(0, $subtotal - $discount + $delivery + $packing), 2);
        $vatEnabled = (bool) Setting::get('vat_enabled', true);
        $vat = $vatEnabled ? Money::vatComponent($total, (float) Setting::get('vat_rate', 12)) : 0;

        return [
            'subtotal' => $subtotal,
            'discount' => $discount,
            'delivery_fee' => $delivery,
            'packing_fee' => $packing,
            'vat_amount' => $vat,
            'total' => $total,
            'item_count' => $cart->items->sum('quantity'),
            'coupon_code' => $cart->coupon?->code,
            'same_day' => $quote['same_day'],
            'free_delivery_threshold' => $quote['free_delivery_threshold'],
        ];
    }

    public function payload(Request $request, ?string $province = null, ?string $city = null, ?string $postal = null, ?string $country = null): array
    {
        $cart = $this->current($request);
        $totals = $this->totals($cart, $province, $city, $postal, $request->user()?->id, $request->user()?->email, $country);

        return [
            'cart' => [
                'id' => $cart->id,
                'items' => $cart->items->map(fn (CartItem $item) => [
                    'id' => $item->id,
                    'product_id' => $item->product_id,
                    'variant_id' => $item->variant_id,
                    'name' => $item->product->name,
                    'slug' => $item->product->slug,
                    'sku' => $item->variant?->sku ?? $item->product->sku,
                    'options' => $item->variant?->optionLabel(),
                    'quantity' => $item->quantity,
                    'unit_price' => (float) $item->unit_price_snapshot,
                    'line_total' => $item->lineTotal(),
                    'image' => $item->product->primaryImage()?->url(),
                    'stock' => $item->variant?->stock_quantity ?? $item->product->stock_quantity,
                ]),
                'totals' => $totals,
            ],
        ];
    }
}
