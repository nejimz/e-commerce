import StoreLayout from '@/layouts/store-layout';
import { EmptyState } from '@/components/empty-state';
import { formatMoney } from '@/components/product-card';
import { Link, router, useForm } from '@inertiajs/react';
import { useEffect, useRef } from 'react';

export default function CartPage({ cart }: { cart: { items: any[]; totals: any } }) {
    const coupon = useForm({ code: '' });
    const area = useForm({ province: 'Metro Manila', city: '', postal_code: '' });
    const timers = useRef<Record<number, number>>({});

    useEffect(() => () => Object.values(timers.current).forEach((t) => window.clearTimeout(t)), []);

    const setQty = (id: number, quantity: number) => {
        window.clearTimeout(timers.current[id]);
        timers.current[id] = window.setTimeout(() => {
            router.patch(`/cart/${id}`, { quantity }, { preserveScroll: true });
        }, 300);
    };

    return (
        <StoreLayout title="Cart">
            <h1 className="text-3xl font-semibold">Your cart</h1>
            {cart.items.length === 0 ? (
                <div className="mt-6">
                    <EmptyState title="Your cart is empty" body="Browse the shop and add something you like.">
                        <Link href="/shop" className="inline-flex h-11 items-center rounded-md bg-[var(--shop-accent)] px-4 text-[var(--shop-on-accent)]">
                            Continue shopping
                        </Link>
                    </EmptyState>
                </div>
            ) : (
                <div className="mt-6 grid gap-8 md:grid-cols-[1fr_320px]">
                    <div className="space-y-4">
                        {cart.items.map((item) => (
                            <div key={item.id} className="flex gap-4 rounded-[10px] bg-[var(--shop-surface)] p-4">
                                {item.image && <img src={item.image} alt="" className="h-20 w-20 rounded object-cover" />}
                                <div className="flex-1">
                                    <Link href={`/products/${item.slug}`} className="font-medium">
                                        {item.name}
                                    </Link>
                                    {item.options && <p className="text-sm text-[var(--shop-text-muted)]">{item.options}</p>}
                                    <p className="tabular-nums">{formatMoney(item.unit_price)}</p>
                                    <div className="mt-2 flex items-center gap-2">
                                        <input
                                            type="number"
                                            min={1}
                                            max={item.stock}
                                            defaultValue={item.quantity}
                                            className="h-10 w-20 rounded-md border border-[var(--shop-border)] px-2"
                                            onChange={(e) => setQty(item.id, Number(e.target.value))}
                                        />
                                        <button type="button" className="text-sm text-[var(--shop-danger)]" onClick={() => router.delete(`/cart/${item.id}`)}>
                                            Remove
                                        </button>
                                    </div>
                                </div>
                                <div className="tabular-nums">{formatMoney(item.line_total)}</div>
                            </div>
                        ))}
                    </div>
                    <aside className="h-fit space-y-4 rounded-[10px] bg-[var(--shop-surface)] p-4">
                        <h2 className="font-medium">Summary</h2>
                        <Row label="Subtotal" value={cart.totals.subtotal} />
                        {cart.totals.discount > 0 && <Row label="Discount" value={-cart.totals.discount} />}
                        <Row label="Delivery" value={cart.totals.delivery_fee} />
                        {cart.totals.packing_fee > 0 && <Row label="Packing" value={cart.totals.packing_fee} />}
                        <Row label="Total" value={cart.totals.total} bold />
                        {cart.totals.vat_amount > 0 && <p className="text-xs text-[var(--shop-text-muted)]">Includes VAT of {formatMoney(cart.totals.vat_amount)}</p>}
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                coupon.post('/cart/coupon');
                            }}
                            className="flex gap-2"
                        >
                            <input value={coupon.data.code} onChange={(e) => coupon.setData('code', e.target.value)} placeholder="Promo code" className="h-11 flex-1 rounded-md border border-[var(--shop-border)] px-3" />
                            <button className="h-11 rounded-md border border-[var(--shop-border)] px-3" type="submit">
                                Apply
                            </button>
                        </form>
                        {cart.totals.coupon_code && (
                            <button type="button" className="text-sm underline" onClick={() => router.delete('/cart/coupon')}>
                                Remove {cart.totals.coupon_code}
                            </button>
                        )}
                        {coupon.errors.coupon && <p className="text-sm text-[var(--shop-danger)]">{coupon.errors.coupon}</p>}
                        <Link href="/checkout" className="flex h-12 items-center justify-center rounded-md bg-[var(--shop-accent)] font-medium text-[var(--shop-on-accent)]">
                            Checkout
                        </Link>
                        <form
                            className="space-y-2 border-t border-[var(--shop-border)] pt-4"
                            onSubmit={(e) => {
                                e.preventDefault();
                                area.post('/deliverable');
                            }}
                        >
                            <p className="text-sm font-medium">Check if we deliver</p>
                            <input value={area.data.province} onChange={(e) => area.setData('province', e.target.value)} className="h-11 w-full rounded-md border border-[var(--shop-border)] px-3" />
                            <input value={area.data.city} onChange={(e) => area.setData('city', e.target.value)} placeholder="City" className="h-11 w-full rounded-md border border-[var(--shop-border)] px-3" />
                            <button className="h-11 w-full rounded-md border border-[var(--shop-border)]" type="submit">
                                Check area
                            </button>
                            {area.errors.area && <p className="text-sm text-[var(--shop-danger)]">{area.errors.area}</p>}
                        </form>
                    </aside>
                </div>
            )}
        </StoreLayout>
    );
}

function Row({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
    return (
        <div className={`flex justify-between tabular-nums ${bold ? 'font-semibold' : ''}`}>
            <span>{label}</span>
            <span>{formatMoney(value)}</span>
        </div>
    );
}
