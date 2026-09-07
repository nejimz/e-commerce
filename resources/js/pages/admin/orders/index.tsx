import { adminBtnClass } from '@/components/admin/admin-button';
import { AdminInput, AdminSelect } from '@/components/admin/admin-field';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminPagination, type Paginator } from '@/components/admin/admin-pagination';
import { AdminRow, AdminTable, AdminTd, AdminTh, AdminThead } from '@/components/admin/admin-table';
import { StatusPill } from '@/components/admin/status-pill';
import { EmptyState } from '@/components/empty-state';
import { formatMoney } from '@/components/product-card';
import AdminLayout from '@/layouts/admin-layout';
import { FormEvent } from 'react';
import { router } from '@inertiajs/react';

type OrderRow = {
    id: number;
    order_number: string;
    customer_name: string;
    total: number;
    order_status: string;
    payment_status: string;
};

export default function OrdersIndex({
    orders,
    filters,
}: {
    orders: Paginator<OrderRow>;
    filters: { search?: string; status?: string; payment?: string };
}) {
    const submit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        router.get('/admin/orders', Object.fromEntries(fd as any), { preserveState: true });
    };

    return (
        <AdminLayout title="Orders">
            <AdminPageHeader
                title="Orders"
                description="Search, filter, and export recent orders."
                actions={
                    <a href="/admin/orders/export" className={adminBtnClass.secondary}>
                        Export CSV
                    </a>
                }
            />
            <form className="mb-4 flex flex-wrap gap-2" onSubmit={submit}>
                <AdminInput
                    name="search"
                    defaultValue={filters.search || ''}
                    placeholder="Search order, name, email, phone"
                    className="max-w-xs"
                    aria-label="Search orders"
                />
                <AdminSelect name="status" defaultValue={filters.status || ''} className="w-auto min-w-44" aria-label="Filter by status">
                    <option value="">All statuses</option>
                    {['pending', 'confirmed', 'packing', 'out_for_delivery', 'delivered', 'cancelled'].map((s) => (
                        <option key={s} value={s}>
                            {s.replaceAll('_', ' ')}
                        </option>
                    ))}
                </AdminSelect>
                <button className={adminBtnClass.secondary} type="submit">
                    Filter
                </button>
            </form>

            {orders.data.length === 0 ? (
                <EmptyState title="No orders" body="Try a different search or status, or wait for the next checkout." />
            ) : (
                <>
                    <AdminTable>
                        <AdminThead>
                            <tr>
                                <AdminTh>Order</AdminTh>
                                <AdminTh>Customer</AdminTh>
                                <AdminTh numeric>Total</AdminTh>
                                <AdminTh>Status</AdminTh>
                                <AdminTh>Payment</AdminTh>
                            </tr>
                        </AdminThead>
                        <tbody>
                            {orders.data.map((o) => (
                                <AdminRow key={o.id} href={`/admin/orders/${o.id}`}>
                                    <AdminTd className="font-medium">{o.order_number}</AdminTd>
                                    <AdminTd>{o.customer_name}</AdminTd>
                                    <AdminTd numeric>{formatMoney(o.total)}</AdminTd>
                                    <AdminTd>
                                        <StatusPill kind="order" value={String(o.order_status)} />
                                    </AdminTd>
                                    <AdminTd>
                                        <StatusPill kind="payment" value={String(o.payment_status)} />
                                    </AdminTd>
                                </AdminRow>
                            ))}
                        </tbody>
                    </AdminTable>
                    <AdminPagination paginator={orders} />
                </>
            )}
        </AdminLayout>
    );
}
