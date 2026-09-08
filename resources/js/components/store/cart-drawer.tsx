import { QuantityStepper } from '@/components/store/quantity-stepper';
import { ShopButton } from '@/components/store/shop-button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { formatMoney } from '@/lib/money';
import { productImageSrc } from '@/lib/product-image';
import type { CartPayload } from '@/types/cart';
import { Link, router } from '@inertiajs/react';
import { useState } from 'react';

export function CartDrawer({
    cart,
    open,
    onOpenChange,
}: {
    cart: CartPayload;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [busyId, setBusyId] = useState<number | null>(null);
    const items = cart?.items ?? [];
    const totals = cart?.totals ?? { subtotal: 0, discount: 0, delivery_fee: 0, packing_fee: 0, vat_amount: 0, total: 0, item_count: 0 };
    const threshold = Number(totals.free_delivery_threshold || 0);
    const remaining = threshold > 0 ? Math.max(0, threshold - Number(totals.subtotal || 0)) : 0;
    const progress = threshold > 0 ? Math.min(100, (Number(totals.subtotal || 0) / threshold) * 100) : 0;

    const patchQty = (id: number, quantity: number) => {
        setBusyId(id);
        router.patch(`/cart/${id}`, { quantity }, { preserveScroll: true, onFinish: () => setBusyId(null) });
    };

    const removeItem = (id: number) => {
        setBusyId(id);
        router.delete(`/cart/${id}`, { preserveScroll: true, onFinish: () => setBusyId(null) });
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                className="flex h-full w-full flex-col gap-0 p-0 sm:max-w-[400px] data-[state=closed]:duration-300 data-[state=open]:duration-300"
            >
                <SheetHeader className="border-b border-[var(--shop-border)] px-5 py-4 text-left">
                    <SheetTitle className="font-[family-name:var(--shop-display-font)] text-xl font-normal">
                        Your cart
                        {totals.item_count > 0 ? (
                            <span className="ml-2 text-sm text-[var(--shop-text-muted)]">({totals.item_count})</span>
                        ) : null}
                    </SheetTitle>
                </SheetHeader>

                {items.length === 0 ? (
                    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
                        <p className="shop-h3">Your cart is empty</p>
                        <p className="mt-2 text-sm text-[var(--shop-text-muted)]">Browse the shop and add something you like.</p>
                        <ShopButton asChild className="mt-6">
                            <Link href="/shop" onClick={() => onOpenChange(false)}>
                                Continue shopping
                            </Link>
                        </ShopButton>
                    </div>
                ) : (
                    <>
                        <div className="flex-1 overflow-y-auto px-5">
                            {threshold > 0 && (
                                <div className="border-b border-[var(--shop-border)] py-4">
                                    <p className="text-sm text-[var(--shop-text-muted)]">
                                        {remaining > 0
                                            ? `${formatMoney(remaining)} away from free delivery`
                                            : 'You have free delivery on this order.'}
                                    </p>
                                    <div className="mt-2 h-1 overflow-hidden rounded-full bg-[var(--shop-bg)]">
                                        <div className="h-full rounded-full bg-[var(--shop-accent)]" style={{ width: `${progress}%` }} />
                                    </div>
                                </div>
                            )}
                            <ul className="divide-y divide-[var(--shop-border)]">
                                {items.map((item) => (
                                    <li key={item.id} className="flex gap-3 py-4">
                                        <Link
                                            href={`/products/${item.slug}`}
                                            onClick={() => onOpenChange(false)}
                                            className="h-20 w-20 shrink-0 overflow-hidden rounded-[var(--shop-radius-image)] bg-[var(--shop-bg)]"
                                        >
                                            <img src={productImageSrc(item.image, item.slug)} alt={item.name} className="h-full w-full object-cover" />
                                        </Link>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <Link
                                                        href={`/products/${item.slug}`}
                                                        onClick={() => onOpenChange(false)}
                                                        className="line-clamp-2 text-sm font-medium hover:text-[var(--shop-accent)]"
                                                    >
                                                        {item.name}
                                                    </Link>
                                                    {item.options && (
                                                        <p className="mt-0.5 text-sm text-[var(--shop-text-muted)]">{item.options}</p>
                                                    )}
                                                </div>
                                                <p className="shrink-0 text-sm tabular-nums">{formatMoney(item.line_total)}</p>
                                            </div>
                                            <div className="mt-3 flex flex-wrap items-center gap-3">
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
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="border-t border-[var(--shop-border)] px-5 py-4">
                            <div className="space-y-2 text-sm">
                                <Row label="Subtotal" value={totals.subtotal} />
                                {totals.discount > 0 && <Row label="Discount" value={-totals.discount} />}
                                <Row label="Delivery" value={totals.delivery_fee} />
                                {totals.packing_fee > 0 && <Row label="Packing" value={totals.packing_fee} />}
                                <div className="border-t border-[var(--shop-border)] pt-2">
                                    <Row label="Total" value={totals.total} bold />
                                </div>
                            </div>
                            <ShopButton asChild size="lg" className="mt-4">
                                <Link href="/checkout" onClick={() => onOpenChange(false)}>
                                    Checkout
                                </Link>
                            </ShopButton>
                            <ShopButton asChild variant="secondary" className="mt-2 w-full">
                                <Link href="/cart" onClick={() => onOpenChange(false)}>
                                    View cart
                                </Link>
                            </ShopButton>
                        </div>
                    </>
                )}
            </SheetContent>
        </Sheet>
    );
}

function Row({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
    return (
        <div className={`flex justify-between tabular-nums ${bold ? 'text-base font-semibold' : 'text-[var(--shop-text-muted)]'}`}>
            <span>{label}</span>
            <span className={bold ? 'text-[var(--shop-text)]' : undefined}>{formatMoney(value)}</span>
        </div>
    );
}
