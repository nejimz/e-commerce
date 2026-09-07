<?php

namespace App\Services;

use App\Exceptions\ShopException;
use App\Models\InventoryLog;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Support\Facades\DB;

class InventoryService
{
    public function lockAndDeduct(Product $product, ?ProductVariant $variant, int $quantity, ?int $userId, string $reason, string $referenceType, int $referenceId): void
    {
        if ($variant) {
            $row = ProductVariant::query()->whereKey($variant->id)->lockForUpdate()->firstOrFail();
            $available = (int) $row->stock_quantity;
            if ($available < $quantity && ! $product->allow_backorder) {
                throw ShopException::insufficientStock($product->name.' ('.$variant->sku.')', $available);
            }
            $row->stock_quantity = max(0, $available - $quantity);
            $row->save();
            $resulting = (int) $row->stock_quantity;
        } else {
            $row = Product::query()->whereKey($product->id)->lockForUpdate()->firstOrFail();
            $available = (int) $row->stock_quantity;
            if ($available < $quantity && ! $row->allow_backorder) {
                throw ShopException::insufficientStock($product->name, $available);
            }
            $row->stock_quantity = max(0, $available - $quantity);
            $row->save();
            $resulting = (int) $row->stock_quantity;
        }

        InventoryLog::query()->create([
            'product_id' => $product->id,
            'variant_id' => $variant?->id,
            'user_id' => $userId,
            'change_qty' => -$quantity,
            'resulting_qty' => $resulting,
            'reason' => $reason,
            'reference_type' => $referenceType,
            'reference_id' => $referenceId,
            'created_at' => now(),
        ]);
    }

    public function restore(Product $product, ?int $variantId, int $quantity, ?int $userId, string $reason, string $referenceType, int $referenceId): void
    {
        if ($variantId) {
            $row = ProductVariant::query()->whereKey($variantId)->lockForUpdate()->first();
            if (! $row) {
                return;
            }
            $row->stock_quantity += $quantity;
            $row->save();
            $resulting = (int) $row->stock_quantity;
        } else {
            $row = Product::query()->whereKey($product->id)->lockForUpdate()->first();
            if (! $row) {
                return;
            }
            $row->stock_quantity += $quantity;
            $row->save();
            $resulting = (int) $row->stock_quantity;
        }

        InventoryLog::query()->create([
            'product_id' => $product->id,
            'variant_id' => $variantId,
            'user_id' => $userId,
            'change_qty' => $quantity,
            'resulting_qty' => $resulting,
            'reason' => $reason,
            'reference_type' => $referenceType,
            'reference_id' => $referenceId,
            'created_at' => now(),
        ]);
    }

    public function adjust(Product $product, ?ProductVariant $variant, int $newQty, int $userId, string $reason): void
    {
        DB::transaction(function () use ($product, $variant, $newQty, $userId, $reason) {
            if ($variant) {
                $row = ProductVariant::query()->whereKey($variant->id)->lockForUpdate()->firstOrFail();
                $delta = $newQty - (int) $row->stock_quantity;
                $row->stock_quantity = $newQty;
                $row->save();
                $resulting = $newQty;
            } else {
                $row = Product::query()->whereKey($product->id)->lockForUpdate()->firstOrFail();
                $delta = $newQty - (int) $row->stock_quantity;
                $row->stock_quantity = $newQty;
                $row->save();
                $resulting = $newQty;
            }

            InventoryLog::query()->create([
                'product_id' => $product->id,
                'variant_id' => $variant?->id,
                'user_id' => $userId,
                'change_qty' => $delta,
                'resulting_qty' => $resulting,
                'reason' => $reason,
                'reference_type' => 'manual',
                'reference_id' => null,
                'created_at' => now(),
            ]);
        });
    }
}
