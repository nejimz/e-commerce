import CheckoutLayout from '@/layouts/checkout-layout';
import { formatMoney } from '@/components/product-card';
import { useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function Checkout({
    cart,
    addresses,
    idempotency_key,
    cod_maximum,
    gateway,
}: {
    cart: { items: any[]; totals: any };
    addresses: any[];
    idempotency_key: string;
    cod_maximum: number;
    gateway: string;
}) {
    const auth = usePage().props.auth as { user: any };
    const [step, setStep] = useState(0);
    const form = useForm({
        name: auth.user?.name || '',
        email: auth.user?.email || '',
        phone: auth.user?.phone || '',
        line1: '',
        line2: '',
        barangay: '',
        city: '',
        province: 'Metro Manila',
        postal_code: '',
        notes: '',
        gift_message: '',
        hide_prices: false,
        payment_method: 'cod',
        terms: false,
        idempotency_key,
        save_address: false,
    });

    const total = cart.totals.total;
    const hideCod = Number(cod_maximum) > 0 && total > Number(cod_maximum);
    const paymongoOn = gateway === 'paymongo';

    const fillAddress = (a: any) => {
        form.setData({
            ...form.data,
            name: a.recipient_name || form.data.name,
            phone: a.phone || form.data.phone,
            line1: a.line1,
            line2: a.line2 || '',
            barangay: a.barangay || '',
            city: a.city,
            province: a.province,
            postal_code: a.postal_code,
        });
    };

    return (
        <CheckoutLayout title="Checkout">
            {form.errors.checkout && <p className="mb-4 text-sm text-[var(--shop-danger)]">{form.errors.checkout}</p>}
            <div className="space-y-4">
                <Accordion title="1. Contact" open={step === 0} onOpen={() => setStep(0)}>
                    <Field label="Name" error={form.errors.name}>
                        <input className="input" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} />
                    </Field>
                    <Field label="Email" error={form.errors.email}>
                        <input className="input" type="email" value={form.data.email} onChange={(e) => form.setData('email', e.target.value)} />
                    </Field>
                    <Field label="Phone" error={form.errors.phone}>
                        <input className="input" value={form.data.phone} onChange={(e) => form.setData('phone', e.target.value)} placeholder="09XXXXXXXXX" />
                    </Field>
                    <button type="button" className="btn-primary mt-2" onClick={() => setStep(1)}>
                        Continue
                    </button>
                </Accordion>
                <Accordion title="2. Delivery" open={step === 1} onOpen={() => setStep(1)}>
                    {addresses.length > 0 && (
                        <div className="mb-3 space-y-2">
                            {addresses.map((a) => (
                                <button key={a.id} type="button" className="block w-full rounded-md border border-[var(--shop-border)] p-3 text-left text-sm" onClick={() => fillAddress(a)}>
                                    {a.line1}, {a.city}
                                </button>
                            ))}
                        </div>
                    )}
                    <Field label="Address" error={form.errors.line1}>
                        <input className="input" value={form.data.line1} onChange={(e) => form.setData('line1', e.target.value)} />
                    </Field>
                    <Field label="City" error={form.errors.city}>
                        <input className="input" value={form.data.city} onChange={(e) => form.setData('city', e.target.value)} />
                    </Field>
                    <Field label="Province" error={form.errors.province}>
                        <input className="input" value={form.data.province} onChange={(e) => form.setData('province', e.target.value)} />
                    </Field>
                    <Field label="Postal code" error={form.errors.postal_code}>
                        <input className="input" value={form.data.postal_code} onChange={(e) => form.setData('postal_code', e.target.value)} />
                    </Field>
                    {auth.user && (
                        <label className="flex items-center gap-2 text-sm">
                            <input type="checkbox" checked={form.data.save_address} onChange={(e) => form.setData('save_address', e.target.checked)} />
                            Save this address
                        </label>
                    )}
                    <button type="button" className="btn-primary mt-2" onClick={() => setStep(2)}>
                        Continue
                    </button>
                </Accordion>
                <Accordion title="3. Payment" open={step === 2} onOpen={() => setStep(2)}>
                    {!hideCod && (
                        <label className="flex items-center gap-2">
                            <input type="radio" name="pm" checked={form.data.payment_method === 'cod'} onChange={() => form.setData('payment_method', 'cod')} />
                            Cash on delivery
                        </label>
                    )}
                    {hideCod && <p className="text-sm text-[var(--shop-text-muted)]">Cash on delivery is not available above {formatMoney(cod_maximum)}.</p>}
                    {paymongoOn && (
                        <label className="mt-2 flex items-center gap-2">
                            <input type="radio" name="pm" checked={form.data.payment_method === 'paymongo'} onChange={() => form.setData('payment_method', 'paymongo')} />
                            Pay online (PayMongo)
                        </label>
                    )}
                    {!paymongoOn && hideCod && <p className="text-sm text-[var(--shop-danger)]">No payment method is available for this total. Reduce your cart or contact us.</p>}
                    <button type="button" className="btn-primary mt-2" onClick={() => setStep(3)}>
                        Review order
                    </button>
                </Accordion>
                <Accordion title="4. Review" open={step === 3} onOpen={() => setStep(3)}>
                    <ul className="space-y-1 text-sm">
                        {cart.items.map((i) => (
                            <li key={i.id} className="flex justify-between">
                                <span>
                                    {i.name} × {i.quantity}
                                </span>
                                <span className="tabular-nums">{formatMoney(i.line_total)}</span>
                            </li>
                        ))}
                    </ul>
                    <p className="mt-3 font-semibold tabular-nums">Total {formatMoney(total)}</p>
                    <label className="mt-4 flex items-start gap-2 text-sm">
                        <input type="checkbox" checked={form.data.terms} onChange={(e) => form.setData('terms', e.target.checked)} />
                        I accept the Terms of Sale
                    </label>
                    {form.errors.terms && <p className="text-sm text-[var(--shop-danger)]">{form.errors.terms}</p>}
                    <button
                        type="button"
                        disabled={form.processing}
                        className="btn-primary mt-4 w-full"
                        onClick={() => form.post('/checkout')}
                    >
                        {form.processing ? 'Placing order…' : 'Place order'}
                    </button>
                </Accordion>
            </div>
            <style>{`
                .input { height: 2.75rem; width: 100%; border-radius: 0.375rem; border: 1px solid var(--shop-border); padding: 0 0.75rem; background: var(--shop-surface); }
                .btn-primary { height: 2.75rem; border-radius: 0.375rem; background: var(--shop-accent); color: var(--shop-on-accent); padding: 0 1rem; font-weight: 500; }
            `}</style>
        </CheckoutLayout>
    );
}

function Accordion({ title, open, onOpen, children }: { title: string; open: boolean; onOpen: () => void; children: React.ReactNode }) {
    return (
        <section className="rounded-[10px] bg-[var(--shop-surface)] p-4">
            <button type="button" className="w-full text-left font-medium" onClick={onOpen}>
                {title}
            </button>
            {open && <div className="mt-3 space-y-3">{children}</div>}
        </section>
    );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
    return (
        <label className="block text-sm">
            <span className="font-medium">{label}</span>
            <div className="mt-1">{children}</div>
            {error && <span className="text-[var(--shop-danger)]">{error}</span>}
        </label>
    );
}
