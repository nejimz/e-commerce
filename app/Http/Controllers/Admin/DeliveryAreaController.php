<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\DeliveryArea;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DeliveryAreaController extends Controller
{
    public function index()
    {
        return Inertia::render('admin/areas/index', [
            'areas' => DeliveryArea::query()->orderBy('province')->orderBy('city')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'province' => 'required|string|max:100',
            'city' => 'required|string|max:100',
            'barangay' => 'nullable|string|max:100',
            'postal_code' => 'nullable|digits:4',
            'mode' => 'required|in:allow,block',
            'delivery_fee' => 'required|numeric|min:0',
            'same_day_eligible' => 'boolean',
            'is_active' => 'boolean',
        ]);
        DeliveryArea::query()->create($data);

        return back()->with('success', 'Area saved.');
    }

    public function destroy(DeliveryArea $area)
    {
        $area->delete();

        return back()->with('success', 'Area removed.');
    }
}
