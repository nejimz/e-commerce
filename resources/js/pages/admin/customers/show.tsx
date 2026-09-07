import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminPanel } from '@/components/admin/admin-panel';
import { AdminRow, AdminTable, AdminTd, AdminTh, AdminThead } from '@/components/admin/admin-table';
import { StatusPill } from '@/components/admin/status-pill';
import { EmptyState } from '@/components/empty-state';
import { formatMoney } from '@/components/product-card';
import AdminLayout from '@/layouts/admin-layout';

export default function CustomerShow({
    customer,
}: {
    customer: {
        name: string;
        email: string;
        phone?: string;
        orders?: {
            id: number;
            order_number: string;
            total: number;
            order_status: string;
        }[];
    };
}) {
    const orders = customer.orders ?? [];

    return (
        <AdminLayout title={customer.name}>
            <AdminPageHeader title={customer.name} description="Contact details and order history." />
            <div className="grid gap-6 lg:grid-cols-3">
                <AdminPanel title="Contact">
                    <dl className="grid gap-3 text-sm">
                        <div>
                            <dt className="text-[var(--shop-text-muted)]">Email</dt>
                            <dd className="mt-0.5">{customer.email}</dd>
                        </div>
                        <div>
                            <dt className="text-[var(--shop-text-muted)]">Phone</dt>
                            <dd className="mt-0.5">{customer.phone || '—'}</dd>
                        </div>
                        <div>
                            <dt className="text-[var(--shop-text-muted)]">Orders</dt>
                            <dd className="mt-0.5 tabular-nums">{orders.length}</dd>
                        </div>
                    </dl>
                </AdminPanel>
                <AdminPanel title="Orders" className="lg:col-span-2">
                    {orders.length === 0 ? (
                        <EmptyState title="No orders" body="This customer has not placed an order yet." />
                    ) : (
                        <AdminTable plain>
                            <AdminThead>
                                <tr>
                                    <AdminTh>Order</AdminTh>
                                    <AdminTh>Status</AdminTh>
                                    <AdminTh numeric>Total</AdminTh>
                                </tr>
                            </AdminThead>
                            <tbody>
                                {orders.map((o) => (
                                    <AdminRow key={o.id} href={`/admin/orders/${o.id}`}>
                                        <AdminTd className="font-medium">{o.order_number}</AdminTd>
                                        <AdminTd>
                                            <StatusPill kind="order" value={String(o.order_status)} />
                                        </AdminTd>
                                        <AdminTd numeric>{formatMoney(o.total)}</AdminTd>
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
