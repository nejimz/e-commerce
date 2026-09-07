<?php

namespace App\Mail;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OrderStatusMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Order $order, public string $kind) {}

    public function envelope(): Envelope
    {
        $number = $this->order->order_number;

        $subject = match ($this->kind) {
            'placed' => "We received your order {$number}",
            'placed_admin' => "New order {$number}",
            'paid' => "Payment received for {$number}",
            'dispatched' => "Your order {$number} is on the way",
            'delivered' => "Your order {$number} was delivered",
            'cancelled' => "Your order {$number} was cancelled",
            default => "Update on order {$number}",
        };

        return new Envelope(subject: $subject);
    }

    public function content(): Content
    {
        return new Content(markdown: 'mail.order-status');
    }
}
