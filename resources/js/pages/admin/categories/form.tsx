import { AdminButton } from '@/components/admin/admin-button';
import { AdminCheckbox, AdminField, AdminInput, AdminSelect, AdminTextarea } from '@/components/admin/admin-field';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminPanel } from '@/components/admin/admin-panel';
import AdminLayout from '@/layouts/admin-layout';
import { useForm } from '@inertiajs/react';
import { FormEvent } from 'react';

type CategoryFormRecord = {
    id: number;
    name: string;
    parent_id: number | null;
    description: string | null;
    image_url: string | null;
    sort_order: number;
    is_active: boolean;
    meta_title: string | null;
    meta_description: string | null;
};

export default function CategoryForm({
    category,
    parents,
}: {
    category: CategoryFormRecord | null;
    parents: { id: number; name: string }[];
}) {
    const form = useForm({
        name: category?.name || '',
        parent_id: category?.parent_id || '',
        description: category?.description || '',
        image: null as File | null,
        sort_order: category?.sort_order ?? '',
        is_active: category?.is_active ?? true,
        meta_title: category?.meta_title || '',
        meta_description: category?.meta_description || '',
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        if (category) {
            form.patch(`/admin/categories/${category.id}`, { forceFormData: true });
        } else {
            form.post('/admin/categories', { forceFormData: true });
        }
    };

    return (
        <AdminLayout title={category ? 'Edit category' : 'New category'}>
            <AdminPageHeader
                title={category ? 'Edit category' : 'New category'}
                description={category ? category.name : 'Top-level or one subcategory under an existing parent.'}
            />
            <form onSubmit={submit} className="grid max-w-3xl gap-6">
                <AdminPanel title="Basics">
                    <div className="grid gap-4">
                        <AdminField label="Name" htmlFor="name" error={form.errors.name}>
                            <AdminInput id="name" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} />
                        </AdminField>
                        <AdminField
                            label="Parent"
                            htmlFor="parent_id"
                            error={form.errors.parent_id}
                            hint="Leave as top level, or pick an existing parent. A third level is not allowed."
                        >
                            <AdminSelect
                                id="parent_id"
                                value={form.data.parent_id}
                                onChange={(e) => form.setData('parent_id', e.target.value)}
                            >
                                <option value="">Top level</option>
                                {parents.map((parent) => (
                                    <option key={parent.id} value={parent.id}>
                                        {parent.name}
                                    </option>
                                ))}
                            </AdminSelect>
                        </AdminField>
                        <AdminField label="Description" htmlFor="description" error={form.errors.description}>
                            <AdminTextarea
                                id="description"
                                value={form.data.description}
                                onChange={(e) => form.setData('description', e.target.value)}
                            />
                        </AdminField>
                        <AdminField
                            label="Sort order"
                            htmlFor="sort_order"
                            error={form.errors.sort_order}
                            hint="Lower numbers appear first among siblings."
                        >
                            <AdminInput
                                id="sort_order"
                                type="number"
                                value={form.data.sort_order}
                                onChange={(e) => form.setData('sort_order', Number(e.target.value))}
                            />
                        </AdminField>
                        <AdminField label="Image" htmlFor="image" error={form.errors.image}>
                            <input
                                id="image"
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                className="text-sm"
                                onChange={(e) => form.setData('image', e.target.files?.[0] ?? null)}
                            />
                        </AdminField>
                        {category?.image_url && !form.data.image && (
                            <img src={category.image_url} alt="" className="h-20 w-20 rounded-lg object-cover" />
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
