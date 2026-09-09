<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use App\Models\Address;
use App\Models\Order;
use App\Support\Countries;
use App\Support\ShippingAddress;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AccountController extends Controller
{
    public function orders(Request $request)
    {
        $orders = Order::query()->where('user_id', $request->user()->id)->latest()->paginate(10);

        return Inertia::render('store/account-orders', ['orders' => $orders]);
    }

    public function profile(Request $request)
    {
        return Inertia::render('store/account-profile', [
            'user' => $request->user()->only(['name', 'email', 'phone']),
            'addresses' => $request->user()->addresses,
        ]);
    }

    public function updateProfile(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|min:2|max:100',
            'phone' => ['required', 'regex:'.ShippingAddress::PHONE],
            'current_password' => 'nullable|current_password',
            'password' => 'nullable|confirmed|min:8',
        ]);
        $user = $request->user();
        $user->name = $data['name'];
        $user->phone = $data['phone'];
        if (! empty($data['password'])) {
            $request->validate(['current_password' => 'required']);
            $user->password = $data['password'];
            $request->session()->invalidate();
            $request->session()->regenerate();
        }
        $user->save();

        return back()->with('success', 'Profile updated.');
    }

    public function storeAddress(Request $request)
    {
        $request->merge([
            'country_code' => Countries::normalize($request->input('country_code')),
        ]);
        $data = $request->validate(array_merge(ShippingAddress::rules($request->input('country_code')), [
            'label' => 'nullable|string|max:50',
            'recipient_name' => 'required|string|max:100',
            'phone' => ['required', 'regex:'.ShippingAddress::PHONE],
            'is_default' => 'boolean',
        ]));
        $data['user_id'] = $request->user()->id;
        if ($request->boolean('is_default')) {
            $request->user()->addresses()->update(['is_default' => false]);
        }
        Address::query()->create($data);

        return back()->with('success', 'Address saved.');
    }

    public function destroyAddress(Request $request, Address $address)
    {
        abort_unless($address->user_id === $request->user()->id, 403);
        $address->delete();

        return back()->with('success', 'Address removed.');
    }
}
