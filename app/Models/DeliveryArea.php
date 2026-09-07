<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DeliveryArea extends Model
{
    protected $fillable = [
        'province', 'city', 'barangay', 'postal_code', 'mode', 'delivery_fee', 'same_day_eligible', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'delivery_fee' => 'decimal:2',
            'same_day_eligible' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function allows(): bool
    {
        return $this->mode === 'allow';
    }
}
