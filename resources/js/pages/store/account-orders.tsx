import StoreLayout from '@/layouts/store-layout';
import { EmptyState } from '@/components/empty-state';
import { formatMoney } from '@/components/product-card';
import { Link } from '@inertiajs/react';

export default function AccountOrders({ orders }: { orders: { data: any[] } }) {
    return (
        <StoreLayout title="Your orders">
            <h1 className="text-3xl font-semibold">Orders</h1>
            <div className="mt-4 flex gap-4 text-sm">
                <Link href="/account/orders">Orders</Link>
                <Link href="/account/profile">Profile</Link>
            </div>
            {orders.data.length === 0 ? (
                <div className="mt-6">
                    <EmptyState title="No orders yet" body="When you place an order, it will show up here." />
                </div>
            ) : (
                <ul className="mt-6 space-y-3">
                    {orders.data.map((o) => (
                        <li key={o.id} className="flex items-center justify-between rounded-[10px] bg-[var(--shop-surface)] p-4">
                            <div>
                                <Link href={`/orders/${o.order_number}`} className="font-medium">
                                    {o.order_number}
                                </Link>
                                <p className="text-sm capitalize text-[var(--shop-text-muted)]">{String(o.order_status).replaceAll('_', ' ')}</p>
                            </div>
                            <span className="tabular-nums">{formatMoney(o.total)}</span>
                        </li>
                    ))}
                </ul>
            )}
        </StoreLayout>
    );
}
