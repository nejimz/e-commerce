<?php

use App\Http\Controllers\WebhookController;
use Illuminate\Support\Facades\Route;

Route::post('/webhooks/paymongo', [WebhookController::class, 'paymongo'])
    ->name('webhooks.paymongo');
