<?php

namespace App\Http\Controllers\Store;

use App\Enums\PaymentMethod;
use App\Exceptions\ShopException;
use App\Http\Controllers\Controller;
use App\Models\Address;
use App\Models\Order;
use App\Models\Setting;
use App\Services\CartService;
use App\Services\OrderService;
use App\Services\PaymentService;
use App\Support\Countries;
use App\Support\ShippingAddress;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class CheckoutController extends Controller
{
    public function __construct(
        private CartService $carts,
        private OrderService $orders,
        private PaymentService $payments,
    ) {}

    public function show(Request $request)
    {
        $province = $request->string('province')->toString() ?: null;
        $city = $request->string('city')->toString() ?: null;
        $postal = $request->string('postal_code')->toString() ?: null;
        $country = $request->string('country_code')->toString() ?: null;
        $payload = $this->carts->payload($request, $province, $city, $postal, $country);
        if (($payload['cart']['totals']['item_count'] ?? 0) < 1) {
            return redirect()->route('cart.show')->with('error', 'Your cart is empty.');
        }

        return Inertia::render('store/checkout', [
            ...$payload,
            'addresses' => $request->user()?->addresses()->get() ?? [],
            'idempotency_key' => (string) Str::uuid(),
            'cod_maximum' => Setting::get('cod_maximum', 0),
            'gateway' => config('shop.gateway'),
        ]);
    }

    public function store(Request $request)
    {
        $request->merge([
            'country_code' => Countries::normalize($request->input('country_code')),
        ]);

        $data = $request->validate(array_merge(ShippingAddress::rules($request->input('country_code')), [
            'name' => 'required|string|min:2|max:100',
            'email' => 'required|email|max:150',
            'phone' => ['required', 'regex:'.ShippingAddress::PHONE],
            'notes' => 'nullable|string|max:500',
            'gift_message' => 'nullable|string|max:200',
            'hide_prices' => 'boolean',
            'payment_method' => 'required|in:cod,paymongo',
            'terms' => 'accepted',
            'idempotency_key' => 'required|string|max:64',
            'save_address' => 'boolean',
        ]));

        try {
            $order = $this->orders->place($data, $request);
        } catch (ShopException $e) {
            return back()->withErrors(['checkout' => $e->getMessage()])->withInput();
        }

        $request->session()->put('guest_order', $order->order_number);

        if ($request->boolean('save_address') && $request->user()) {
            Address::query()->create([
                'user_id' => $request->user()->id,
                'recipient_name' => $data['name'],
                'phone' => $data['phone'],
                'line1' => $data['line1'],
                'line2' => $data['line2'] ?? null,
                'country_code' => $data['country_code'],
                'barangay' => $data['barangay'] ?? null,
                'city' => $data['city'],
                'province' => $data['province'] ?? null,
                'postal_code' => $data['postal_code'],
                'is_default' => $request->user()->addresses()->count() === 0,
            ]);
        }

        if ($order->payment_method === PaymentMethod::Paymongo) {
            $url = $this->payments->checkoutUrl($order);
            if ($url) {
                return Inertia::location($url);
            }
        }

        return redirect()->route('orders.confirmation', $order->order_number);
    }

    public function confirmation(string $orderNumber, Request $request)
    {
        $order = Order::query()->with('items')->where('order_number', $orderNumber)->firstOrFail();
        $this->authorizeView($request, $order);

        return Inertia::render('store/confirmation', ['order' => $order]);
    }

    public function lookup(Request $request)
    {
        $data = $request->validate([
            'order_number' => 'required|string',
            'email' => 'required|email',
        ]);
        $order = Order::query()->where('order_number', $data['order_number'])->where('customer_email', $data['email'])->first();
        if (! $order) {
            return back()->withErrors(['order_number' => 'No order matched that number and email.']);
        }

        $request->session()->put('guest_order', $order->order_number);

        return redirect()->route('orders.confirmation', $order->order_number);
    }

    public function showOrder(Request $request, string $orderNumber)
    {
        $order = Order::query()->with(['items', 'statusLogs'])->where('order_number', $orderNumber)->firstOrFail();
        $this->authorizeView($request, $order);

        return Inertia::render('store/order-show', ['order' => $order]);
    }

    public function reorder(Request $request, string $orderNumber)
    {
        $order = Order::query()->with('items')->where('order_number', $orderNumber)->firstOrFail();
        $this->authorizeView($request, $order);
        $skipped = [];
        foreach ($order->items as $item) {
            if (! $item->product_id) {
                $skipped[] = $item->product_name_snapshot;

                continue;
            }
            try {
                $this->carts->add($request, $item->product_id, $item->variant_id, $item->quantity);
            } catch (ShopException) {
                $skipped[] = $item->product_name_snapshot;
            }
        }

        return redirect()->route('cart.show')->with('success', $skipped ? 'Some items were skipped: '.implode(', ', $skipped) : 'Items added to your cart.');
    }

    private function authorizeView(Request $request, Order $order): void
    {
        $user = $request->user();
        if ($user && $user->isStaff()) {
            return;
        }
        if ($user && $order->user_id === $user->id) {
            return;
        }
        if ($user && $order->user_id && $order->user_id !== $user->id) {
            abort(404);
        }
        if ($request->session()->get('guest_order') === $order->order_number) {
            return;
        }

        abort(404);
    }
}
