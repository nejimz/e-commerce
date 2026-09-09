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
import { router, useForm, usePage } from '@inertiajs/react';
import { FormEvent } from 'react';

type Area = {
    id: number;
    city: string | null;
    province: string | null;
    country_code: string;
    country_name: string;
    display_name: string;
    mode: string;
    delivery_fee: number;
    free_shipping_eligible: boolean;
};

export default function AreasIndex({ areas }: { areas: Area[] }) {
    const countries = usePage<{ countries?: Record<string, string> }>().props.countries ?? {};
    const form = useForm({
        country_code: 'PH',
        province: 'Metro Manila',
        city: '',
        mode: 'allow',
        delivery_fee: 80,
        free_shipping_eligible: true as boolean,
        same_day_eligible: true as boolean,
        is_active: true as boolean,
    });
    const domestic = form.data.country_code === 'PH';

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.post('/admin/areas', { preserveScroll: true });
    };

    return (
        <AdminLayout title="Shipping zones">
            <AdminPageHeader
                title="Shipping zones"
                description="Allow Philippines cities or whole countries, and set the shipping fee for each."
            />
            <div className="grid gap-6 lg:grid-cols-3">
                <AdminPanel title="Add zone">
                    <form className="grid gap-4" onSubmit={submit}>
                        <AdminField label="Country" htmlFor="country_code" error={form.errors.country_code}>
                            <AdminSelect
                                id="country_code"
                                value={form.data.country_code}
                                onChange={(e) => {
                                    const code = e.target.value;
                                    form.setData({
                                        ...form.data,
                                        country_code: code,
                                        province: code === 'PH' ? 'Metro Manila' : '',
                                        city: '',
                                        same_day_eligible: code === 'PH',
                                        free_shipping_eligible: code === 'PH',
                                        delivery_fee: code === 'PH' ? 80 : 450,
                                    });
                                }}
                            >
                                {Object.entries(countries).map(([code, name]) => (
                                    <option key={code} value={code}>
                                        {name}
                                    </option>
                                ))}
                            </AdminSelect>
                        </AdminField>
                        <AdminField
                            label={domestic ? 'Province' : 'State / region'}
                            htmlFor="province"
                            hint={domestic ? undefined : 'Leave blank to cover the whole country.'}
                            error={form.errors.province}
                        >
                            <AdminInput id="province" value={form.data.province} onChange={(e) => form.setData('province', e.target.value)} />
                        </AdminField>
                        <AdminField
                            label="City"
                            htmlFor="city"
                            hint={domestic ? undefined : 'Leave blank to cover the whole country.'}
                            error={form.errors.city}
                        >
                            <AdminInput id="city" value={form.data.city} onChange={(e) => form.setData('city', e.target.value)} />
                        </AdminField>
                        <AdminField label="Mode" htmlFor="mode" error={form.errors.mode}>
                            <AdminSelect id="mode" value={form.data.mode} onChange={(e) => form.setData('mode', e.target.value)}>
                                <option value="allow">Allow</option>
                                <option value="block">Block</option>
                            </AdminSelect>
                        </AdminField>
                        <AdminField label="Shipping fee" htmlFor="delivery_fee" error={form.errors.delivery_fee}>
                            <AdminInput
                                id="delivery_fee"
                                type="number"
                                value={form.data.delivery_fee}
                                onChange={(e) => form.setData('delivery_fee', Number(e.target.value))}
                            />
                        </AdminField>
                        <AdminCheckbox
                            label="Free shipping threshold applies"
                            checked={form.data.free_shipping_eligible}
                            onChange={(e) => form.setData('free_shipping_eligible', e.target.checked)}
                        />
                        {domestic && (
                            <AdminCheckbox
                                label="Same-day eligible"
                                checked={form.data.same_day_eligible}
                                onChange={(e) => form.setData('same_day_eligible', e.target.checked)}
                            />
                        )}
                        <AdminCheckbox
                            label="Active"
                            checked={form.data.is_active}
                            onChange={(e) => form.setData('is_active', e.target.checked)}
                        />
                        <AdminButton type="submit" disabled={form.processing}>
                            {form.processing ? 'Adding…' : 'Add zone'}
                        </AdminButton>
                    </form>
                </AdminPanel>
                <div className="lg:col-span-2">
                    {areas.length === 0 ? (
                        <EmptyState title="No zones" body="Add a city or country to allow or block shipping." />
                    ) : (
                        <AdminTable>
                            <AdminThead>
                                <tr>
                                    <AdminTh>Zone</AdminTh>
                                    <AdminTh>Mode</AdminTh>
                                    <AdminTh numeric>Fee</AdminTh>
                                    <AdminTh> </AdminTh>
                                </tr>
                            </AdminThead>
                            <tbody>
                                {areas.map((a) => (
                                    <AdminRow key={a.id}>
                                        <AdminTd>
                                            {a.display_name}
                                            {a.free_shipping_eligible ? (
                                                <span className="mt-0.5 block text-xs text-[var(--shop-text-muted)]">Free-shipping eligible</span>
                                            ) : null}
                                        </AdminTd>
                                        <AdminTd>
                                            <StatusPill value={a.mode} />
                                        </AdminTd>
                                        <AdminTd numeric>{formatMoney(a.delivery_fee)}</AdminTd>
                                        <AdminTd>
                                            <ConfirmButton
                                                recordName={a.display_name}
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
