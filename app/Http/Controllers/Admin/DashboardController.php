<?php

namespace App\Http\Controllers\Admin;

use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function __invoke(Request $request)
    {
        $today = now('Asia/Manila')->startOfDay()->utc();

        return Inertia::render('admin/dashboard', [
            'stats' => [
                'today_orders' => Order::query()->where('placed_at', '>=', $today)->count(),
                'today_sales' => Order::query()->where('placed_at', '>=', $today)->whereNotIn('order_status', ['cancelled'])->sum('total'),
                'pending' => Order::query()->where('order_status', OrderStatus::Pending)->count(),
                'out_for_delivery' => Order::query()->where('order_status', OrderStatus::OutForDelivery)->count(),
                'low_stock' => Product::query()->where('has_variants', false)->whereColumn('stock_quantity', '<=', 'low_stock_threshold')->count(),
            ],
            'recent' => Order::query()->latest()->take(10)->get(['id', 'order_number', 'customer_name', 'total', 'order_status', 'payment_status', 'placed_at']),
            'lowStock' => Product::query()->where('is_active', true)->where('has_variants', false)->whereColumn('stock_quantity', '<=', 'low_stock_threshold')->take(8)->get(['id', 'name', 'sku', 'stock_quantity']),
        ]);
    }
}
