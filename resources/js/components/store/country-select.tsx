import { ShopSelect } from '@/components/store/shop-input';
import { usePage } from '@inertiajs/react';
import { type SelectHTMLAttributes } from 'react';

type PageCountries = { countries?: Record<string, string> };

export function CountrySelect({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
    const countries = usePage<PageCountries>().props.countries ?? {};

    return (
        <ShopSelect className={className} autoComplete="country" {...props}>
            {Object.entries(countries).map(([code, name]) => (
                <option key={code} value={code}>
                    {name}
                </option>
            ))}
        </ShopSelect>
    );
}
