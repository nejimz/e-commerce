<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        RateLimiter::for('checkout', fn (Request $request) => Limit::perMinute(5)->by($request->ip()));
        RateLimiter::for('coupon', fn (Request $request) => Limit::perMinute(10)->by($request->ip()));
        RateLimiter::for('search', fn (Request $request) => Limit::perMinute(30)->by($request->ip()));
    }
}
