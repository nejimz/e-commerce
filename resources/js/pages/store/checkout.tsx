import CheckoutLayout from '@/layouts/checkout-layout';
import { ShopButton } from '@/components/store/shop-button';
import { ShopCheckbox, ShopInput, ShopLabel, ShopRadio, ShopTextarea } from '@/components/store/shop-input';
import { formatMoney } from '@/lib/money';
import type { CartPayload } from '@/types/cart';
import { Link, router, useForm, usePage } from '@inertiajs/react';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

type Address = {
    id: number;
    recipient_name?: string;
    phone?: string;
    line1: string;
    line2?: string | null;
    barangay?: string | null;
    city: string;
    province: string;
    postal_code: string;
};

const STEPS = ['Contact', 'Delivery', 'Payment', 'Review'] as const;

export default function Checkout({
    cart,
    addresses,
    idempotency_key,
    cod_maximum,
    gateway,
}: {
    cart: CartPayload;
    addresses: Address[];
    idempotency_key: string;
    cod_maximum: number;
    gateway: string;
}) {
    const auth = usePage().props.auth as { user: { name?: string; email?: string; phone?: string } | null };
    const [step, setStep] = useState(0);
    const [summaryOpen, setSummaryOpen] = useState(false);
    const [selectedAddress, setSelectedAddress] = useState<number | null>(null);
    const [areaMessage, setAreaMessage] = useState<{ ok: boolean; text: string } | null>(null);
    const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
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
        payment_method: Number(cod_maximum) > 0 && cart.totals.total > Number(cod_maximum) && gateway === 'paymongo' ? 'paymongo' : 'cod',
        terms: false,
        idempotency_key,
        save_address: false,
    });

    const total = cart.totals.total;
    const hideCod = Number(cod_maximum) > 0 && total > Number(cod_maximum);
    const paymongoOn = gateway === 'paymongo';

    const contactOk = () => {
        const errors: Record<string, string> = {};
        if (form.data.name.trim().length < 2) {
            errors.name = 'Enter your full name.';
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.data.email)) {
            errors.email = 'Enter a valid email.';
        }
        if (!/^(09\d{9}|\+639\d{9})$/.test(form.data.phone)) {
            errors.phone = 'Use 09XXXXXXXXX or +639XXXXXXXXX.';
        }

        return errors;
    };

    const deliveryOk = () => {
        const errors: Record<string, string> = {};
        if (!form.data.line1.trim()) {
            errors.line1 = 'Enter your street address.';
        }
        if (!form.data.city.trim()) {
            errors.city = 'Enter your city.';
        }
        if (!form.data.province.trim()) {
            errors.province = 'Enter your province.';
        }
        if (!/^\d{4}$/.test(form.data.postal_code)) {
            errors.postal_code = 'Postal code must be 4 digits.';
        }

        return errors;
    };

    const paymentOk = () => {
        if (hideCod && !paymongoOn) {
            return { payment_method: 'No payment method is available for this total.' };
        }
        if (!form.data.payment_method) {
            return { payment_method: 'Choose a payment method.' };
        }

        return {};
    };

    const canOpen = (next: number) => {
        if (next <= step) {
            return true;
        }
        if (next >= 1 && Object.keys(contactOk()).length) {
            return false;
        }
        if (next >= 2 && Object.keys(deliveryOk()).length) {
            return false;
        }
        if (next >= 3 && Object.keys(paymentOk()).length) {
            return false;
        }

        return true;
    };

    const goTo = (next: number) => {
        if (!canOpen(next)) {
            return;
        }
        setStepErrors({});
        setStep(next);
    };

    const advance = (from: number) => {
        const check = from === 0 ? contactOk() : from === 1 ? deliveryOk() : paymentOk();
        if (Object.keys(check).length) {
            setStepErrors(check);

            return;
        }
        setStepErrors({});
        setStep(from + 1);
    };

    const fillAddress = (a: Address) => {
        setSelectedAddress(a.id);
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
        refreshFees(a.province, a.city, a.postal_code);
        checkArea(a.province, a.city, a.postal_code);
    };

    const refreshFees = (province = form.data.province, city = form.data.city, postal_code = form.data.postal_code) => {
        if (!province.trim() || !city.trim()) {
            return;
        }
        router.reload({
            only: ['cart'],
            data: { province, city, postal_code },
            preserveUrl: true,
        });
    };

    const checkArea = (province = form.data.province, city = form.data.city, postal_code = form.data.postal_code) => {
        if (!province.trim() || !city.trim()) {
            return;
        }
        router.post(
            '/deliverable',
            { province, city, postal_code },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: (page) => {
                    const flash = (page.props as { flash?: { success?: string } }).flash;
                    setAreaMessage({ ok: true, text: flash?.success || 'We deliver to this area.' });
                },
                onError: (errors) => {
                    setAreaMessage({ ok: false, text: String(errors.area || 'We do not deliver to this area.') });
                },
            },
        );
    };

    const onAddressBlur = () => {
        refreshFees();
        checkArea();
    };

    const summary = <OrderSummary cart={cart} />;

    return (
        <CheckoutLayout title="Checkout">
            {form.errors.checkout && <p className="mb-6 text-sm text-[var(--shop-danger)]">{form.errors.checkout}</p>}

            <button
                type="button"
                className="mb-6 flex w-full items-center justify-between rounded-[var(--shop-radius-card)] bg-[var(--shop-surface)] px-4 py-3 text-left lg:hidden"
                onClick={() => setSummaryOpen((v) => !v)}
                aria-expanded={summaryOpen}
            >
                <span className="text-sm">
                    {summaryOpen ? 'Hide' : 'Show'} order summary — <span className="font-semibold tabular-nums">{formatMoney(total)}</span>
                </span>
                <ChevronDown className={`h-4 w-4 transition-transform ${summaryOpen ? 'rotate-180' : ''}`} />
            </button>
            {summaryOpen && <div className="mb-6 rounded-[var(--shop-radius-card)] bg-[var(--shop-surface)] p-5 lg:hidden">{summary}</div>}

            <ol className="mb-6 flex flex-wrap items-center gap-1 text-sm">
                {STEPS.map((label, i) => (
                    <li key={label} className="flex items-center gap-1">
                        {i > 0 && <span className="mx-1 text-[var(--shop-text-dim)]">/</span>}
                        <button
                            type="button"
                            onClick={() => goTo(i)}
                            disabled={!canOpen(i)}
                            className={`disabled:cursor-not-allowed disabled:opacity-40 ${
                                step === i ? 'font-medium text-[var(--shop-text)]' : 'text-[var(--shop-text-muted)] hover:text-[var(--shop-text)]'
                            }`}
                        >
                            {i + 1}. {label}
                        </button>
                    </li>
                ))}
            </ol>

            <div className="grid gap-10 lg:grid-cols-[1fr_340px]">
                <div className="space-y-3">
                    <Accordion title="1. Contact" open={step === 0} onOpen={() => goTo(0)}>
                        <Field label="Name" error={stepErrors.name || form.errors.name}>
                            <ShopInput value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} autoComplete="name" />
                        </Field>
                        <Field label="Email" error={stepErrors.email || form.errors.email}>
                            <ShopInput type="email" value={form.data.email} onChange={(e) => form.setData('email', e.target.value)} autoComplete="email" />
                        </Field>
                        <Field label="Phone" error={stepErrors.phone || form.errors.phone}>
                            <ShopInput value={form.data.phone} onChange={(e) => form.setData('phone', e.target.value)} placeholder="09XXXXXXXXX" autoComplete="tel" />
                        </Field>
                        <ShopButton type="button" className="mt-2" onClick={() => advance(0)}>
                            Continue
                        </ShopButton>
                    </Accordion>

                    <Accordion title="2. Delivery" open={step === 1} onOpen={() => goTo(1)}>
                        {addresses.length > 0 && (
                            <div className="mb-1 space-y-2">
                                {addresses.map((a) => (
                                    <button
                                        key={a.id}
                                        type="button"
                                        className={`block w-full rounded-[var(--shop-radius-control)] border p-3 text-left text-sm ${
                                            selectedAddress === a.id
                                                ? 'border-[var(--shop-text)] bg-[var(--shop-bg)]'
                                                : 'border-[var(--shop-border)] hover:border-[var(--shop-text-dim)]'
                                        }`}
                                        onClick={() => fillAddress(a)}
                                    >
                                        {a.line1}, {a.city}
                                    </button>
                                ))}
                            </div>
                        )}
                        <Field label="Address" error={stepErrors.line1 || form.errors.line1}>
                            <ShopInput value={form.data.line1} onChange={(e) => form.setData('line1', e.target.value)} autoComplete="address-line1" />
                        </Field>
                        <Field label="Apartment, suite (optional)" error={form.errors.line2}>
                            <ShopInput value={form.data.line2} onChange={(e) => form.setData('line2', e.target.value)} autoComplete="address-line2" />
                        </Field>
                        <Field label="Barangay (optional)" error={form.errors.barangay}>
                            <ShopInput value={form.data.barangay} onChange={(e) => form.setData('barangay', e.target.value)} />
                        </Field>
                        <Field label="City" error={stepErrors.city || form.errors.city}>
                            <ShopInput value={form.data.city} onChange={(e) => form.setData('city', e.target.value)} onBlur={onAddressBlur} autoComplete="address-level2" />
                        </Field>
                        <Field label="Province" error={stepErrors.province || form.errors.province}>
                            <ShopInput value={form.data.province} onChange={(e) => form.setData('province', e.target.value)} onBlur={onAddressBlur} autoComplete="address-level1" />
                        </Field>
                        <Field label="Postal code" error={stepErrors.postal_code || form.errors.postal_code}>
                            <ShopInput value={form.data.postal_code} onChange={(e) => form.setData('postal_code', e.target.value)} onBlur={onAddressBlur} autoComplete="postal-code" />
                        </Field>
                        <Field label="Delivery notes (optional)" error={form.errors.notes}>
                            <ShopTextarea value={form.data.notes} onChange={(e) => form.setData('notes', e.target.value)} />
                        </Field>
                        {areaMessage && (
                            <p className={`text-sm ${areaMessage.ok ? 'text-[var(--shop-success)]' : 'text-[var(--shop-danger)]'}`}>
                                {areaMessage.text}
                            </p>
                        )}
                        <p className="text-sm text-[var(--shop-text-muted)]">We confirm deliverability when you enter city and postal code.</p>
                        {auth.user && (
                            <label className="flex min-h-11 items-center gap-2.5 text-sm">
                                <ShopCheckbox checked={form.data.save_address} onChange={(e) => form.setData('save_address', e.target.checked)} />
                                Save this address
                            </label>
                        )}
                        <ShopButton type="button" className="mt-2" onClick={() => advance(1)}>
                            Continue
                        </ShopButton>
                    </Accordion>

                    <Accordion title="3. Payment" open={step === 2} onOpen={() => goTo(2)}>
                        <div className="space-y-2">
                            {!hideCod && (
                                <label
                                    className={`flex min-h-11 items-center gap-3 rounded-[var(--shop-radius-control)] border px-3 ${
                                        form.data.payment_method === 'cod' ? 'border-[var(--shop-text)] bg-[var(--shop-bg)]' : 'border-[var(--shop-border)]'
                                    }`}
                                >
                                    <ShopRadio name="pm" checked={form.data.payment_method === 'cod'} onChange={() => form.setData('payment_method', 'cod')} />
                                    Cash on delivery
                                </label>
                            )}
                            {hideCod && (
                                <p className="text-sm text-[var(--shop-text-muted)]">
                                    Cash on delivery is not available above {formatMoney(cod_maximum)}.
                                </p>
                            )}
                            {paymongoOn && (
                                <label
                                    className={`flex min-h-11 items-center gap-3 rounded-[var(--shop-radius-control)] border px-3 ${
                                        form.data.payment_method === 'paymongo' ? 'border-[var(--shop-text)] bg-[var(--shop-bg)]' : 'border-[var(--shop-border)]'
                                    }`}
                                >
                                    <ShopRadio
                                        name="pm"
                                        checked={form.data.payment_method === 'paymongo'}
                                        onChange={() => form.setData('payment_method', 'paymongo')}
                                    />
                                    Pay online (PayMongo)
                                </label>
                            )}
                            {!paymongoOn && hideCod && (
                                <p className="text-sm text-[var(--shop-danger)]">No payment method is available for this total. Reduce your cart or contact us.</p>
                            )}
                            {(stepErrors.payment_method || form.errors.payment_method) && (
                                <p className="text-sm text-[var(--shop-danger)]">{stepErrors.payment_method || form.errors.payment_method}</p>
                            )}
                        </div>
                        <ShopButton type="button" className="mt-2" onClick={() => advance(2)}>
                            Review order
                        </ShopButton>
                    </Accordion>

                    <Accordion title="4. Review" open={step === 3} onOpen={() => goTo(3)}>
                        <ul className="space-y-2 text-sm">
                            {cart.items.map((i) => (
                                <li key={i.id} className="flex justify-between gap-3">
                                    <span>
                                        {i.name} × {i.quantity}
                                    </span>
                                    <span className="tabular-nums">{formatMoney(i.line_total)}</span>
                                </li>
                            ))}
                        </ul>
                        <p className="mt-4 shop-price">{formatMoney(total)}</p>
                        <Field label="Gift message (optional)" error={form.errors.gift_message}>
                            <ShopInput value={form.data.gift_message} onChange={(e) => form.setData('gift_message', e.target.value)} />
                        </Field>
                        <label className="flex min-h-11 items-center gap-2.5 text-sm">
                            <ShopCheckbox checked={form.data.hide_prices} onChange={(e) => form.setData('hide_prices', e.target.checked)} />
                            Hide prices on packing slip
                        </label>
                        <label className="flex items-start gap-2.5 text-sm">
                            <ShopCheckbox className="mt-1" checked={form.data.terms} onChange={(e) => form.setData('terms', e.target.checked)} />
                            <span>
                                I accept the{' '}
                                <Link href="/p/terms" className="underline underline-offset-2 hover:text-[var(--shop-text)]">
                                    Terms of Sale
                                </Link>
                            </span>
                        </label>
                        {form.errors.terms && <p className="text-sm text-[var(--shop-danger)]">{form.errors.terms}</p>}
                        <ShopButton type="button" size="lg" className="mt-4" disabled={form.processing} onClick={() => form.post('/checkout')}>
                            {form.processing ? 'Placing order…' : `Place order · ${formatMoney(total)}`}
                        </ShopButton>
                    </Accordion>
                </div>
                <aside className="hidden h-fit rounded-[var(--shop-radius-card)] bg-[var(--shop-surface)] p-6 lg:sticky lg:top-8 lg:block">{summary}</aside>
            </div>
        </CheckoutLayout>
    );
}

