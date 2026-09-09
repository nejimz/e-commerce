<?php

namespace App\Services;

use App\Models\DeliveryArea;
use App\Models\Setting;

class ShippingService
{
    /**
     * Zone fee first, then free-shipping threshold.
     * International zones should set free_shipping_eligible=false so a domestic
     * threshold cannot zero a country-wide rate (PRD BR-15.1, FR-501–503).
     */
    public function quote(?DeliveryArea $area, float $subtotal): array
    {
        $default = (float) Setting::get('default_delivery_fee', 99);
        $delivery = $area?->delivery_fee !== null ? (float) $area->delivery_fee : $default;
        $threshold = (float) Setting::get('free_delivery_threshold', 0);
        $freeEnabled = (bool) Setting::get('free_delivery_enabled', false);
        $eligible = $area === null || (bool) $area->free_shipping_eligible;

        if ($freeEnabled && $eligible && $threshold > 0 && $subtotal >= $threshold) {
            $delivery = 0.0;
        }

        $packing = (float) Setting::get('packing_fee', 0);

        return [
            'delivery_fee' => round($delivery, 2),
            'packing_fee' => round($packing, 2),
            'same_day' => (bool) ($area?->same_day_eligible),
            'free_delivery_threshold' => $freeEnabled && $eligible ? $threshold : null,
            'free_shipping_eligible' => $eligible,
        ];
    }
}
