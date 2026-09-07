import StoreLayout from '@/layouts/store-layout';
import { Link, router, useForm } from '@inertiajs/react';

export default function AccountProfile({ user, addresses }: { user: { name: string; email: string; phone: string }; addresses: any[] }) {
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
        city: '',
        province: 'Metro Manila',
        postal_code: '',
        is_default: true,
    });

    return (
        <StoreLayout title="Profile">
            <h1 className="text-3xl font-semibold">Profile</h1>
            <div className="mt-4 flex gap-4 text-sm">
                <Link href="/account/orders">Orders</Link>
                <Link href="/account/profile">Profile</Link>
            </div>
            <form
                className="mt-6 max-w-md space-y-3"
                onSubmit={(e) => {
                    e.preventDefault();
                    form.patch('/account/profile');
                }}
            >
                <input className="h-11 w-full rounded-md border border-[var(--shop-border)] px-3" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} />
                <p className="text-sm text-[var(--shop-text-muted)]">{user.email}</p>
                <input className="h-11 w-full rounded-md border border-[var(--shop-border)] px-3" value={form.data.phone} onChange={(e) => form.setData('phone', e.target.value)} />
                <input type="password" placeholder="New password (optional)" className="h-11 w-full rounded-md border border-[var(--shop-border)] px-3" value={form.data.password} onChange={(e) => form.setData('password', e.target.value)} />
                <button className="h-11 rounded-md bg-[var(--shop-accent)] px-4 text-[var(--shop-on-accent)]" type="submit">
                    Save profile
                </button>
            </form>
            <h2 className="mt-10 text-xl font-medium">Addresses</h2>
            <ul className="mt-3 space-y-2">
                {addresses.map((a) => (
                    <li key={a.id} className="flex justify-between rounded-[10px] bg-[var(--shop-surface)] p-4 text-sm">
                        <span>
                            {a.line1}, {a.city}
                        </span>
                        <button type="button" className="text-[var(--shop-danger)]" onClick={() => router.delete(`/account/addresses/${a.id}`)}>
                            Remove
                        </button>
                    </li>
                ))}
            </ul>
            <form
                className="mt-4 max-w-md space-y-2"
                onSubmit={(e) => {
                    e.preventDefault();
                    address.post('/account/addresses');
                }}
            >
                <input className="h-11 w-full rounded-md border border-[var(--shop-border)] px-3" placeholder="Street" value={address.data.line1} onChange={(e) => address.setData('line1', e.target.value)} />
                <input className="h-11 w-full rounded-md border border-[var(--shop-border)] px-3" placeholder="City" value={address.data.city} onChange={(e) => address.setData('city', e.target.value)} />
                <input className="h-11 w-full rounded-md border border-[var(--shop-border)] px-3" placeholder="Postal" value={address.data.postal_code} onChange={(e) => address.setData('postal_code', e.target.value)} />
                <button className="h-11 rounded-md border border-[var(--shop-border)] px-4" type="submit">
                    Add address
                </button>
            </form>
        </StoreLayout>
    );
}