function OrderSummary({ cart }: { cart: CartPayload }) {
    return (
        <>
            <p className="shop-caption uppercase tracking-[0.14em]">Order summary</p>
            <ul className="mt-4 space-y-3 text-sm">
                {cart.items.map((i) => (
                    <li key={i.id} className="flex justify-between gap-3 text-[var(--shop-text-muted)]">
                        <span>
                            {i.name} × {i.quantity}
                        </span>
                        <span className="tabular-nums">{formatMoney(i.line_total)}</span>
                    </li>
                ))}
            </ul>
            <div className="mt-5 space-y-2 border-t border-[var(--shop-border)] pt-4 text-sm">
                <div className="flex justify-between text-[var(--shop-text-muted)]">
                    <span>Subtotal</span>
                    <span className="tabular-nums">{formatMoney(cart.totals.subtotal)}</span>
                </div>
                {cart.totals.discount > 0 && (
                    <div className="flex justify-between text-[var(--shop-text-muted)]">
                        <span>Discount</span>
                        <span className="tabular-nums">{formatMoney(-cart.totals.discount)}</span>
                    </div>
                )}
                <div className="flex justify-between text-[var(--shop-text-muted)]">
                    <span>Delivery</span>
                    <span className="tabular-nums">{formatMoney(cart.totals.delivery_fee)}</span>
                </div>
                {cart.totals.packing_fee > 0 && (
                    <div className="flex justify-between text-[var(--shop-text-muted)]">
                        <span>Packing</span>
                        <span className="tabular-nums">{formatMoney(cart.totals.packing_fee)}</span>
                    </div>
                )}
                <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span className="tabular-nums">{formatMoney(cart.totals.total)}</span>
                </div>
            </div>
        </>
    );
}

function Accordion({ title, open, onOpen, children }: { title: string; open: boolean; onOpen: () => void; children: React.ReactNode }) {
    return (
        <section className="rounded-[var(--shop-radius-card)] bg-[var(--shop-surface)] p-5">
            <button type="button" className="flex w-full items-center justify-between text-left font-medium" onClick={onOpen}>
                {title}
                <ChevronDown className={`h-4 w-4 text-[var(--shop-text-muted)] transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && <div className="mt-4 space-y-3">{children}</div>}
        </section>
    );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
    return (
        <div>
            <ShopLabel>{label}</ShopLabel>
            {children}
            {error && <p className="mt-1 text-sm text-[var(--shop-danger)]">{error}</p>}
        </div>
    );
}
