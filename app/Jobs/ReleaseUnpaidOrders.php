<?php

namespace App\Jobs;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Models\Order;
use App\Services\OrderService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class ReleaseUnpaidOrders implements ShouldQueue
{
    use Queueable;

    public function handle(OrderService $orders): void
    {
        $minutes = (int) \App\Models\Setting::get('unpaid_release_minutes', 60);
        Order::query()
            ->where('payment_status', PaymentStatus::Pending)
            ->where('order_status', OrderStatus::Pending)
            ->where('placed_at', '<', now()->subMinutes($minutes))
            ->each(function (Order $order) use ($orders) {
                $orders->transition($order, OrderStatus::Cancelled, null, 'Unpaid online order auto-cancelled');
            });
    }
}
