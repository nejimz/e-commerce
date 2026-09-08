import StoreLayout from '@/layouts/store-layout';
import { EmptyState } from '@/components/empty-state';
import { QuantityStepper } from '@/components/store/quantity-stepper';
import { ShopBreadcrumb } from '@/components/store/shop-breadcrumb';
import { ShopButton } from '@/components/store/shop-button';
import { ShopInput } from '@/components/store/shop-input';
import { formatMoney } from '@/lib/money';
import { productImageSrc } from '@/lib/product-image';
import type { CartPayload } from '@/types/cart';
import { Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';

export default function CartPage({ cart }: { cart: CartPayload }) {
    const coupon = useForm({ code: '' });
    const [busyId, setBusyId] = useState<number | null>(null);
    const threshold = Number(cart.totals.free_delivery_threshold || 0);
    const remaining = threshold > 0 ? Math.max(0, threshold - Number(cart.totals.subtotal || 0)) : 0;
    const progress = threshold > 0 ? Math.min(100, (Number(cart.totals.subtotal || 0) / threshold) * 100) : 0;

    const patchQty = (id: number, quantity: number) => {
        setBusyId(id);
        router.patch(`/cart/${id}`, { quantity }, { preserveScroll: true, onFinish: () => setBusyId(null) });
    };

    const removeItem = (id: number) => {
        setBusyId(id);
        router.delete(`/cart/${id}`, { preserveScroll: true, onFinish: () => setBusyId(null) });
    };

    return (
        <StoreLayout title="Cart">
            <ShopBreadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Cart' }]} />
            <p className="shop-caption uppercase tracking-[0.16em] text-[var(--shop-text-muted)]">Bag</p>
            <h1 className="shop-h1 mt-2">Your cart</h1>
            {cart.items.length === 0 ? (
                <div className="mt-8">
                    <EmptyState title="Your cart is empty" body="Browse the shop and add something you like.">
                        <ShopButton asChild>
                            <Link href="/shop">Continue shopping</Link>
                        </ShopButton>
                    </EmptyState>
                </div>
            ) : (
                <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
                    <div className="divide-y divide-[var(--shop-border)] border-y border-[var(--shop-border)]">
                        {cart.items.map((item) => (
                            <div key={item.id} className="flex gap-4 py-5 md:gap-6">
                                <Link href={`/products/${item.slug}`} className="h-24 w-24 shrink-0 overflow-hidden rounded-[var(--shop-radius-image)] bg-[var(--shop-surface)] md:h-28 md:w-28">
                                    <img src={productImageSrc(item.image, item.slug)} alt={item.name} className="h-full w-full object-cover" />
                                </Link>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <Link href={`/products/${item.slug}`} className="font-medium hover:text-[var(--shop-accent)]">
                                                {item.name}
                                            </Link>
                                            {item.options && <p className="mt-0.5 text-sm text-[var(--shop-text-muted)]">{item.options}</p>}
                                            <p className="mt-1 shop-price text-base">{formatMoney(item.unit_price)}</p>
                                        </div>
                                        <p className="hidden shop-price text-base md:block">{formatMoney(item.line_total)}</p>
                                    </div>
                                    <div className="mt-3 flex flex-wrap items-center gap-4">
                                        <QuantityStepper
                                            value={item.quantity}
                                            max={item.stock}
                                            disabled={busyId === item.id}
                                            onChange={(qty) => patchQty(item.id, qty)}
                                        />
                                        <button
                                            type="button"
                                            className="text-sm text-[var(--shop-text-muted)] underline-offset-2 hover:text-[var(--shop-danger)] hover:underline disabled:opacity-45"
                                            disabled={busyId === item.id}
                                            onClick={() => removeItem(item.id)}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                    <p className="mt-2 shop-price text-base md:hidden">{formatMoney(item.line_total)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <aside className="h-fit space-y-5 rounded-[var(--shop-radius-card)] bg-[var(--shop-surface)] p-6 lg:sticky lg:top-24">
                        <h2 className="shop-h3">Summary</h2>
                        {threshold > 0 && (
                            <div>
                                <p className="text-sm text-[var(--shop-text-muted)]">
                                    {remaining > 0
                                        ? `${formatMoney(remaining)} away from free delivery`
                                        : 'You have free delivery on this order.'}
                                </p>
                                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--shop-bg)]">
                                    <div className="h-full rounded-full bg-[var(--shop-accent)]" style={{ width: `${progress}%` }} />
                                </div>
                            </div>
                        )}
                        <Row label="Subtotal" value={cart.totals.subtotal} />
                        {cart.totals.discount > 0 && <Row label="Discount" value={-cart.totals.discount} />}
                        <Row label="Delivery" value={cart.totals.delivery_fee} />
                        {cart.totals.packing_fee > 0 && <Row label="Packing" value={cart.totals.packing_fee} />}
                        <div className="border-t border-[var(--shop-border)] pt-3">
                            <Row label="Total" value={cart.totals.total} bold />
                        </div>
                        {cart.totals.vat_amount > 0 && (
                            <p className="text-xs text-[var(--shop-text-muted)]">Includes VAT of {formatMoney(cart.totals.vat_amount)}</p>
                        )}
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                coupon.post('/cart/coupon');
                            }}
                            className="flex gap-2"
                        >
                            <ShopInput
                                value={coupon.data.code}
                                onChange={(e) => coupon.setData('code', e.target.value)}
                                placeholder="Promo code"
                                disabled={coupon.processing}
                            />
                            <ShopButton type="submit" variant="secondary" disabled={coupon.processing}>
                                {coupon.processing ? 'Applying…' : 'Apply'}
                            </ShopButton>
                        </form>
                        {cart.totals.coupon_code && (
                            <button type="button" className="text-sm underline" onClick={() => router.delete('/cart/coupon')}>
                                Remove {cart.totals.coupon_code}
                            </button>
                        )}
                        {coupon.errors.coupon && <p className="text-sm text-[var(--shop-danger)]">{coupon.errors.coupon}</p>}
                        <ShopButton asChild size="lg">
                            <Link href="/checkout">Checkout</Link>
                        </ShopButton>
                        <p className="text-sm leading-relaxed text-[var(--shop-text-muted)]">
                            We deliver to serviceable Metro Manila addresses — confirmed at checkout.
                        </p>
                    </aside>
                </div>
            )}
        </StoreLayout>
    );
}

function Row({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
    return (
        <div className={`flex justify-between tabular-nums ${bold ? 'text-base font-semibold' : 'text-sm text-[var(--shop-text-muted)]'}`}>
            <span>{label}</span>
            <span className={bold ? 'text-[var(--shop-text)]' : undefined}>{formatMoney(value)}</span>
        </div>
    );
}
