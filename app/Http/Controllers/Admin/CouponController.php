<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CouponController extends Controller
{
    public function index()
    {
        return Inertia::render('admin/coupons/index', ['coupons' => Coupon::query()->latest()->get()]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'code' => 'required|string|min:3|max:30|unique:coupons,code',
            'type' => 'required|in:percentage,fixed,free_delivery',
            'value' => 'required|numeric|min:0',
            'minimum_purchase' => 'nullable|numeric|min:0',
            'starts_at' => 'nullable|date',
            'ends_at' => 'nullable|date|after:starts_at',
            'usage_limit' => 'nullable|integer|min:1',
            'per_customer_limit' => 'nullable|integer|min:1',
            'is_active' => 'boolean',
        ]);
        $data['code'] = strtoupper($data['code']);
        Coupon::query()->create($data);

        return back()->with('success', 'Coupon created.');
    }
}
