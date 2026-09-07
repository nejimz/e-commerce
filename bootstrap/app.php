<?php

use App\Http\Middleware\EnsureStoreOpen;
use App\Http\Middleware\EnsureUserIsAdmin;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\SecurityHeaders;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        then: function () {
            require base_path('routes/webhooks.php');
        },
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->alias([
            'admin' => EnsureUserIsAdmin::class,
            'store.open' => EnsureStoreOpen::class,
        ]);
        $middleware->web(append: [
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
            SecurityHeaders::class,
        ]);
        $middleware->validateCsrfTokens(except: [
            'webhooks/paymongo',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->respond(function (Response $response, \Throwable $e, Request $request) {
            $status = $response->getStatusCode();
            if (in_array($status, [403, 404, 419, 429, 500], true) && ($request->header('X-Inertia') || $request->acceptsHtml())) {
                return Inertia::render('errors/error', [
                    'status' => $status,
                    'message' => match ($status) {
                        403 => 'You do not have access to that page.',
                        404 => 'We could not find that page.',
                        419 => 'Your session expired. Please refresh and try again.',
                        429 => 'Too many requests. Please wait a moment.',
                        default => 'Something went wrong. Please try again.',
                    },
                ])->toResponse($request)->setStatusCode($status);
            }

            return $response;
        });
    })->create();
