@php
    /** @var \App\Models\Order $order */
    $kind = $kind ?? 'placed';
@endphp
<x-mail::message>
# {{ $kind === 'placed_admin' ? 'New order' : 'Order update' }}

Order **{{ $order->order_number }}** is now **{{ is_object($order->order_status) ? $order->order_status->label() : $order->order_status }}**.

**Total:** PHP {{ number_format((float) $order->total, 2) }}

@if($order->items)
@foreach($order->items as $item)
- {{ $item->product_name_snapshot }} × {{ $item->quantity }}
@endforeach
@endif

<x-mail::button :url="url('/orders/'.$order->order_number)">
View order
</x-mail::button>

Thanks,<br>
{{ config('app.name') }}
</x-mail::message>
