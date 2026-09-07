<?php

namespace App\Http\Controllers\Admin;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\OrderService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;

class OrderController extends Controller
{
    public function index(Request $request)
    {
        $orders = Order::query()
            ->when($request->search, function ($q, $s) {
                $q->where(function ($w) use ($s) {
                    $w->where('order_number', 'like', "%{$s}%")
                        ->orWhere('customer_name', 'like', "%{$s}%")
                        ->orWhere('customer_email', 'like', "%{$s}%")
                        ->orWhere('customer_phone', 'like', "%{$s}%");
                });
            })
            ->when($request->status, fn ($q, $s) => $q->where('order_status', $s))
            ->when($request->payment, fn ($q, $s) => $q->where('payment_status', $s))
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('admin/orders/index', ['orders' => $orders, 'filters' => $request->only(['search', 'status', 'payment'])]);
    }

    public function show(Order $order)
    {
        $order->load(['items', 'statusLogs', 'payments', 'shipments']);

        return Inertia::render('admin/orders/show', [
            'order' => $order,
            'transitions' => collect($order->order_status->allowedTransitions())->map(fn ($s) => ['value' => $s->value, 'label' => $s->label()]),
        ]);
    }

    public function updateStatus(Request $request, Order $order, OrderService $orders)
    {
        $data = $request->validate([
            'status' => 'required|string',
            'note' => 'nullable|string|max:500',
        ]);
        $to = OrderStatus::from($data['status']);
        if ($to === OrderStatus::Cancelled) {
            $request->validate(['note' => 'required|string|min:3']);
        }
        $orders->transition($order, $to, $request->user()->id, $data['note'] ?? null);

        return back()->with('success', 'Order updated.');
    }

    public function markPaid(Request $request, Order $order)
    {
        abort_unless($request->user()->isAdmin(), 403);
        $order->payment_status = PaymentStatus::Paid;
        $order->save();

        return back()->with('success', 'Marked paid.');
    }

    public function tracking(Request $request, Order $order)
    {
        $data = $request->validate([
            'courier' => 'nullable|string|max:50',
            'tracking_number' => 'nullable|string|max:80',
        ]);
        $shipment = $order->shipments()->firstOrNew();
        $shipment->fill($data);
        $shipment->order_id = $order->id;
        $shipment->save();

        return back()->with('success', 'Tracking saved.');
    }

    public function packingSlip(Order $order)
    {
        $order->load('items');

        return Inertia::render('admin/orders/packing-slip', ['order' => $order]);
    }

    public function export(Request $request): StreamedResponse
    {
        $orders = Order::query()->latest()->limit(500)->get();

        return response()->streamDownload(function () use ($orders) {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['number', 'customer', 'email', 'total', 'status', 'payment', 'placed_at']);
            foreach ($orders as $o) {
                fputcsv($out, [$o->order_number, $o->customer_name, $o->customer_email, $o->total, $o->order_status->value, $o->payment_status->value, $o->placed_at]);
            }
            fclose($out);
        }, 'orders.csv');
    }
}
