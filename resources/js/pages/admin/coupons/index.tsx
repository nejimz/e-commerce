import { AdminButton } from '@/components/admin/admin-button';
import { AdminCheckbox, AdminField, AdminInput, AdminSelect } from '@/components/admin/admin-field';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminPanel } from '@/components/admin/admin-panel';
import { AdminRow, AdminTable, AdminTd, AdminTh, AdminThead } from '@/components/admin/admin-table';
import { StatusPill } from '@/components/admin/status-pill';
import { EmptyState } from '@/components/empty-state';
import AdminLayout from '@/layouts/admin-layout';
import { useForm } from '@inertiajs/react';
import { FormEvent } from 'react';

type Coupon = {
    id: number;
    code: string;
    type: string;
    value: number;
    is_active: boolean;
};

export default function CouponsIndex({ coupons }: { coupons: Coupon[] }) {
    const form = useForm({
        code: '',
        type: 'percentage',
        value: 10,
        minimum_purchase: 0,
        is_active: true as boolean,
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.post('/admin/coupons', { preserveScroll: true });
    };

    return (
        <AdminLayout title="Promos">
            <AdminPageHeader title="Promos" description="Create and review discount codes." />
            <div className="grid gap-6 lg:grid-cols-3">
                <AdminPanel title="New promo">
                    <form className="grid gap-4" onSubmit={submit}>
                        <AdminField label="Code" htmlFor="code" error={form.errors.code}>
                            <AdminInput id="code" value={form.data.code} onChange={(e) => form.setData('code', e.target.value)} />
                        </AdminField>
                        <AdminField label="Type" htmlFor="type" error={form.errors.type}>
                            <AdminSelect id="type" value={form.data.type} onChange={(e) => form.setData('type', e.target.value)}>
                                <option value="percentage">Percentage</option>
                                <option value="fixed">Fixed amount</option>
                                <option value="free_delivery">Free shipping</option>
                            </AdminSelect>
                        </AdminField>
                        <AdminField label="Value" htmlFor="value" hint="Percent or peso amount. Ignored for free shipping." error={form.errors.value}>
                            <AdminInput
                                id="value"
                                type="number"
                                value={form.data.value}
                                onChange={(e) => form.setData('value', Number(e.target.value))}
                            />
                        </AdminField>
                        <AdminField label="Minimum purchase" htmlFor="minimum_purchase" error={form.errors.minimum_purchase}>
                            <AdminInput
                                id="minimum_purchase"
                                type="number"
                                value={form.data.minimum_purchase}
                                onChange={(e) => form.setData('minimum_purchase', Number(e.target.value))}
                            />
                        </AdminField>
                        <AdminCheckbox
                            label="Active"
                            checked={form.data.is_active}
                            onChange={(e) => form.setData('is_active', e.target.checked)}
                        />
                        <AdminButton type="submit" disabled={form.processing}>
                            {form.processing ? 'Creating…' : 'Create'}
                        </AdminButton>
                    </form>
                </AdminPanel>
                <div className="lg:col-span-2">
                    {coupons.length === 0 ? (
                        <EmptyState title="No promos" body="Create a code to offer a discount or free shipping." />
                    ) : (
                        <AdminTable>
                            <AdminThead>
                                <tr>
                                    <AdminTh>Code</AdminTh>
                                    <AdminTh>Type</AdminTh>
                                    <AdminTh numeric>Value</AdminTh>
                                    <AdminTh>Status</AdminTh>
                                </tr>
                            </AdminThead>
                            <tbody>
                                {coupons.map((c) => (
                                    <AdminRow key={c.id}>
                                        <AdminTd className="font-medium">{c.code}</AdminTd>
                                        <AdminTd className="capitalize">{c.type.replaceAll('_', ' ')}</AdminTd>
                                        <AdminTd numeric>{c.value}</AdminTd>
                                        <AdminTd>
                                            <StatusPill value={c.is_active ? 'active' : 'off'} />
                                        </AdminTd>
                                    </AdminRow>
                                ))}
                            </tbody>
                        </AdminTable>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
