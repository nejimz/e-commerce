<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\DeliveryArea;
use App\Support\Countries;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class DeliveryAreaController extends Controller
{
    public function index()
    {
        return Inertia::render('admin/areas/index', [
            'areas' => DeliveryArea::query()
                ->orderBy('country_code')
                ->orderBy('province')
                ->orderBy('city')
                ->get()
                ->map(fn (DeliveryArea $area) => [
                    ...$area->toArray(),
                    'display_name' => $area->displayName(),
                    'country_name' => Countries::name($area->country_code),
                ]),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'country_code' => ['required', 'string', 'size:2', Rule::in(array_keys(Countries::all()))],
            'province' => 'nullable|string|max:100',
            'city' => 'nullable|string|max:100',
            'barangay' => 'nullable|string|max:100',
            'postal_code' => 'nullable|string|max:16',
            'mode' => 'required|in:allow,block',
            'delivery_fee' => 'required|numeric|min:0',
            'free_shipping_eligible' => 'boolean',
            'same_day_eligible' => 'boolean',
            'is_active' => 'boolean',
        ]);

        $data['country_code'] = Countries::normalize($data['country_code']);
        $data['province'] = filled($data['province'] ?? null) ? $data['province'] : null;
        $data['city'] = filled($data['city'] ?? null) ? $data['city'] : null;

        if (Countries::isDomestic($data['country_code'])) {
            $request->validate([
                'province' => 'required|string|max:100',
                'city' => 'required|string|max:100',
            ]);
        } else {
            $data['same_day_eligible'] = false;
        }

        DeliveryArea::query()->create($data);

        return back()->with('success', 'Shipping zone saved.');
    }

    public function destroy(DeliveryArea $area)
    {
        $area->delete();

        return back()->with('success', 'Shipping zone removed.');
    }
}
