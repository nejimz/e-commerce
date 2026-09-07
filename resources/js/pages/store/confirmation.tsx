import StoreLayout from '@/layouts/store-layout';
import { formatMoney } from '@/components/product-card';
import { Link } from '@inertiajs/react';

export default function Confirmation({ order }: { order: any }) {
    return (
        <StoreLayout title="Order confirmed">
            <h1 className="text-3xl font-semibold">Thank you</h1>
            <p className="mt-2 text-[var(--shop-text-muted)]">Order {order.order_number} is {order.order_status}.</p>
            <p className="mt-1 tabular-nums">Total {formatMoney(order.total)}</p>
            <p className="mt-4 text-sm">A confirmation was sent to {order.customer_email}.</p>
            <Link href={`/orders/${order.order_number}`} className="mt-6 inline-flex h-11 items-center rounded-md bg-[var(--shop-accent)] px-4 text-[var(--shop-on-accent)]">
                View order
            </Link>
        </StoreLayout>
    );
}
