import StoreLayout from '@/layouts/store-layout';
import { AccountNav } from '@/components/store/account-nav';
import { CountrySelect } from '@/components/store/country-select';
import { ShopButton } from '@/components/store/shop-button';
import { ShopInput, ShopLabel } from '@/components/store/shop-input';
import { router, useForm } from '@inertiajs/react';

type SavedAddress = {
    id: number;
    line1: string;
    city: string;
    country_code?: string | null;
};

export default function AccountProfile({
    user,
    addresses,
}: {
    user: { name: string; email: string; phone: string };
    addresses: SavedAddress[];
}) {
    const form = useForm({
        name: user.name,
        phone: user.phone || '',
        current_password: '',
        password: '',
        password_confirmation: '',
    });
    const address = useForm({
        recipient_name: user.name,
        phone: user.phone || '',
        line1: '',
        country_code: 'PH',
        city: '',
        province: 'Metro Manila',
        postal_code: '',
        is_default: true,
    });

    return (
        <StoreLayout title="Profile">
            <h1 className="shop-h1">Profile</h1>
            <AccountNav />
            <div className="grid gap-12 lg:grid-cols-2">
                <form
                    className="max-w-md space-y-4"
                    onSubmit={(e) => {
                        e.preventDefault();
                        form.patch('/account/profile');
                    }}
                >
                    <div>
                        <ShopLabel htmlFor="profile-name">Name</ShopLabel>
                        <ShopInput id="profile-name" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} />
                    </div>
                    <p className="text-sm text-[var(--shop-text-muted)]">{user.email}</p>
                    <div>
                        <ShopLabel htmlFor="profile-phone">Mobile</ShopLabel>
                        <ShopInput id="profile-phone" value={form.data.phone} onChange={(e) => form.setData('phone', e.target.value)} />
                    </div>
                    <div>
                        <ShopLabel htmlFor="profile-password">New password</ShopLabel>
                        <ShopInput
                            id="profile-password"
                            type="password"
                            placeholder="Optional"
                            value={form.data.password}
                            onChange={(e) => form.setData('password', e.target.value)}
                        />
                    </div>
                    <ShopButton type="submit">Save profile</ShopButton>
                </form>
                <div>
                    <h2 className="shop-h3">Addresses</h2>
                    <ul className="mt-4 space-y-2">
                        {addresses.map((a) => (
                            <li key={a.id} className="flex justify-between gap-4 rounded-[var(--shop-radius-card)] bg-[var(--shop-surface)] p-4 text-sm">
                                <span>
                                    {a.line1}, {a.city}
                                    {a.country_code && a.country_code !== 'PH' ? ` (${a.country_code})` : ''}
                                </span>
                                <button type="button" className="text-[var(--shop-danger)]" onClick={() => router.delete(`/account/addresses/${a.id}`)}>
                                    Remove
                                </button>
                            </li>
                        ))}
                    </ul>
                    <form
                        className="mt-6 max-w-md space-y-3"
                        onSubmit={(e) => {
                            e.preventDefault();
                            address.post('/account/addresses');
                        }}
                    >
                        <ShopInput placeholder="Street" value={address.data.line1} onChange={(e) => address.setData('line1', e.target.value)} />
                        <div>
                            <ShopLabel>Country</ShopLabel>
                            <CountrySelect value={address.data.country_code} onChange={(e) => address.setData('country_code', e.target.value)} />
                        </div>
                        <ShopInput placeholder="City" value={address.data.city} onChange={(e) => address.setData('city', e.target.value)} />
                        <ShopInput
                            placeholder={address.data.country_code === 'PH' ? 'Province' : 'State / region'}
                            value={address.data.province}
                            onChange={(e) => address.setData('province', e.target.value)}
                        />
                        <ShopInput placeholder="Postal / ZIP" value={address.data.postal_code} onChange={(e) => address.setData('postal_code', e.target.value)} />
                        <ShopButton variant="secondary" type="submit">
                            Add address
                        </ShopButton>
                    </form>
                </div>
            </div>
        </StoreLayout>
    );
}
