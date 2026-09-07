<?php

namespace App\Services;

use App\Exceptions\ShopException;
use App\Models\DeliveryArea;
use App\Models\Setting;
use Carbon\Carbon;

class StorePolicyService
{
    public function assertStoreOpen(): void
    {
        if (Setting::get('store_paused', false)) {
            $message = Setting::get('store_paused_message', 'The store is temporarily paused. Checkout is unavailable.');
            throw ShopException::storePaused((string) $message);
        }

        if (! Setting::get('ordering_hours_enabled', false)) {
            return;
        }

        $start = Setting::get('ordering_hours_start', '08:00');
        $end = Setting::get('ordering_hours_end', '22:00');
        $now = Carbon::now('Asia/Manila');
        $todayStart = $now->copy()->setTimeFromTimeString((string) $start);
        $todayEnd = $now->copy()->setTimeFromTimeString((string) $end);

        if ($now->lt($todayStart) || $now->gt($todayEnd)) {
            $next = $now->lt($todayStart) ? $todayStart : $todayStart->copy()->addDay();
            throw ShopException::outsideHours($nextOpen = $next->timezone('Asia/Manila')->format('D, g:i A'));
        }
    }

    public function isStoreOpen(): bool
    {
        try {
            $this->assertStoreOpen();

            return true;
        } catch (ShopException) {
            return false;
        }
    }

    public function resolveArea(string $province, string $city, ?string $postalCode = null): ?DeliveryArea
    {
        $query = DeliveryArea::query()->where('is_active', true);

        $match = (clone $query)
            ->whereRaw('LOWER(province) = ?', [mb_strtolower($province)])
            ->whereRaw('LOWER(city) = ?', [mb_strtolower($city)])
            ->first();

        if (! $match && $postalCode) {
            $match = (clone $query)->where('postal_code', $postalCode)->first();
        }

        return $match;
    }

    public function assertDeliverable(string $province, string $city, ?string $postalCode = null): DeliveryArea
    {
        $area = $this->resolveArea($province, $city, $postalCode);
        $defaultBlock = Setting::get('unlisted_area_default', 'block') === 'block';

        if (! $area) {
            if ($defaultBlock) {
                throw ShopException::undeliverable("{$city}, {$province}");
            }

            $fallback = new DeliveryArea([
                'province' => $province,
                'city' => $city,
                'mode' => 'allow',
                'delivery_fee' => Setting::get('default_delivery_fee', 99),
            ]);
            $fallback->id = null;

            return $fallback;
        }

        if (! $area->allows()) {
            throw ShopException::undeliverable("{$area->city}, {$area->province}");
        }

        return $area;
    }
}
