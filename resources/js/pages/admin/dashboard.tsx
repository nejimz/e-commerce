import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminPanel } from '@/components/admin/admin-panel';
import { AdminRow, AdminTable, AdminTd, AdminTh, AdminThead } from '@/components/admin/admin-table';
import { StatusPill } from '@/components/admin/status-pill';
import { EmptyState } from '@/components/empty-state';
import { formatMoney } from '@/components/product-card';
import AdminLayout from '@/layouts/admin-layout';
import { Link } from '@inertiajs/react';

export default function AdminDashboard({
    stats,
    recent,
    lowStock,
}: {
    stats: {
        today_orders: number;
        today_sales: number;
        pending: number;
        out_for_delivery: number;
        low_stock: number;
    };
    recent: {
        id: number;
        order_number: string;
        customer_name: string;
        total: number;
        order_status: string;
    }[];
    lowStock: { id: number; name: string; sku: string; stock_quantity: number }[];
}) {
    return (
        <AdminLayout title="Dashboard">
            <AdminPageHeader title="Dashboard" description="Today’s orders, fulfillment, and stock at a glance." />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <Stat label="Today's orders" value={stats.today_orders} href="/admin/orders" />
                <Stat label="Today's sales" value={formatMoney(stats.today_sales || 0)} />
                <Stat label="Pending" value={stats.pending} href="/admin/orders?status=pending" />
                <Stat label="Out for delivery" value={stats.out_for_delivery} href="/admin/orders?status=out_for_delivery" />
                <Stat label="Low stock" value={stats.low_stock} href="/admin/products" />
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-3">
                <AdminPanel title="Recent orders" className="lg:col-span-2">
                    {recent.length === 0 ? (
                        <EmptyState title="No orders yet" body="New orders will show up here as customers check out." />
                    ) : (
                        <AdminTable plain>
                            <AdminThead>
                                <tr>
                                    <AdminTh>Order</AdminTh>
                                    <AdminTh>Customer</AdminTh>
                                    <AdminTh numeric>Total</AdminTh>
                                    <AdminTh>Status</AdminTh>
                                </tr>
                            </AdminThead>
                            <tbody>
                                {recent.map((o) => (
                                    <AdminRow key={o.id} href={`/admin/orders/${o.id}`}>
                                        <AdminTd className="font-medium">{o.order_number}</AdminTd>
                                        <AdminTd>{o.customer_name}</AdminTd>
                                        <AdminTd numeric>{formatMoney(o.total)}</AdminTd>
                                        <AdminTd>
                                            <StatusPill kind="order" value={String(o.order_status)} />
                                        </AdminTd>
                                    </AdminRow>
                                ))}
                            </tbody>
                        </AdminTable>
                    )}
                </AdminPanel>

                <AdminPanel title="Low stock">
                    {lowStock.length === 0 ? (
                        <EmptyState title="Stock looks healthy" body="No products are at or below their threshold." />
                    ) : (
                        <AdminTable plain>
                            <AdminThead>
                                <tr>
                                    <AdminTh>Product</AdminTh>
                                    <AdminTh numeric>Qty</AdminTh>
                                </tr>
                            </AdminThead>
                            <tbody>
                                {lowStock.map((p) => (
                                    <AdminRow key={p.id} href={`/admin/products/${p.id}/edit`}>
                                        <AdminTd>
                                            <span className="block font-medium">{p.name}</span>
                                            <span className="text-xs text-[var(--shop-text-muted)]">{p.sku}</span>
                                        </AdminTd>
                                        <AdminTd numeric>
                                            <StatusPill kind="stock" value="low stock" />
                                            <span className="mt-1 block tabular-nums">{p.stock_quantity}</span>
                                        </AdminTd>
                                    </AdminRow>
                                ))}
                            </tbody>
                        </AdminTable>
                    )}
                </AdminPanel>
            </div>
        </AdminLayout>
    );
}

function Stat({ label, value, href }: { label: string; value: string | number; href?: string }) {
    const content = (
        <div className="rounded-[10px] bg-[var(--shop-surface)] p-4 shadow-[var(--shop-shadow)] transition-colors hover:bg-[var(--shop-bg)]">
            <p className="text-sm text-[var(--shop-text-muted)]">{label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
        </div>
    );

    if (href) {
        return (
            <Link href={href} className="block">
                {content}
            </Link>
        );
    }

    return content;
}
