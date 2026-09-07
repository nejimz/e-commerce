<?php

namespace App\Support;

use Illuminate\Support\Number;

class Money
{
    public static function format(float|string $amount): string
    {
        return 'PHP '.number_format((float) $amount, 2, '.', ',');
    }

    public static function vatComponent(float|string $total, float $rate = 12): float
    {
        $total = (float) $total;
        if ($rate <= 0) {
            return 0;
        }

        return round($total * $rate / (100 + $rate), 2);
    }
}
