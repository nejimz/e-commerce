<?php

namespace App\Http\Controllers;

use App\Services\PaymentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

use Symfony\Component\HttpKernel\Exception\HttpException;

class WebhookController extends Controller
{
    public function paymongo(Request $request, PaymentService $payments)
    {
        try {
            $payments->handleWebhook($request);
        } catch (HttpException $e) {
            Log::error('PayMongo webhook error', ['e' => $e->getMessage()]);

            return response()->json(['ok' => false], $e->getStatusCode());
        } catch (\Throwable $e) {
            Log::error('PayMongo webhook error', ['e' => $e->getMessage()]);

            return response()->json(['ok' => false], 400);
        }

        return response()->json(['ok' => true]);
    }
}
