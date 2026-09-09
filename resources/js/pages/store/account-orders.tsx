import StoreLayout from '@/layouts/store-layout';
import { AccountNav } from '@/components/store/account-nav';
import { EmptyState } from '@/components/empty-state';
import { ShopButton } from '@/components/store/shop-button';
import { formatMoney } from '@/components/product-card';
import { Link } from '@inertiajs/react';

type AccountOrder = {
    id: number;
    order_number: string;
    order_status: string;
    total: number;
};

export default function AccountOrders({ orders }: { orders: { data: AccountOrder[] } }) {
    return (
        <StoreLayout title="Your orders">
            <h1 className="shop-h1">Orders</h1>
            <AccountNav />
            {orders.data.length === 0 ? (
                <EmptyState title="No orders yet" body="When you place an order, it will show up here.">
                    <ShopButton asChild>
                        <Link href="/shop">Start shopping</Link>
                    </ShopButton>
                </EmptyState>
            ) : (
                <ul className="space-y-3">
                    {orders.data.map((o) => (
                        <li key={o.id} className="flex items-center justify-between rounded-[var(--shop-radius-card)] bg-[var(--shop-surface)] p-5">
                            <div>
                                <Link href={`/orders/${o.order_number}`} className="font-medium hover:text-[var(--shop-accent)]">
                                    {o.order_number}
                                </Link>
                                <p className="mt-1 text-sm capitalize text-[var(--shop-text-muted)]">{String(o.order_status).replaceAll('_', ' ')}</p>
                            </div>
                            <span className="shop-price text-base">{formatMoney(o.total)}</span>
                        </li>
                    ))}
                </ul>
            )}
        </StoreLayout>
    );
}
