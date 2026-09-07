<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class ProductVariant extends Model
{
    protected $fillable = ['product_id', 'sku', 'price_override', 'stock_quantity', 'image_path', 'is_active'];

    protected function casts(): array
    {
        return [
            'price_override' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function optionValues(): BelongsToMany
    {
        return $this->belongsToMany(ProductOptionValue::class, 'product_variant_values', 'variant_id', 'option_value_id');
    }

    public function price(): string
    {
        return $this->price_override ?? $this->product->price;
    }

    public function optionLabel(): string
    {
        return $this->optionValues->map(fn (ProductOptionValue $v) => $v->value)->implode(' / ');
    }
}
