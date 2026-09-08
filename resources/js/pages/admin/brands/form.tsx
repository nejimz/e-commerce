import { AdminButton } from '@/components/admin/admin-button';
import { AdminCheckbox, AdminField, AdminInput, AdminTextarea } from '@/components/admin/admin-field';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminPanel } from '@/components/admin/admin-panel';
import AdminLayout from '@/layouts/admin-layout';
import { useForm } from '@inertiajs/react';
import { FormEvent } from 'react';

type BrandFormRecord = {
    id: number;
    name: string;
    description: string | null;
    logo_url: string | null;
    is_active: boolean;
    meta_title: string | null;
    meta_description: string | null;
};

export default function BrandForm({ brand }: { brand: BrandFormRecord | null }) {
    const form = useForm({
        name: brand?.name || '',
        description: brand?.description || '',
        logo: null as File | null,
        is_active: brand?.is_active ?? true,
        meta_title: brand?.meta_title || '',
        meta_description: brand?.meta_description || '',
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        if (brand) {
            form.patch(`/admin/brands/${brand.id}`, { forceFormData: true });
        } else {
            form.post('/admin/brands', { forceFormData: true });
        }
    };

    return (
        <AdminLayout title={brand ? 'Edit brand' : 'New brand'}>
            <AdminPageHeader
                title={brand ? 'Edit brand' : 'New brand'}
                description={brand ? brand.name : 'Name, logo, and SEO for the brand landing page.'}
            />
            <form onSubmit={submit} className="grid max-w-3xl gap-6">
                <AdminPanel title="Basics">
                    <div className="grid gap-4">
                        <AdminField label="Name" htmlFor="name" error={form.errors.name}>
                            <AdminInput id="name" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} />
                        </AdminField>
                        <AdminField label="Description" htmlFor="description" error={form.errors.description}>
                            <AdminTextarea
                                id="description"
                                value={form.data.description}
                                onChange={(e) => form.setData('description', e.target.value)}
                            />
                        </AdminField>
                        <AdminField label="Logo" htmlFor="logo" error={form.errors.logo}>
                            <input
                                id="logo"
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                className="text-sm"
                                onChange={(e) => form.setData('logo', e.target.files?.[0] ?? null)}
                            />
                        </AdminField>
                        {brand?.logo_url && !form.data.logo && (
                            <img src={brand.logo_url} alt="" className="h-12 w-auto max-w-40 object-contain" />
                        )}
                        <AdminCheckbox
                            label="Active"
                            checked={form.data.is_active}
                            onChange={(e) => form.setData('is_active', e.target.checked)}
                        />
                    </div>
                </AdminPanel>
                <AdminPanel title="SEO">
                    <div className="grid gap-4">
                        <AdminField label="Meta title" htmlFor="meta_title" error={form.errors.meta_title}>
                            <AdminInput
                                id="meta_title"
                                value={form.data.meta_title}
                                onChange={(e) => form.setData('meta_title', e.target.value)}
                            />
                        </AdminField>
                        <AdminField label="Meta description" htmlFor="meta_description" error={form.errors.meta_description}>
                            <AdminTextarea
                                id="meta_description"
                                value={form.data.meta_description}
                                onChange={(e) => form.setData('meta_description', e.target.value)}
                            />
                        </AdminField>
                    </div>
                </AdminPanel>
                <AdminButton type="submit" disabled={form.processing}>
                    {form.processing ? 'Saving…' : 'Save'}
                </AdminButton>
            </form>
        </AdminLayout>
    );
}
