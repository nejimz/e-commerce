import { AdminButton, adminBtnClass } from '@/components/admin/admin-button';
import { AdminField, AdminInput, AdminSelect, AdminTextarea } from '@/components/admin/admin-field';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminPanel } from '@/components/admin/admin-panel';
import { StatusPill } from '@/components/admin/status-pill';
import { formatMoney } from '@/components/product-card';
import AdminLayout from '@/layouts/admin-layout';
import { Link, router, useForm, usePage } from '@inertiajs/react';
import { FormEvent } from 'react';

type OrderItem = {
    id: number;
    product_name_snapshot: string;
    quantity: number;
    line_total: number;
};

export default function OrderShow({
    order,
    transitions,
}: {
    order: {
        id: number;
        order_number: string;
        customer_name: string;
        customer_email: string;
        customer_phone: string;
        shipping_line1: string;
        shipping_city: string;
        shipping_province: string;
        shipping_postal_code: string;
        order_status: string;
        payment_status: string;
        payment_method: string;
        total: number;
        items: OrderItem[];
        shipments?: { courier?: string; tracking_number?: string }[];
    };
    transitions: { value: string; label: string }[];
}) {
    const role = usePage<{ auth: { user?: { role?: string } } }>().props.auth?.user?.role;
    const status = useForm({ status: transitions[0]?.value || '', note: '' });
    const tracking = useForm({
        courier: order.shipments?.[0]?.courier || '',
        tracking_number: order.shipments?.[0]?.tracking_number || '',
    });

    const updateStatus = (e: FormEvent) => {
        e.preventDefault();
        status.patch(`/admin/orders/${order.id}/status`);
    };

    const saveTracking = (e: FormEvent) => {
        e.preventDefault();
        tracking.patch(`/admin/orders/${order.id}/tracking`);
    };

    return (
        <AdminLayout title={order.order_number}>
            <AdminPageHeader
                title={order.order_number}
                description="Customer, items, and fulfillment."
                actions={
                    <Link href={`/admin/orders/${order.id}/packing-slip`} className={adminBtnClass.secondary}>
                        Packing slip
                    </Link>
                }
            />
            <div className="grid gap-6 lg:grid-cols-5">
                <div className="space-y-6 lg:col-span-3">
                    <AdminPanel title="Customer">
                        <dl className="grid gap-3 text-sm sm:grid-cols-2">
                            <div>
                                <dt className="text-[var(--shop-text-muted)]">Name</dt>
                                <dd className="mt-0.5 font-medium">{order.customer_name}</dd>
                            </div>
                            <div>
                                <dt className="text-[var(--shop-text-muted)]">Email</dt>
                                <dd className="mt-0.5">{order.customer_email}</dd>
                            </div>
                            <div>
                                <dt className="text-[var(--shop-text-muted)]">Phone</dt>
                                <dd className="mt-0.5">{order.customer_phone}</dd>
                            </div>
                            <div>
                                <dt className="text-[var(--shop-text-muted)]">Address</dt>
                                <dd className="mt-0.5">
                                    {order.shipping_line1}, {order.shipping_city}, {order.shipping_province}{' '}
                                    {order.shipping_postal_code}
                                </dd>
                            </div>
                        </dl>
                    </AdminPanel>

                    <AdminPanel title="Items">
                        <ul className="divide-y divide-[var(--shop-border)] text-sm">
                            {order.items.map((i) => (
                                <li key={i.id} className="flex justify-between gap-4 py-2">
                                    <span>
                                        {i.product_name_snapshot} × {i.quantity}
                                    </span>
                                    <span className="tabular-nums">{formatMoney(i.line_total)}</span>
                                </li>
                            ))}
                        </ul>
                        <p className="mt-4 flex justify-between text-base font-semibold">
                            <span>Total</span>
                            <span className="tabular-nums">{formatMoney(order.total)}</span>
                        </p>
                    </AdminPanel>
                </div>

                <div className="space-y-6 lg:col-span-2">
                    <AdminPanel title="Fulfillment">
                        <div className="mb-4 flex flex-wrap gap-2">
                            <StatusPill kind="order" value={String(order.order_status)} />
                            <StatusPill kind="payment" value={String(order.payment_status)} />
                            <span className="text-sm capitalize text-[var(--shop-text-muted)]">{order.payment_method}</span>
                        </div>
                        {transitions.length > 0 && (
                            <form className="space-y-3" onSubmit={updateStatus}>
                                <AdminField label="Next status" htmlFor="status" error={status.errors.status}>
                                    <AdminSelect
                                        id="status"
                                        value={status.data.status}
                                        onChange={(e) => status.setData('status', e.target.value)}
                                    >
                                        {transitions.map((t) => (
                                            <option key={t.value} value={t.value}>
                                                {t.label}
                                            </option>
                                        ))}
                                    </AdminSelect>
                                </AdminField>
                                <AdminField
                                    label="Note"
                                    htmlFor="note"
                                    hint="Required when cancelling."
                                    error={status.errors.note}
                                >
                                    <AdminTextarea
                                        id="note"
                                        className="min-h-20"
                                        value={status.data.note}
                                        onChange={(e) => status.setData('note', e.target.value)}
                                    />
                                </AdminField>
                                <AdminButton type="submit" disabled={status.processing}>
                                    Update status
                                </AdminButton>
                            </form>
                        )}
                        {role === 'admin' && order.payment_status !== 'paid' && (
                            <AdminButton
                                variant="secondary"
                                className="mt-3"
                                disabled={status.processing}
                                onClick={() => router.patch(`/admin/orders/${order.id}/paid`)}
                            >
                                Mark paid
                            </AdminButton>
                        )}
                    </AdminPanel>

                    <AdminPanel title="Tracking">
                        <form className="space-y-3" onSubmit={saveTracking}>
                            <AdminField label="Courier" htmlFor="courier" error={tracking.errors.courier}>
                                <AdminInput
                                    id="courier"
                                    value={tracking.data.courier}
                                    onChange={(e) => tracking.setData('courier', e.target.value)}
                                />
                            </AdminField>
                            <AdminField label="Tracking number" htmlFor="tracking_number" error={tracking.errors.tracking_number}>
                                <AdminInput
                                    id="tracking_number"
                                    value={tracking.data.tracking_number}
                                    onChange={(e) => tracking.setData('tracking_number', e.target.value)}
                                />
                            </AdminField>
                            <AdminButton type="submit" variant="secondary" disabled={tracking.processing}>
                                Save tracking
                            </AdminButton>
                        </form>
                    </AdminPanel>
                </div>
            </div>
        </AdminLayout>
    );
}
