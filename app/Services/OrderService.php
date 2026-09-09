<?php

namespace App\Services;

use App\Enums\OrderStatus;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Exceptions\ShopException;
use App\Enums\UserRole;
use App\Mail\OrderStatusMail;
use App\Models\CouponUsage;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Setting;
use App\Models\User;
use App\Support\Countries;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class OrderService
{
    public function __construct(
        private StorePolicyService $policy,
        private DiscountService $discounts,
        private ShippingService $shipping,
        private InventoryService $inventory,
        private PaymentService $payments,
        private CartService $carts,
    ) {}

    public function place(array $data, $request): Order
    {
        $this->policy->assertStoreOpen();

        if (empty($data['terms'])) {
            throw ShopException::termsRequired();
        }

        $cart = $this->carts->current($request);
        if ($cart->items->isEmpty()) {
            throw ShopException::storePaused('Your cart is empty.');
        }

        $country = Countries::normalize($data['country_code'] ?? null);
        $province = (string) ($data['province'] ?? '');
        $city = (string) ($data['city'] ?? '');
        $area = $this->policy->assertDeliverable($province, $city, $data['postal_code'] ?? null, $country);

        return DB::transaction(function () use ($data, $request, $cart, $area, $country, $province, $city) {
            if (! empty($data['idempotency_key'])) {
                $existing = Order::query()->where('idempotency_key', $data['idempotency_key'])->first();
                if ($existing) {
                    return $existing;
                }
            }

            foreach ($cart->items as $item) {
                $product = Product::query()->whereKey($item->product_id)->lockForUpdate()->first();
                if (! $product || ! $product->is_active) {
                    throw ShopException::inactiveProduct($item->product->name ?? 'item');
                }
                $variant = $item->variant_id
                    ? ProductVariant::query()->whereKey($item->variant_id)->lockForUpdate()->first()
                    : null;
                $livePrice = $variant ? (float) $variant->price() : (float) $product->price;
                $item->unit_price_snapshot = $livePrice;
                $item->save();
            }

            $totals = $this->carts->totals(
                $cart->fresh(['items.product', 'items.variant', 'coupon']),
                $province,
                $city,
                $data['postal_code'] ?? null,
                $request->user()?->id,
                $data['email'],
                $country,
            );

            $codMax = (float) Setting::get('cod_maximum', 0);
            $method = PaymentMethod::from($data['payment_method']);
            $domestic = Countries::isDomestic($country);
            if ($method === PaymentMethod::Cod && ! $domestic) {
                throw ShopException::storePaused('Cash on Delivery is only available for Philippines addresses. Please pay online.');
            }
            if ($method === PaymentMethod::Cod && $codMax > 0 && $totals['total'] > $codMax) {
                throw ShopException::storePaused('Cash on Delivery is not available above PHP '.number_format($codMax, 2).'.');
            }

            $gatewayEnabled = config('shop.gateway') === 'paymongo';
            if ($method === PaymentMethod::Paymongo && ! $gatewayEnabled) {
                throw ShopException::storePaused(
                    $domestic
                        ? 'Online payment is not available right now. Please choose Cash on Delivery.'
                        : 'Online payment is required for international orders, but it is not available right now.'
                );
            }

            $order = Order::query()->create([
                'order_number' => $this->nextNumber(),
                'user_id' => $request->user()?->id,
                'guest_email' => $request->user() ? null : $data['email'],
                'customer_name' => $data['name'],
                'customer_email' => $data['email'],
                'customer_phone' => $data['phone'],
                'subtotal' => $totals['subtotal'],
                'discount_amount' => $totals['discount'],
                'coupon_code' => $totals['coupon_code'],
                'delivery_fee' => $totals['delivery_fee'],
                'packing_fee' => $totals['packing_fee'],
                'vat_amount' => $totals['vat_amount'],
                'total' => $totals['total'],
                'payment_method' => $method,
                'payment_status' => $method === PaymentMethod::Cod ? PaymentStatus::Unpaid : PaymentStatus::Pending,
                'order_status' => OrderStatus::Pending,
                'shipping_recipient' => $data['name'],
                'shipping_phone' => $data['phone'],
                'shipping_line1' => $data['line1'],
                'shipping_line2' => $data['line2'] ?? null,
                'shipping_country_code' => $country,
                'shipping_barangay' => $data['barangay'] ?? null,
                'shipping_city' => $city,
                'shipping_province' => $province !== '' ? $province : null,
                'shipping_postal_code' => $data['postal_code'],
                'delivery_area_id' => $area->id,
                'customer_note' => $data['notes'] ?? null,
                'gift_message' => $data['gift_message'] ?? null,
                'hide_prices' => (bool) ($data['hide_prices'] ?? false),
                'terms_accepted_at' => now(),
                'idempotency_key' => $data['idempotency_key'] ?? (string) Str::uuid(),
                'placed_at' => now(),
            ]);

            foreach ($cart->items as $item) {
                $product = $item->product;
                $variant = $item->variant;
                $this->inventory->lockAndDeduct(
                    $product,
                    $variant,
                    $item->quantity,
                    $request->user()?->id,
                    'order',
                    Order::class,
                    $order->id,
                );

                $order->items()->create([
                    'product_id' => $product->id,
                    'variant_id' => $variant?->id,
                    'product_name_snapshot' => $product->name,
                    'sku_snapshot' => $variant?->sku ?? $product->sku,
                    'options_snapshot' => $variant?->optionLabel(),
                    'unit_price' => $item->unit_price_snapshot,
                    'quantity' => $item->quantity,
                    'line_total' => round((float) $item->unit_price_snapshot * $item->quantity, 2),
                ]);
            }

            $order->statusLogs()->create([
                'user_id' => $request->user()?->id,
                'from_status' => null,
                'to_status' => OrderStatus::Pending->value,
                'note' => 'Order placed',
                'created_at' => now(),
            ]);

            if ($cart->coupon) {
                CouponUsage::query()->create([
                    'coupon_id' => $cart->coupon->id,
                    'order_id' => $order->id,
                    'user_id' => $request->user()?->id,
                    'email' => $data['email'],
                ]);
                $cart->coupon->increment('used_count');
            }

            $this->payments->initiate($order);

            $cart->items()->delete();
            $cart->coupon_id = null;
            $cart->save();

            $fresh = $order->fresh(['items']);

            DB::afterCommit(function () use ($fresh) {
                Mail::to($fresh->customer_email)->queue(new OrderStatusMail($fresh, 'placed'));
                $adminEmail = User::query()->where('role', UserRole::Admin)->value('email');
                if ($adminEmail) {
                    Mail::to($adminEmail)->queue(new OrderStatusMail($fresh, 'placed_admin'));
                }
            });

            return $fresh;
        });
    }

    public function transition(Order $order, OrderStatus $to, ?int $userId, ?string $note = null): Order
    {
        $from = $order->order_status;
        if (! in_array($to, $from->allowedTransitions(), true)) {
            throw ShopException::storePaused("Cannot change status from {$from->label()} to {$to->label()}.");
        }

        return DB::transaction(function () use ($order, $from, $to, $userId, $note) {
            $order->loadMissing('items');
            $order->order_status = $to;
            if ($to === OrderStatus::Cancelled && $note) {
                $order->admin_note = trim(($order->admin_note ? $order->admin_note."\n" : '').$note);
            }
            $order->save();

            $order->statusLogs()->create([
                'user_id' => $userId,
                'from_status' => $from->value,
                'to_status' => $to->value,
                'note' => $note,
                'created_at' => now(),
            ]);

            if ($to->restoresStock()) {
                foreach ($order->items as $item) {
                    $product = $item->product_id ? Product::query()->find($item->product_id) : null;
                    if (! $product) {
                        continue;
                    }
                    $this->inventory->restore(
                        $product,
                        $item->variant_id,
                        $item->quantity,
                        $userId,
                        'cancellation',
                        Order::class,
                        $order->id,
                    );
                }
                if ($order->coupon_code) {
                    $usage = CouponUsage::query()->where('order_id', $order->id)->first();
                    if ($usage) {
                        $usage->coupon?->decrement('used_count');
                        $usage->delete();
                    }
                }
            }

            $fresh = $order->fresh(['items']);

            DB::afterCommit(function () use ($fresh, $to) {
                $kind = match ($to) {
                    OrderStatus::OutForDelivery => 'dispatched',
                    OrderStatus::Delivered => 'delivered',
                    OrderStatus::Cancelled => 'cancelled',
                    default => null,
                };
                if ($kind) {
                    Mail::to($fresh->customer_email)->queue(new OrderStatusMail($fresh, $kind));
                }
            });

            return $fresh;
        });
    }

    private function nextNumber(): string
    {
        $prefix = 'ORD-'.now('Asia/Manila')->format('Ymd').'-';
        $last = Order::query()->where('order_number', 'like', $prefix.'%')->lockForUpdate()->orderByDesc('order_number')->value('order_number');
        $seq = $last ? ((int) substr($last, -4)) + 1 : 1;

        return $prefix.str_pad((string) $seq, 4, '0', STR_PAD_LEFT);
    }
}
