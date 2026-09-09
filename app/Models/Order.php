<?php

namespace App\Models;

use App\Enums\OrderStatus;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Support\Countries;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    protected $fillable = [
        'order_number', 'user_id', 'guest_email', 'customer_name', 'customer_email', 'customer_phone',
        'subtotal', 'discount_amount', 'coupon_code', 'delivery_fee', 'packing_fee', 'vat_amount', 'total',
        'payment_method', 'payment_status', 'order_status',
        'shipping_recipient', 'shipping_phone', 'shipping_line1', 'shipping_line2',
        'shipping_country_code', 'shipping_barangay', 'shipping_city', 'shipping_province', 'shipping_postal_code',
        'delivery_area_id', 'customer_note', 'admin_note', 'gift_message', 'hide_prices',
        'terms_accepted_at', 'idempotency_key', 'placed_at',
    ];

    protected function casts(): array
    {
        return [
            'subtotal' => 'decimal:2',
            'discount_amount' => 'decimal:2',
            'delivery_fee' => 'decimal:2',
            'packing_fee' => 'decimal:2',
            'vat_amount' => 'decimal:2',
            'total' => 'decimal:2',
            'payment_method' => PaymentMethod::class,
            'payment_status' => PaymentStatus::class,
            'order_status' => OrderStatus::class,
            'hide_prices' => 'boolean',
            'terms_accepted_at' => 'datetime',
            'placed_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function statusLogs(): HasMany
    {
        return $this->hasMany(OrderStatusLog::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function shipments(): HasMany
    {
        return $this->hasMany(Shipment::class);
    }

    public function shippingSummary(): string
    {
        return collect([
            $this->shipping_recipient,
            $this->shipping_line1,
            $this->shipping_barangay,
            $this->shipping_city,
            $this->shipping_province,
            $this->shipping_postal_code,
            Countries::name($this->shipping_country_code),
        ])->filter()->implode(', ');
    }
}
