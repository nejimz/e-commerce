<?php

namespace App\Services;

use App\Exceptions\ShopException;
use App\Models\DeliveryArea;
use App\Models\Setting;
use App\Support\Countries;
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

    public function resolveArea(string $province, string $city, ?string $postalCode = null, ?string $countryCode = null): ?DeliveryArea
    {
        $country = Countries::normalize($countryCode);
        $query = DeliveryArea::query()->where('is_active', true)->where('country_code', $country);

        if ($city !== '') {
            $match = (clone $query)
                ->whereNotNull('city')
                ->whereRaw('LOWER(city) = ?', [mb_strtolower($city)])
                ->when($province !== '', function ($q) use ($province) {
                    $q->where(function ($inner) use ($province) {
                        $inner->whereNull('province')
                            ->orWhereRaw('LOWER(province) = ?', [mb_strtolower($province)]);
                    });
                })
                ->orderByRaw('CASE WHEN province IS NULL THEN 1 ELSE 0 END')
                ->first();

            if ($match) {
                return $match;
            }
        }

        if ($postalCode) {
            $match = (clone $query)->where('postal_code', $postalCode)->first();
            if ($match) {
                return $match;
            }
        }

        return (clone $query)->whereNull('city')->whereNull('province')->first();
    }

    public function assertDeliverable(string $province, string $city, ?string $postalCode = null, ?string $countryCode = null): DeliveryArea
    {
        $country = Countries::normalize($countryCode);
        $area = $this->resolveArea($province, $city, $postalCode, $country);
        $defaultBlock = Setting::get('unlisted_area_default', 'block') === 'block';
        $place = $area?->displayName() ?: collect([$city, $province, Countries::name($country)])->filter()->implode(', ');

        if (! $area) {
            if ($defaultBlock) {
                throw ShopException::undeliverable($place);
            }

            $fallback = new DeliveryArea([
                'country_code' => $country,
                'province' => $province !== '' ? $province : null,
                'city' => $city !== '' ? $city : null,
                'mode' => 'allow',
                'delivery_fee' => Setting::get('default_delivery_fee', 99),
                'free_shipping_eligible' => Countries::isDomestic($country),
            ]);
            $fallback->id = null;

            return $fallback;
        }

        if (! $area->allows()) {
            throw ShopException::undeliverable($place);
        }

        return $area;
    }
}
