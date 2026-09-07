<?php

namespace App\Services;

use App\Enums\OrderStatus;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Mail\OrderStatusMail;
use App\Models\Order;
use App\Models\Payment;
use App\Models\ProcessedWebhook;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class PaymentService
{
    public function initiate(Order $order): ?string
    {
        if ($order->payment_method === PaymentMethod::Cod) {
            Payment::query()->create([
                'order_id' => $order->id,
                'gateway' => 'cod',
                'amount' => $order->total,
                'currency' => 'PHP',
                'status' => PaymentStatus::Unpaid,
            ]);

            return null;
        }

        $payment = Payment::query()->create([
            'order_id' => $order->id,
            'gateway' => 'paymongo',
            'amount' => $order->total,
            'currency' => 'PHP',
            'status' => PaymentStatus::Pending,
        ]);

        if (config('shop.gateway') !== 'paymongo' || ! config('shop.paymongo.secret')) {
            return null;
        }

        $centavos = (int) round(((float) $order->total) * 100);
        $response = Http::withBasicAuth(config('shop.paymongo.secret'), '')
            ->acceptJson()
            ->post('https://api.paymongo.com/v1/checkout_sessions', [
                'data' => [
                    'attributes' => [
                        'send_email_receipt' => true,
                        'show_description' => true,
                        'show_line_items' => true,
                        'description' => 'Order '.$order->order_number,
                        'line_items' => [[
                            'currency' => 'PHP',
                            'amount' => $centavos,
                            'name' => 'Order '.$order->order_number,
                            'quantity' => 1,
                        ]],
                        'payment_method_types' => ['card', 'gcash', 'paymaya', 'grab_pay'],
                        'success_url' => url('/orders/'.$order->order_number.'/confirmation?paid=1'),
                        'cancel_url' => url('/checkout?retry='.$order->order_number),
                        'metadata' => [
                            'order_id' => (string) $order->id,
                            'order_number' => $order->order_number,
                        ],
                    ],
                ],
            ]);

        if (! $response->successful()) {
            Log::channel('stack')->warning('PayMongo checkout failed', ['body' => $response->json()]);

            return null;
        }

        $payload = $response->json('data');
        $payment->gateway_reference = $payload['id'] ?? null;
        $payment->payload_json = $payload;
        $payment->save();

        return $payload['attributes']['checkout_url'] ?? null;
    }

    public function checkoutUrl(Order $order): ?string
    {
        $payment = $order->payments()->where('gateway', 'paymongo')->latest()->first();

        return data_get($payment?->payload_json, 'attributes.checkout_url');
    }

    public function handleWebhook(Request $request): void
    {
        $raw = $request->getContent();
        $this->verifySignature($raw, $request->header('Paymongo-Signature', ''));

        $event = $request->json()->all();
        $eventId = data_get($event, 'data.id');
        $type = data_get($event, 'data.attributes.type');
        $status = data_get($event, 'data.attributes.data.attributes.status');
        $amount = data_get($event, 'data.attributes.data.attributes.amount');
        $currency = data_get($event, 'data.attributes.data.attributes.currency');
        $checkoutId = data_get($event, 'data.attributes.data.id');
        $metadataOrder = data_get($event, 'data.attributes.data.attributes.metadata.order_id')
            ?? data_get($event, 'data.attributes.metadata.order_id');

        if ($eventId && ProcessedWebhook::query()->where('event_id', $eventId)->exists()) {
            return;
        }

        $payment = Payment::query()
            ->where('gateway', 'paymongo')
            ->where(function ($q) use ($checkoutId, $metadataOrder) {
                if ($checkoutId) {
                    $q->where('gateway_reference', $checkoutId);
                }
                if ($metadataOrder) {
                    $q->orWhere('order_id', $metadataOrder);
                }
            })
            ->latest()
            ->first();

        if (! $payment) {
            Log::warning('PayMongo webhook for unknown payment', ['event' => $eventId]);

            return;
        }

        $order = $payment->order;
        $expected = (int) round(((float) $order->total) * 100);
        $mismatch = false;
        if ($amount && (int) $amount !== $expected) {
            $mismatch = true;
        }
        if ($currency && strtoupper((string) $currency) !== 'PHP') {
            $mismatch = true;
        }
        if ($mismatch) {
            $order->admin_note = trim(($order->admin_note ? $order->admin_note."\n" : '').'Webhook amount/currency mismatch; flagged for review.');
            $order->save();
            Log::warning('PayMongo amount/currency mismatch', ['order' => $order->order_number, 'expected' => $expected, 'got' => $amount, 'currency' => $currency]);
            $this->rememberEvent($eventId);

            return;
        }

        if (in_array($type, ['checkout_session.payment.paid', 'payment.paid'], true) || $status === 'paid') {
            $payment->status = PaymentStatus::Paid;
            $payment->paid_at = now();
            $payment->payload_json = array_merge($payment->payload_json ?? [], ['event' => $event]);
            if ($eventId) {
                $payment->gateway_reference = $payment->gateway_reference ?: $eventId;
            }
            $payment->save();

            $order->payment_status = PaymentStatus::Paid;
            if ($order->order_status === OrderStatus::Pending) {
                $order->order_status = OrderStatus::Confirmed;
                $order->statusLogs()->create([
                    'from_status' => OrderStatus::Pending->value,
                    'to_status' => OrderStatus::Confirmed->value,
                    'note' => 'Payment confirmed via PayMongo webhook',
                    'created_at' => now(),
                ]);
            }
            $order->save();
            Mail::to($order->customer_email)->queue(new OrderStatusMail($order->load('items'), 'paid'));
        }

        $this->rememberEvent($eventId);
    }

    private function rememberEvent(?string $eventId): void
    {
        if (! $eventId) {
            return;
        }
        ProcessedWebhook::query()->firstOrCreate(
            ['event_id' => $eventId],
            ['gateway' => 'paymongo', 'processed_at' => now()],
        );
    }

    private function verifySignature(string $payload, string $header): void
    {
        $secret = config('shop.paymongo.webhook_secret');
        if (! $secret) {
            return;
        }

        $parts = [];
        foreach (explode(',', $header) as $piece) {
            [$k, $v] = array_pad(explode('=', trim($piece), 2), 2, null);
            $parts[$k] = $v;
        }
        $timestamp = $parts['t'] ?? '';
        $testSig = $parts['te'] ?? $parts['li'] ?? '';
        $computed = hash_hmac('sha256', $timestamp.'.'.$payload, $secret);

        if (! hash_equals($computed, $testSig)) {
            abort(401, 'Invalid webhook signature');
        }
    }
}
