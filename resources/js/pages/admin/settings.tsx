import { AdminButton } from '@/components/admin/admin-button';
import { AdminCheckbox, AdminField, AdminInput, AdminSelect, AdminTextarea } from '@/components/admin/admin-field';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminPanel } from '@/components/admin/admin-panel';
import AdminLayout from '@/layouts/admin-layout';
import { useForm } from '@inertiajs/react';
import { FormEvent } from 'react';

export default function SettingsPage({ settings }: { settings: Record<string, any> }) {
    const form = useForm({
        store_name: settings.store_name || '',
        announcement: settings.announcement || '',
        store_paused: Boolean(settings.store_paused),
        store_paused_message: settings.store_paused_message || '',
        ordering_hours_enabled: Boolean(settings.ordering_hours_enabled),
        ordering_hours_start: settings.ordering_hours_start || '08:00',
        ordering_hours_end: settings.ordering_hours_end || '22:00',
        unlisted_area_default: settings.unlisted_area_default || 'block',
        default_delivery_fee: settings.default_delivery_fee || 99,
        free_delivery_enabled: Boolean(settings.free_delivery_enabled),
        free_delivery_threshold: settings.free_delivery_threshold || 2000,
        packing_fee: settings.packing_fee || 0,
        vat_enabled: Boolean(settings.vat_enabled),
        vat_rate: settings.vat_rate || 12,
        cod_maximum: settings.cod_maximum || 0,
        page_terms: settings.page_terms || '',
        page_privacy: settings.page_privacy || '',
        page_shipping: settings.page_shipping || '',
        page_returns: settings.page_returns || '',
        page_contact: settings.page_contact || '',
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.transform((data) => ({
            ...data,
            store_paused: data.store_paused ? '1' : '0',
            ordering_hours_enabled: data.ordering_hours_enabled ? '1' : '0',
            free_delivery_enabled: data.free_delivery_enabled ? '1' : '0',
            vat_enabled: data.vat_enabled ? '1' : '0',
        }));
        form.patch('/admin/settings');
    };

    return (
        <AdminLayout title="Settings">
            <AdminPageHeader title="Settings" description="Store hours, fees, and policy pages." />
            <form onSubmit={submit} className="grid max-w-3xl gap-6">
                <AdminPanel title="Store">
                    <div className="grid gap-4">
                        <AdminField label="Store name" htmlFor="store_name" error={form.errors.store_name}>
                            <AdminInput
                                id="store_name"
                                value={form.data.store_name}
                                onChange={(e) => form.setData('store_name', e.target.value)}
                            />
                        </AdminField>
                        <AdminField
                            label="Announcement"
                            htmlFor="announcement"
                            hint="Shown in the storefront header bar."
                            error={form.errors.announcement}
                        >
                            <AdminInput
                                id="announcement"
                                value={form.data.announcement}
                                onChange={(e) => form.setData('announcement', e.target.value)}
                            />
                        </AdminField>
                        <AdminCheckbox
                            label="Pause store"
                            checked={form.data.store_paused}
                            onChange={(e) => form.setData('store_paused', e.target.checked)}
                        />
                        <AdminField
                            label="Paused message"
                            htmlFor="store_paused_message"
                            hint="Shown when the store is paused."
                            error={form.errors.store_paused_message}
                        >
                            <AdminTextarea
                                id="store_paused_message"
                                className="min-h-20"
                                value={form.data.store_paused_message}
                                onChange={(e) => form.setData('store_paused_message', e.target.value)}
                            />
                        </AdminField>
                    </div>
                </AdminPanel>

                <AdminPanel title="Hours">
                    <div className="grid gap-4">
                        <AdminCheckbox
                            label="Enforce ordering hours (Asia/Manila)"
                            checked={form.data.ordering_hours_enabled}
                            onChange={(e) => form.setData('ordering_hours_enabled', e.target.checked)}
                        />
                        <div className="grid gap-4 sm:grid-cols-2">
                            <AdminField label="Opens" htmlFor="ordering_hours_start" error={form.errors.ordering_hours_start}>
                                <AdminInput
                                    id="ordering_hours_start"
                                    type="time"
                                    value={form.data.ordering_hours_start}
                                    onChange={(e) => form.setData('ordering_hours_start', e.target.value)}
                                />
                            </AdminField>
                            <AdminField label="Closes" htmlFor="ordering_hours_end" error={form.errors.ordering_hours_end}>
                                <AdminInput
                                    id="ordering_hours_end"
                                    type="time"
                                    value={form.data.ordering_hours_end}
                                    onChange={(e) => form.setData('ordering_hours_end', e.target.value)}
                                />
                            </AdminField>
                        </div>
                    </div>
                </AdminPanel>

                <AdminPanel title="Shipping & fees">
                    <div className="grid gap-4">
                        <AdminField label="Unlisted destinations" htmlFor="unlisted_area_default" error={form.errors.unlisted_area_default}>
                            <AdminSelect
                                id="unlisted_area_default"
                                value={form.data.unlisted_area_default}
                                onChange={(e) => form.setData('unlisted_area_default', e.target.value)}
                            >
                                <option value="block">Block unlisted destinations</option>
                                <option value="allow">Allow unlisted destinations</option>
                            </AdminSelect>
                        </AdminField>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <AdminField label="Default shipping fee" htmlFor="default_delivery_fee" error={form.errors.default_delivery_fee}>
                                <AdminInput
                                    id="default_delivery_fee"
                                    type="number"
                                    value={form.data.default_delivery_fee}
                                    onChange={(e) => form.setData('default_delivery_fee', Number(e.target.value))}
                                />
                            </AdminField>
                            <AdminField
                                label="COD maximum"
                                htmlFor="cod_maximum"
                                hint="0 means no COD cap."
                                error={form.errors.cod_maximum}
                            >
                                <AdminInput
                                    id="cod_maximum"
                                    type="number"
                                    value={form.data.cod_maximum}
                                    onChange={(e) => form.setData('cod_maximum', Number(e.target.value))}
                                />
                            </AdminField>
                            <AdminField label="Packing fee" htmlFor="packing_fee" error={form.errors.packing_fee}>
                                <AdminInput
                                    id="packing_fee"
                                    type="number"
                                    value={form.data.packing_fee}
                                    onChange={(e) => form.setData('packing_fee', Number(e.target.value))}
                                />
                            </AdminField>
                            <AdminField label="VAT rate (%)" htmlFor="vat_rate" error={form.errors.vat_rate}>
                                <AdminInput
                                    id="vat_rate"
                                    type="number"
                                    value={form.data.vat_rate}
                                    onChange={(e) => form.setData('vat_rate', Number(e.target.value))}
                                />
                            </AdminField>
                        </div>
                        <AdminCheckbox
                            label="Free shipping enabled"
                            checked={form.data.free_delivery_enabled}
                            onChange={(e) => form.setData('free_delivery_enabled', e.target.checked)}
                        />
                        <AdminField label="Free shipping threshold" htmlFor="free_delivery_threshold" hint="Applies only to zones marked free-shipping eligible." error={form.errors.free_delivery_threshold}>
                            <AdminInput
                                id="free_delivery_threshold"
                                type="number"
                                value={form.data.free_delivery_threshold}
                                onChange={(e) => form.setData('free_delivery_threshold', Number(e.target.value))}
                            />
                        </AdminField>
                        <AdminCheckbox
                            label="VAT enabled"
                            checked={form.data.vat_enabled}
                            onChange={(e) => form.setData('vat_enabled', e.target.checked)}
                        />
                    </div>
                </AdminPanel>

                <AdminPanel title="Policies" description="Plain text shown on the storefront policy pages.">
                    <div className="grid gap-4">
                        <AdminField label="Terms" htmlFor="page_terms" error={form.errors.page_terms}>
                            <AdminTextarea
                                id="page_terms"
                                value={form.data.page_terms}
                                onChange={(e) => form.setData('page_terms', e.target.value)}
                            />
                        </AdminField>
                        <AdminField label="Privacy" htmlFor="page_privacy" error={form.errors.page_privacy}>
                            <AdminTextarea
                                id="page_privacy"
                                value={form.data.page_privacy}
                                onChange={(e) => form.setData('page_privacy', e.target.value)}
                            />
                        </AdminField>
                        <AdminField label="Shipping" htmlFor="page_shipping" error={form.errors.page_shipping}>
                            <AdminTextarea
                                id="page_shipping"
                                value={form.data.page_shipping}
                                onChange={(e) => form.setData('page_shipping', e.target.value)}
                            />
                        </AdminField>
                        <AdminField label="Returns" htmlFor="page_returns" error={form.errors.page_returns}>
                            <AdminTextarea
                                id="page_returns"
                                value={form.data.page_returns}
                                onChange={(e) => form.setData('page_returns', e.target.value)}
                            />
                        </AdminField>
                        <AdminField label="Contact" htmlFor="page_contact" error={form.errors.page_contact}>
                            <AdminTextarea
                                id="page_contact"
                                value={form.data.page_contact}
                                onChange={(e) => form.setData('page_contact', e.target.value)}
                            />
                        </AdminField>
                    </div>
                </AdminPanel>

                <AdminButton type="submit" disabled={form.processing}>
                    {form.processing ? 'Saving…' : 'Save settings'}
                </AdminButton>
            </form>
        </AdminLayout>
    );
}
