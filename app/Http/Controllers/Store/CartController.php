<?php

namespace App\Http\Controllers\Store;

use App\Exceptions\ShopException;
use App\Http\Controllers\Controller;
use App\Services\CartService;
use App\Services\DiscountService;
use App\Services\StorePolicyService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CartController extends Controller
{
    public function __construct(private CartService $carts) {}

    public function show(Request $request)
    {
        return Inertia::render('store/cart', $this->carts->payload($request));
    }

    public function add(Request $request)
    {
        $data = $request->validate([
            'product_id' => 'required|integer|exists:products,id',
            'variant_id' => 'nullable|integer|exists:product_variants,id',
            'quantity' => 'required|integer|min:1',
        ]);

        try {
            $this->carts->add($request, (int) $data['product_id'], $data['variant_id'] ?? null, (int) $data['quantity']);
        } catch (ShopException $e) {
            return back()->withErrors(['cart' => $e->getMessage()]);
        }

        return back()->with('success', 'Added to cart.');
    }

    public function update(Request $request, int $item)
    {
        $data = $request->validate(['quantity' => 'required|integer|min:0']);
        try {
            $this->carts->updateQty($request, $item, (int) $data['quantity']);
        } catch (ShopException $e) {
            return back()->withErrors(['cart' => $e->getMessage()]);
        }

        return back();
    }

    public function destroy(Request $request, int $item)
    {
        $this->carts->remove($request, $item);

        return back();
    }

    public function coupon(Request $request, DiscountService $discounts)
    {
        $data = $request->validate(['code' => 'required|string|max:30']);
        $cart = $this->carts->current($request);
        $totals = $this->carts->totals($cart, null, null, null, $request->user()?->id, $request->user()?->email);
        $coupon = $discounts->findValid($data['code'], $totals['subtotal'], $request->user()?->id, $request->user()?->email ?? $request->input('email'));
        $cart->coupon_id = $coupon->id;
        $cart->save();

        return back()->with('success', 'Promo code applied.');
    }

    public function removeCoupon(Request $request)
    {
        $cart = $this->carts->current($request);
        $cart->coupon_id = null;
        $cart->save();

        return back();
    }

    public function deliverable(Request $request, StorePolicyService $policy)
    {
        $data = $request->validate([
            'country_code' => 'nullable|string|size:2',
            'province' => 'nullable|string',
            'city' => 'required|string',
            'postal_code' => 'nullable|string',
        ]);

        try {
            $area = $policy->assertDeliverable(
                $data['province'] ?? '',
                $data['city'],
                $data['postal_code'] ?? null,
                $data['country_code'] ?? null,
            );

            return back()->with('success', 'We ship to '.$area->displayName().'.');
        } catch (ShopException $e) {
            return back()->withErrors(['area' => $e->getMessage()]);
        }
    }
}
