<?php

namespace App\Support;

use Illuminate\Validation\Rule;

class ShippingAddress
{
    public const PHONE = '/^(09\d{9}|\+639\d{9}|\+[1-9]\d{7,14})$/';

    /**
     * @return array<string, mixed>
     */
    public static function rules(?string $countryCode = null): array
    {
        $country = Countries::normalize($countryCode);
        $domestic = Countries::isDomestic($country);

        return [
            'country_code' => ['required', 'string', 'size:2', Rule::in(array_keys(Countries::all()))],
            'line1' => ['required', 'string', 'max:200'],
            'line2' => ['nullable', 'string', 'max:200'],
            'barangay' => ['nullable', 'string', 'max:100'],
            'city' => ['required', 'string', 'max:100'],
            'province' => $domestic
                ? ['required', 'string', 'max:100']
                : ['nullable', 'string', 'max:100'],
            'postal_code' => $domestic
                ? ['required', 'digits:4']
                : ['required', 'string', 'min:2', 'max:16', 'regex:/^[A-Za-z0-9][A-Za-z0-9\s\-]{1,15}$/'],
        ];
    }
}
