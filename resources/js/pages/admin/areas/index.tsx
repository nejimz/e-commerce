import { AdminButton } from '@/components/admin/admin-button';
import { AdminCheckbox, AdminField, AdminInput, AdminSelect } from '@/components/admin/admin-field';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminPanel } from '@/components/admin/admin-panel';
import { AdminRow, AdminTable, AdminTd, AdminTh, AdminThead } from '@/components/admin/admin-table';
import { ConfirmButton } from '@/components/admin/confirm-button';
import { StatusPill } from '@/components/admin/status-pill';
import { EmptyState } from '@/components/empty-state';
import { formatMoney } from '@/components/product-card';
import AdminLayout from '@/layouts/admin-layout';
import { router, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';

type Area = {
    id: number;
    city: string;
    province: string;
    mode: string;
    delivery_fee: number;
};

export default function AreasIndex({ areas }: { areas: Area[] }) {
    const form = useForm({
        province: 'Metro Manila',
        city: '',
        mode: 'allow',
        delivery_fee: 80,
        same_day_eligible: true as boolean,
        is_active: true as boolean,
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.post('/admin/areas', { preserveScroll: true });
    };

    return (
        <AdminLayout title="Delivery areas">
            <AdminPageHeader title="Delivery areas" description="Allow or block cities and set per-area fees." />
            <div className="grid gap-6 lg:grid-cols-3">
                <AdminPanel title="Add area">
                    <form className="grid gap-4" onSubmit={submit}>
                        <AdminField label="Province" htmlFor="province" error={form.errors.province}>
                            <AdminInput id="province" value={form.data.province} onChange={(e) => form.setData('province', e.target.value)} />
                        </AdminField>
                        <AdminField label="City" htmlFor="city" error={form.errors.city}>
                            <AdminInput id="city" value={form.data.city} onChange={(e) => form.setData('city', e.target.value)} />
                        </AdminField>
                        <AdminField label="Mode" htmlFor="mode" error={form.errors.mode}>
                            <AdminSelect id="mode" value={form.data.mode} onChange={(e) => form.setData('mode', e.target.value)}>
                                <option value="allow">Allow</option>
                                <option value="block">Block</option>
                            </AdminSelect>
                        </AdminField>
                        <AdminField label="Delivery fee" htmlFor="delivery_fee" error={form.errors.delivery_fee}>
                            <AdminInput
                                id="delivery_fee"
                                type="number"
                                value={form.data.delivery_fee}
                                onChange={(e) => form.setData('delivery_fee', Number(e.target.value))}
                            />
                        </AdminField>
                        <AdminCheckbox
                            label="Same-day eligible"
                            checked={form.data.same_day_eligible}
                            onChange={(e) => form.setData('same_day_eligible', e.target.checked)}
                        />
                        <AdminCheckbox
                            label="Active"
                            checked={form.data.is_active}
                            onChange={(e) => form.setData('is_active', e.target.checked)}
                        />
                        <AdminButton type="submit" disabled={form.processing}>
                            {form.processing ? 'Adding…' : 'Add area'}
                        </AdminButton>
                    </form>
                </AdminPanel>
                <div className="lg:col-span-2">
                    {areas.length === 0 ? (
                        <EmptyState title="No areas" body="Add a city to allow or block delivery." />
                    ) : (
                        <AdminTable>
                            <AdminThead>
                                <tr>
                                    <AdminTh>Area</AdminTh>
                                    <AdminTh>Mode</AdminTh>
                                    <AdminTh numeric>Fee</AdminTh>
                                    <AdminTh> </AdminTh>
                                </tr>
                            </AdminThead>
                            <tbody>
                                {areas.map((a) => (
                                    <AdminRow key={a.id}>
                                        <AdminTd>
                                            {a.city}, {a.province}
                                        </AdminTd>
                                        <AdminTd>
                                            <StatusPill value={a.mode} />
                                        </AdminTd>
                                        <AdminTd numeric>{formatMoney(a.delivery_fee)}</AdminTd>
                                        <AdminTd>
                                            <ConfirmButton
                                                recordName={`${a.city}, ${a.province}`}
                                                onConfirm={() => router.delete(`/admin/areas/${a.id}`)}
                                            >
                                                Remove
                                            </ConfirmButton>
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
