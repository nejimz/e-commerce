import StoreLayout from '@/layouts/store-layout';
import { ShopButton } from '@/components/store/shop-button';
import { formatMoney } from '@/components/product-card';
import { Link, router } from '@inertiajs/react';

type OrderItem = {
    id: number;
    product_name_snapshot: string;
    options_snapshot?: string | null;
    quantity: number;
    line_total: number;
};

type StatusLog = {
    id: number;
    to_status: string;
    note?: string | null;
};

type StoreOrder = {
    order_number: string;
    order_status: string;
    payment_status: string;
    total: number;
    shipping_line1?: string | null;
    shipping_city?: string | null;
    items: OrderItem[];
    status_logs?: StatusLog[];
};

export default function OrderShow({ order }: { order: StoreOrder }) {
    return (
        <StoreLayout title={`Order ${order.order_number}`}>
            <p className="shop-caption uppercase tracking-[0.16em] text-[var(--shop-text-muted)]">Order</p>
            <h1 className="shop-h1 mt-2">{order.order_number}</h1>
            <p className="mt-2 text-sm capitalize text-[var(--shop-text-muted)]">
                {String(order.order_status).replaceAll('_', ' ')} · {order.payment_status}
            </p>
            <ul className="mt-8 divide-y divide-[var(--shop-border)] border-y border-[var(--shop-border)]">
                {order.items.map((i) => (
                    <li key={i.id} className="flex justify-between gap-4 py-4 text-sm">
                        <span>
                            {i.product_name_snapshot} {i.options_snapshot ? `(${i.options_snapshot})` : ''} × {i.quantity}
                        </span>
                        <span className="tabular-nums">{formatMoney(i.line_total)}</span>
                    </li>
                ))}
            </ul>
            <p className="mt-4 shop-price">{formatMoney(order.total)}</p>
            <p className="mt-3 text-sm text-[var(--shop-text-muted)]">
                Ship to {order.shipping_line1}, {order.shipping_city}
            </p>
            {order.status_logs && (
                <ol className="mt-8 space-y-2 text-sm text-[var(--shop-text-muted)]">
                    {order.status_logs.map((l) => (
                        <li key={l.id} className="capitalize">
                            {String(l.to_status).replaceAll('_', ' ')} {l.note ? `— ${l.note}` : ''}
                        </li>
                    ))}
                </ol>
            )}
            <div className="mt-8 flex flex-wrap gap-3">
                <ShopButton type="button" onClick={() => router.post(`/orders/${order.order_number}/reorder`)}>
                    Reorder
                </ShopButton>
                <ShopButton asChild variant="secondary">
                    <Link href="/shop">Continue shopping</Link>
                </ShopButton>
            </div>
        </StoreLayout>
    );
}
