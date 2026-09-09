import StoreLayout from '@/layouts/store-layout';
import { ShopButton } from '@/components/store/shop-button';
import { formatMoney } from '@/lib/money';
import { Link } from '@inertiajs/react';

type OrderItem = {
    id: number;
    product_name_snapshot: string;
    options_snapshot?: string | null;
    quantity: number;
    line_total: number;
};

type Order = {
    order_number: string;
    order_status: string;
    payment_method: string;
    customer_email: string;
    total: number;
    subtotal: number;
    discount_amount?: number;
    delivery_fee?: number;
    packing_fee?: number;
    vat_amount?: number;
    shipping_recipient?: string | null;
    shipping_line1?: string | null;
    shipping_line2?: string | null;
    shipping_country_code?: string | null;
    shipping_barangay?: string | null;
    shipping_city?: string | null;
    shipping_province?: string | null;
    shipping_postal_code?: string | null;
    items?: OrderItem[];
};

function pretty(value: string) {
    return String(value || '').replaceAll('_', ' ');
}

function payLabel(method: string) {
    if (method === 'paymongo') {
        return 'PayMongo';
    }
    if (method === 'cod') {
        return 'Cash on delivery';
    }

    return pretty(method);
}

export default function Confirmation({ order }: { order: Order }) {
    const items = order.items ?? [];
    const address = [
        order.shipping_recipient,
        order.shipping_line1,
        order.shipping_line2,
        order.shipping_barangay,
        order.shipping_city,
        order.shipping_province,
        order.shipping_postal_code,
        order.shipping_country_code,
    ]
        .filter(Boolean)
        .join(', ');

    return (
        <StoreLayout title="Order confirmed">
            <div className="mx-auto max-w-xl py-2 md:py-8">
                <p className="shop-caption uppercase tracking-[0.16em] text-[var(--shop-accent)]">Confirmed</p>
                <h1 className="shop-h1 mt-3">Thank you</h1>
                <p className="mt-3 text-[var(--shop-text-muted)]">
                    Order <span className="font-medium text-[var(--shop-text)]">{order.order_number}</span> is {pretty(order.order_status)}.
                    A confirmation was sent to {order.customer_email}.
                </p>
                <p className="mt-2 text-sm text-[var(--shop-text-muted)]">We’ll email you when it ships.</p>

                <div className="mt-8 space-y-6 border-t border-[var(--shop-border)] pt-6">
                    <div className="grid gap-6 sm:grid-cols-2">
                        <div>
                            <p className="shop-caption uppercase tracking-[0.14em] text-[var(--shop-text-muted)]">Payment</p>
                            <p className="mt-1.5 text-sm">{payLabel(order.payment_method)}</p>
                        </div>
                        {address && (
                            <div>
                                <p className="shop-caption uppercase tracking-[0.14em] text-[var(--shop-text-muted)]">Shipping</p>
                                <p className="mt-1.5 text-sm leading-relaxed">{address}</p>
                            </div>
                        )}
                    </div>

                    <div>
                        <p className="shop-caption uppercase tracking-[0.14em] text-[var(--shop-text-muted)]">Items</p>
                        <ul className="mt-3 divide-y divide-[var(--shop-border)] border-y border-[var(--shop-border)]">
                            {items.map((item) => (
                                <li key={item.id} className="flex justify-between gap-3 py-3 text-sm">
                                    <span>
                                        {item.product_name_snapshot} × {item.quantity}
                                        {item.options_snapshot ? (
                                            <span className="mt-0.5 block text-[var(--shop-text-muted)]">{item.options_snapshot}</span>
                                        ) : null}
                                    </span>
                                    <span className="tabular-nums">{formatMoney(Number(item.line_total))}</span>
                                </li>
                            ))}
                        </ul>
                        <div className="mt-4 space-y-1.5 text-sm">
                            <Row label="Subtotal" value={Number(order.subtotal)} />
                            {Number(order.discount_amount) > 0 && <Row label="Discount" value={-Number(order.discount_amount)} />}
                            <Row label="Shipping" value={Number(order.delivery_fee || 0)} />
                            {Number(order.packing_fee) > 0 && <Row label="Packing" value={Number(order.packing_fee)} />}
                            {Number(order.vat_amount) > 0 && (
                                <p className="text-xs text-[var(--shop-text-muted)]">Includes VAT of {formatMoney(Number(order.vat_amount))}</p>
                            )}
                            <div className="border-t border-[var(--shop-border)] pt-2">
                                <Row label="Total" value={Number(order.total)} bold />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex flex-wrap gap-3">
                    <ShopButton asChild>
                        <Link href={`/orders/${order.order_number}`}>View order</Link>
                    </ShopButton>
                    <ShopButton asChild variant="secondary">
                        <Link href="/shop">Continue shopping</Link>
                    </ShopButton>
                </div>
            </div>
        </StoreLayout>
    );
}

function Row({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
    return (
        <div className={`flex justify-between tabular-nums ${bold ? 'font-semibold' : 'text-[var(--shop-text-muted)]'}`}>
            <span>{label}</span>
            <span>{formatMoney(value)}</span>
        </div>
    );
}
