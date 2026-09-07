<?php

namespace App\Http\Middleware;

use App\Exceptions\ShopException;
use App\Services\StorePolicyService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureStoreOpen
{
    public function handle(Request $request, Closure $next): Response
    {
        try {
            app(StorePolicyService::class)->assertStoreOpen();
        } catch (ShopException $e) {
            if ($request->expectsJson() || $request->header('X-Inertia')) {
                return back()->withErrors(['store' => $e->getMessage()]);
            }
            abort(423, $e->getMessage());
        }

        return $next($request);
    }
}
