<?php

use App\Http\Controllers\Admin\CouponController;
use App\Http\Controllers\Admin\CustomerController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\DeliveryAreaController;
use App\Http\Controllers\Admin\OrderController as AdminOrderController;
use App\Http\Controllers\Admin\ProductController as AdminProductController;
use App\Http\Controllers\Admin\SettingController;
use App\Http\Controllers\Store\AccountController;
use App\Http\Controllers\Store\CartController;
use App\Http\Controllers\Store\CatalogController;
use App\Http\Controllers\Store\CheckoutController;
use Illuminate\Support\Facades\Route;

Route::get('/', [CatalogController::class, 'home'])->name('home');
Route::get('/shop', [CatalogController::class, 'index'])->middleware('throttle:search')->name('catalog');
Route::get('/brands/{slug}', [CatalogController::class, 'brand'])->name('brands.show');
Route::get('/p/{slug}', [CatalogController::class, 'page'])->name('pages.show');
Route::get('/products/{slug}', [CatalogController::class, 'show'])->name('products.show');

Route::get('/cart', [CartController::class, 'show'])->name('cart.show');
Route::post('/cart', [CartController::class, 'add'])->middleware('store.open')->name('cart.add');
Route::post('/cart/coupon', [CartController::class, 'coupon'])->middleware('throttle:coupon')->name('cart.coupon');
Route::delete('/cart/coupon', [CartController::class, 'removeCoupon'])->name('cart.coupon.destroy');
Route::patch('/cart/{item}', [CartController::class, 'update'])->whereNumber('item')->name('cart.update');
Route::delete('/cart/{item}', [CartController::class, 'destroy'])->whereNumber('item')->name('cart.destroy');
Route::post('/deliverable', [CartController::class, 'deliverable'])->name('deliverable');

Route::get('/checkout', [CheckoutController::class, 'show'])->middleware('store.open')->name('checkout.show');
Route::post('/checkout', [CheckoutController::class, 'store'])->middleware(['store.open', 'throttle:checkout'])->name('checkout.store');
Route::get('/orders/{orderNumber}/confirmation', [CheckoutController::class, 'confirmation'])->name('orders.confirmation');
Route::get('/orders/{orderNumber}', [CheckoutController::class, 'showOrder'])->name('orders.show');
Route::post('/orders/lookup', [CheckoutController::class, 'lookup'])->middleware('throttle:10,1')->name('orders.lookup');
Route::post('/orders/{orderNumber}/reorder', [CheckoutController::class, 'reorder'])->name('orders.reorder');

Route::middleware('auth')->get('/dashboard', function () {
    if (request()->user()?->isStaff()) {
        return redirect()->route('admin.dashboard');
    }

    return redirect()->route('home');
})->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/account/orders', [AccountController::class, 'orders'])->name('account.orders');
    Route::get('/account/profile', [AccountController::class, 'profile'])->name('account.profile');
    Route::patch('/account/profile', [AccountController::class, 'updateProfile'])->name('account.profile.update');
    Route::post('/account/addresses', [AccountController::class, 'storeAddress'])->name('account.addresses.store');
    Route::delete('/account/addresses/{address}', [AccountController::class, 'destroyAddress'])->name('account.addresses.destroy');
});

Route::middleware(['auth', 'admin:staff'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/', DashboardController::class)->name('dashboard');
    Route::get('/orders', [AdminOrderController::class, 'index'])->name('orders.index');
    Route::get('/orders/export', [AdminOrderController::class, 'export'])->name('orders.export');
    Route::get('/orders/{order}', [AdminOrderController::class, 'show'])->name('orders.show');
    Route::patch('/orders/{order}/status', [AdminOrderController::class, 'updateStatus'])->name('orders.status');
    Route::patch('/orders/{order}/paid', [AdminOrderController::class, 'markPaid'])->middleware('admin:admin')->name('orders.paid');
    Route::patch('/orders/{order}/tracking', [AdminOrderController::class, 'tracking'])->name('orders.tracking');
    Route::get('/orders/{order}/packing-slip', [AdminOrderController::class, 'packingSlip'])->name('orders.packing-slip');

    Route::get('/products', [AdminProductController::class, 'index'])->name('products.index');
    Route::get('/products/create', [AdminProductController::class, 'create'])->middleware('admin:admin')->name('products.create');
    Route::post('/products', [AdminProductController::class, 'store'])->middleware('admin:admin')->name('products.store');
    Route::get('/products/{product}/edit', [AdminProductController::class, 'edit'])->middleware('admin:admin')->name('products.edit');
    Route::patch('/products/{product}', [AdminProductController::class, 'update'])->middleware('admin:admin')->name('products.update');
    Route::delete('/products/{product}', [AdminProductController::class, 'destroy'])->middleware('admin:admin')->name('products.destroy');
    Route::post('/products/{product}/stock', [AdminProductController::class, 'adjustStock'])->name('products.stock');
    Route::post('/products/{product}/images', [AdminProductController::class, 'storeImage'])->middleware('admin:admin')->name('products.images');

    Route::get('/customers', [CustomerController::class, 'index'])->name('customers.index');
    Route::get('/customers/{customer}', [CustomerController::class, 'show'])->name('customers.show');
});

Route::middleware(['auth', 'admin:admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/coupons', [CouponController::class, 'index'])->name('coupons.index');
    Route::post('/coupons', [CouponController::class, 'store'])->name('coupons.store');
    Route::get('/areas', [DeliveryAreaController::class, 'index'])->name('areas.index');
    Route::post('/areas', [DeliveryAreaController::class, 'store'])->name('areas.store');
    Route::delete('/areas/{area}', [DeliveryAreaController::class, 'destroy'])->name('areas.destroy');
    Route::get('/settings', [SettingController::class, 'edit'])->name('settings.edit');
    Route::patch('/settings', [SettingController::class, 'update'])->name('settings.update');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
