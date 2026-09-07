<?php

namespace App\Exceptions;

use RuntimeException;

class ShopException extends RuntimeException
{
    public static function storePaused(string $message = 'The store is temporarily paused. Checkout is unavailable.'): self
    {
        return new self($message);
    }

    public static function outsideHours(string $nextOpen): self
    {
        return new self("Ordering is closed right now. Next opening: {$nextOpen}.");
    }

    public static function undeliverable(string $area): self
    {
        return new self("We do not deliver to {$area}. Please choose another address or contact us.");
    }

    public static function insufficientStock(string $name, int $available): self
    {
        return new self("Only {$available} of {$name} left in stock.");
    }

    public static function inactiveProduct(string $name): self
    {
        return new self("{$name} is no longer available.");
    }

    public static function termsRequired(): self
    {
        return new self('You must accept the Terms of Sale to place an order.');
    }
}
