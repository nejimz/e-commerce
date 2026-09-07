<?php

namespace Tests\Feature;

use App\Enums\OrderStatus;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Models\Order;
use App\Models\Payment;
use App\Models\ProcessedWebhook;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class PaymentWebhookTest extends TestCase
{
    use RefreshDatabase;

    private function signed(string $payload, string $secret): string
    {
        $t = (string) time();

        return 't='.$t.',te='.hash_hmac('sha256', $t.'.'.$payload, $secret);
    }

    private function pendingPaymongoOrder(): Order
    {
        $this->allowMakati();
        $user = User::factory()->create();
        $order = Order::query()->create([
            'order_number' => 'ORD-TEST-0001',
            'user_id' => $user->id,
            'customer_name' => $user->name,
            'customer_email' => $user->email,
            'customer_phone' => '09171234567',
            'subtotal' => 1000,
            'discount_amount' => 0,
            'delivery_fee' => 80,
            'packing_fee' => 0,
            'vat_amount' => 115.71,
            'total' => 1080,
            'payment_method' => PaymentMethod::Paymongo,
            'payment_status' => PaymentStatus::Pending,
            'order_status' => OrderStatus::Pending,
            'shipping_recipient' => $user->name,
            'shipping_phone' => '09171234567',
            'shipping_line1' => '1 Main',
            'shipping_city' => 'Makati',
            'shipping_province' => 'Metro Manila',
            'shipping_postal_code' => '1200',
            'placed_at' => now(),
        ]);
        Payment::query()->create([
            'order_id' => $order->id,
            'gateway' => 'paymongo',
            'gateway_reference' => 'cs_test_1',
            'amount' => 1080,
            'currency' => 'PHP',
            'status' => PaymentStatus::Pending,
        ]);

        return $order;
    }

    public function test_invalid_signature_is_rejected(): void
    {
        config(['shop.paymongo.webhook_secret' => 'whsec_test']);
        $this->pendingPaymongoOrder();

        $payload = json_encode(['data' => ['id' => 'evt_1']]);
        $this->call('POST', '/webhooks/paymongo', [], [], [], [
            'HTTP_PAYMONGO-SIGNATURE' => 't=1,te=deadbeef',
            'CONTENT_TYPE' => 'application/json',
        ], $payload)->assertStatus(401);
    }

    public function test_paid_event_marks_order_paid_and_ignores_replay(): void
    {
        Mail::fake();
        config(['shop.paymongo.webhook_secret' => 'whsec_test']);
        $order = $this->pendingPaymongoOrder();
        $body = [
            'data' => [
                'id' => 'evt_paid_1',
                'attributes' => [
                    'type' => 'checkout_session.payment.paid',
                    'data' => [
                        'id' => 'cs_test_1',
                        'attributes' => [
                            'status' => 'paid',
                            'amount' => 108000,
                            'currency' => 'PHP',
                            'metadata' => ['order_id' => (string) $order->id],
                        ],
                    ],
                ],
            ],
        ];
        $raw = json_encode($body);
        $headers = [
            'HTTP_PAYMONGO-SIGNATURE' => $this->signed($raw = $raw, 'whsec_test'),
            'CONTENT_TYPE' => 'application/json',
        ];

        $this->call('POST', '/webhooks/paymongo', [], [], [], $headers, $raw)->assertOk();
        $this->call('POST', '/webhooks/paymongo', [], [], [], $headers, $raw)->assertOk();

        $order->refresh();
        $this->assertEquals(PaymentStatus::Paid, $order->payment_status);
        $this->assertEquals(OrderStatus::Confirmed, $order->order_status);
        $this->assertEquals(1, ProcessedWebhook::query()->count());
    }

    public function test_amount_mismatch_is_flagged(): void
    {
        config(['shop.paymongo.webhook_secret' => 'whsec_test']);
        $order = $this->pendingPaymongoOrder();
        $body = [
            'data' => [
                'id' => 'evt_mismatch',
                'attributes' => [
                    'type' => 'payment.paid',
                    'data' => [
                        'id' => 'cs_test_1',
                        'attributes' => [
                            'status' => 'paid',
                            'amount' => 1,
                            'currency' => 'PHP',
                            'metadata' => ['order_id' => (string) $order->id],
                        ],
                    ],
                ],
            ],
        ];
        $raw = json_encode($body);

        $this->call('POST', '/webhooks/paymongo', [], [], [], [
            'HTTP_PAYMONGO-SIGNATURE' => $this->signed($raw, 'whsec_test'),
            'CONTENT_TYPE' => 'application/json',
        ], $raw)->assertOk();

        $order->refresh();
        $this->assertEquals(PaymentStatus::Pending, $order->payment_status);
        $this->assertStringContainsString('mismatch', (string) $order->admin_note);
    }
}
