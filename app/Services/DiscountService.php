<?php

namespace App\Services;

use App\Enums\CouponType;
use App\Models\Coupon;
use App\Models\CouponUsage;
use Carbon\Carbon;
use Illuminate\Validation\ValidationException;

class DiscountService
{
    public function findValid(string $code, float $subtotal, ?int $userId, ?string $email): Coupon
    {
        $coupon = Coupon::query()->whereRaw('UPPER(code) = ?', [strtoupper(trim($code))])->first();

        if (! $coupon) {
            throw ValidationException::withMessages(['coupon' => 'We could not find that promo code.']);
        }

        if (! $coupon->is_active) {
            throw ValidationException::withMessages(['coupon' => 'This promo code is no longer active.']);
        }

        $now = Carbon::now();
        if ($coupon->starts_at && $now->lt($coupon->starts_at)) {
            throw ValidationException::withMessages(['coupon' => 'This promo code is not valid yet.']);
        }
        if ($coupon->ends_at && $now->gt($coupon->ends_at)) {
            throw ValidationException::withMessages(['coupon' => 'This promo code expired on '.$coupon->ends_at->timezone('Asia/Manila')->toFormattedDateString().'. Try another code.']);
        }
        if ($coupon->usage_limit !== null && $coupon->used_count >= $coupon->usage_limit) {
            throw ValidationException::withMessages(['coupon' => 'This promo code has reached its usage limit.']);
        }
        if ((float) $coupon->minimum_purchase > 0 && $subtotal < (float) $coupon->minimum_purchase) {
            throw ValidationException::withMessages(['coupon' => 'This code requires a minimum purchase of PHP '.number_format((float) $coupon->minimum_purchase, 2).'.']);
        }
        if ($coupon->per_customer_limit && $email) {
            $used = CouponUsage::query()
                ->where('coupon_id', $coupon->id)
                ->where(function ($q) use ($userId, $email) {
                    $q->where('email', $email);
                    if ($userId) {
                        $q->orWhere('user_id', $userId);
                    }
                })
                ->count();
            if ($used >= $coupon->per_customer_limit) {
                throw ValidationException::withMessages(['coupon' => 'You have already used this promo code the maximum number of times.']);
            }
        }

        return $coupon;
    }

    public function discountAmount(Coupon $coupon, float $subtotal, float $deliveryFee, bool $allowFreeShipping = true): array
    {
        $discount = 0.0;
        $delivery = $deliveryFee;

        if ($coupon->type === CouponType::Percentage) {
            $discount = round($subtotal * ((float) $coupon->value) / 100, 2);
        } elseif ($coupon->type === CouponType::Fixed) {
            $discount = min($subtotal, (float) $coupon->value);
        } elseif ($coupon->type === CouponType::FreeDelivery && $allowFreeShipping) {
            $delivery = 0.0;
        }

        $discount = min($discount, $subtotal);

        return ['discount' => $discount, 'delivery_fee' => $delivery];
    }
}
