<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SettingController extends Controller
{
    public function edit()
    {
        $keys = [
            'store_name', 'announcement', 'store_paused', 'store_paused_message',
            'ordering_hours_enabled', 'ordering_hours_start', 'ordering_hours_end',
            'unlisted_area_default', 'default_delivery_fee', 'free_delivery_enabled',
            'free_delivery_threshold', 'packing_fee', 'vat_enabled', 'vat_rate', 'cod_maximum',
            'page_terms', 'page_privacy', 'page_shipping', 'page_returns', 'page_contact',
        ];
        $settings = [];
        foreach ($keys as $key) {
            $settings[$key] = Setting::get($key);
        }

        return Inertia::render('admin/settings', ['settings' => $settings]);
    }

    public function update(Request $request)
    {
        foreach ($request->except('_token', '_method') as $key => $value) {
            if (is_array($value)) {
                continue;
            }
            Setting::put($key, $value ?? '');
        }

        return back()->with('success', 'Settings saved.');
    }
}
