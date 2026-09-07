<?php

namespace App\Http\Middleware;

use App\Models\Category;
use App\Models\Setting;
use App\Services\CartService;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        $cartCount = 0;
        $storeName = config('app.name');
        $navCategories = [];
        $store = [
            'paused' => false,
            'paused_message' => null,
            'announcement' => null,
            'cod_maximum' => 0,
            'gateway' => config('shop.gateway'),
            'vat_enabled' => true,
        ];
        try {
            $cartCount = app(CartService::class)->current($request)->items->sum('quantity');
            $storeName = Setting::get('store_name', config('app.name'));
            $store = [
                'paused' => (bool) Setting::get('store_paused', false),
                'paused_message' => Setting::get('store_paused_message'),
                'announcement' => Setting::get('announcement'),
                'cod_maximum' => Setting::get('cod_maximum', 0),
                'gateway' => config('shop.gateway'),
                'vat_enabled' => (bool) Setting::get('vat_enabled', true),
            ];
            $navCategories = Category::query()
                ->whereNull('parent_id')
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->get(['id', 'name', 'slug']);
        } catch (\Throwable) {
            $cartCount = 0;
        }

        return [
            ...parent::share($request),
            'name' => $storeName,
            'auth' => [
                'user' => $request->user() ? [
                    'id' => $request->user()->id,
                    'name' => $request->user()->name,
                    'email' => $request->user()->email,
                    'phone' => $request->user()->phone,
                    'role' => $request->user()->role?->value,
                ] : null,
            ],
            'cartCount' => $cartCount,
            'navCategories' => $navCategories,
            'store' => $store,
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
            ],
        ];
    }
}
