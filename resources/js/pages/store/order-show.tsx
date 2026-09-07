import StoreLayout from '@/layouts/store-layout';
import { formatMoney } from '@/components/product-card';
import { router } from '@inertiajs/react';

export default function OrderShow({ order }: { order: any }) {
    return (
        <StoreLayout title={`Order ${order.order_number}`}>
            <h1 className="text-3xl font-semibold">{order.order_number}</h1>
            <p className="mt-1 capitalize">{String(order.order_status).replaceAll('_', ' ')} · {order.payment_status}</p>
            <ul className="mt-6 space-y-2">
                {order.items.map((i: any) => (
                    <li key={i.id} className="flex justify-between rounded-[10px] bg-[var(--shop-surface)] p-4">
                        <span>
                            {i.product_name_snapshot} {i.options_snapshot ? `(${i.options_snapshot})` : ''} × {i.quantity}
                        </span>
                        <span className="tabular-nums">{formatMoney(i.line_total)}</span>
                    </li>
                ))}
            </ul>
            <p className="mt-4 font-semibold tabular-nums">Total {formatMoney(order.total)}</p>
            <p className="mt-2 text-sm text-[var(--shop-text-muted)]">
                Ship to {order.shipping_line1}, {order.shipping_city}
            </p>
            {order.status_logs && (
                <ol className="mt-6 space-y-1 text-sm">
                    {order.status_logs.map((l: any) => (
                        <li key={l.id}>
                            {l.to_status} {l.note ? `— ${l.note}` : ''}
                        </li>
                    ))}
                </ol>
            )}
            <button type="button" className="mt-6 h-11 rounded-md border border-[var(--shop-border)] px-4" onClick={() => router.post(`/orders/${order.order_number}/reorder`)}>
                Reorder
            </button>
        </StoreLayout>
    );
}
