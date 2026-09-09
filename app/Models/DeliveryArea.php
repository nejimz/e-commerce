<?php

namespace App\Models;

use App\Support\Countries;
use Illuminate\Database\Eloquent\Model;

class DeliveryArea extends Model
{
    protected $fillable = [
        'country_code', 'province', 'city', 'barangay', 'postal_code', 'mode',
        'delivery_fee', 'free_shipping_eligible', 'same_day_eligible', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'delivery_fee' => 'decimal:2',
            'free_shipping_eligible' => 'boolean',
            'same_day_eligible' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function allows(): bool
    {
        return $this->mode === 'allow';
    }

    public function isCountryWide(): bool
    {
        return blank($this->city) && blank($this->province);
    }

    public function isDomestic(): bool
    {
        return Countries::isDomestic($this->country_code);
    }

    public function displayName(): string
    {
        $country = Countries::name($this->country_code);
        if ($this->isCountryWide()) {
            return $country;
        }

        return collect([$this->city, $this->province, $country])->filter()->implode(', ');
    }
}
