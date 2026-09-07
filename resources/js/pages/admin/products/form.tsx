import { AdminButton } from '@/components/admin/admin-button';
import { AdminCheckbox, AdminField, AdminInput, AdminSelect, AdminTextarea } from '@/components/admin/admin-field';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminPanel } from '@/components/admin/admin-panel';
import AdminLayout from '@/layouts/admin-layout';
import { router, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';

export default function ProductForm({
    product,
    categories,
    brands,
}: {
    product: any | null;
    categories: { id: number; name: string }[];
    brands: { id: number; name: string }[];
}) {
    const form = useForm({
        name: product?.name || '',
        sku: product?.sku || '',
        category_id: product?.category_id || categories[0]?.id || '',
        brand_id: product?.brand_id || '',
        short_description: product?.short_description || '',
        description: product?.description || '',
        price: product?.price || '0',
        compare_at_price: product?.compare_at_price || '',
        stock_quantity: product?.stock_quantity ?? 0,
        low_stock_threshold: product?.low_stock_threshold ?? 5,
        has_variants: product?.has_variants || false,
        is_featured: product?.is_featured || false,
        is_active: product?.is_active ?? true,
        meta_title: product?.meta_title || '',
        meta_description: product?.meta_description || '',
    });
    const stock = useForm({ stock_quantity: product?.stock_quantity ?? 0, reason: 'Manual adjustment', variant_id: '' });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        if (product) {
            form.patch(`/admin/products/${product.id}`);
        } else {
            form.post('/admin/products');
        }
    };

    return (
        <AdminLayout title={product ? 'Edit product' : 'New product'}>
            <AdminPageHeader
                title={product ? 'Edit product' : 'New product'}
                description={product ? product.name : 'Basics, pricing, inventory, and SEO.'}
            />
            <form onSubmit={submit} className="grid max-w-3xl gap-6">
                <AdminPanel title="Basics">
                    <div className="grid gap-4">
                        <AdminField label="Name" htmlFor="name" error={form.errors.name}>
                            <AdminInput id="name" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} />
                        </AdminField>
                        <AdminField label="SKU" htmlFor="sku" error={form.errors.sku}>
                            <AdminInput id="sku" value={form.data.sku} onChange={(e) => form.setData('sku', e.target.value)} />
                        </AdminField>
                        <AdminField label="Category" htmlFor="category_id" error={form.errors.category_id}>
                            <AdminSelect
                                id="category_id"
                                value={form.data.category_id}
                                onChange={(e) => form.setData('category_id', e.target.value)}
                            >
                                {categories.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </AdminSelect>
                        </AdminField>
                        <AdminField label="Brand" htmlFor="brand_id" error={form.errors.brand_id}>
                            <AdminSelect id="brand_id" value={form.data.brand_id} onChange={(e) => form.setData('brand_id', e.target.value)}>
                                <option value="">No brand</option>
                                {brands.map((b) => (
                                    <option key={b.id} value={b.id}>
                                        {b.name}
                                    </option>
                                ))}
                            </AdminSelect>
                        </AdminField>
                        <AdminField label="Short description" htmlFor="short_description" error={form.errors.short_description}>
                            <AdminTextarea
                                id="short_description"
                                value={form.data.short_description}
                                onChange={(e) => form.setData('short_description', e.target.value)}
                            />
                        </AdminField>
                        <AdminField label="Description" htmlFor="description" error={form.errors.description}>
                            <AdminTextarea
                                id="description"
                                className="min-h-32"
                                value={form.data.description}
                                onChange={(e) => form.setData('description', e.target.value)}
                            />
                        </AdminField>
                        <AdminCheckbox
                            label="Active"
                            checked={form.data.is_active}
                            onChange={(e) => form.setData('is_active', e.target.checked)}
                        />
                        <AdminCheckbox
                            label="Featured"
                            checked={form.data.is_featured}
                            onChange={(e) => form.setData('is_featured', e.target.checked)}
                        />
                    </div>
                </AdminPanel>
                <AdminPanel title="Pricing">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <AdminField label="Price" htmlFor="price" error={form.errors.price}>
                            <AdminInput
                                id="price"
                                type="number"
                                step="0.01"
                                value={form.data.price}
                                onChange={(e) => form.setData('price', e.target.value)}
                            />
                        </AdminField>
                        <AdminField label="Compare at" htmlFor="compare_at_price" error={form.errors.compare_at_price}>
                            <AdminInput
                                id="compare_at_price"
                                type="number"
                                step="0.01"
                                value={form.data.compare_at_price}
                                onChange={(e) => form.setData('compare_at_price', e.target.value)}
                            />
                        </AdminField>
                    </div>
                </AdminPanel>
                <AdminPanel title="Inventory">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <AdminField label="Stock quantity" htmlFor="stock_quantity" error={form.errors.stock_quantity}>
                            <AdminInput
                                id="stock_quantity"
                                type="number"
                                value={form.data.stock_quantity}
                                onChange={(e) => form.setData('stock_quantity', Number(e.target.value))}
                            />
                        </AdminField>
                        <AdminField label="Low stock threshold" htmlFor="low_stock_threshold" error={form.errors.low_stock_threshold}>
                            <AdminInput
                                id="low_stock_threshold"
                                type="number"
                                value={form.data.low_stock_threshold}
                                onChange={(e) => form.setData('low_stock_threshold', Number(e.target.value))}
                            />
                        </AdminField>
                    </div>
                </AdminPanel>
                <AdminPanel title="SEO">
                    <div className="grid gap-4">
                        <AdminField label="Meta title" htmlFor="meta_title" error={form.errors.meta_title}>
                            <AdminInput id="meta_title" value={form.data.meta_title} onChange={(e) => form.setData('meta_title', e.target.value)} />
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

            {product && (
                <div className="mt-8 grid max-w-3xl gap-6">
                    <AdminPanel title="Adjust stock">
                        <form
                            className="grid gap-4 sm:grid-cols-2"
                            onSubmit={(e) => {
                                e.preventDefault();
                                stock.post(`/admin/products/${product.id}/stock`);
                            }}
                        >
                            <AdminField label="Quantity" htmlFor="adj_qty" error={stock.errors.stock_quantity}>
                                <AdminInput
                                    id="adj_qty"
                                    type="number"
                                    value={stock.data.stock_quantity}
                                    onChange={(e) => stock.setData('stock_quantity', Number(e.target.value))}
                                />
                            </AdminField>
                            <AdminField label="Reason" htmlFor="adj_reason" error={stock.errors.reason}>
                                <AdminInput id="adj_reason" value={stock.data.reason} onChange={(e) => stock.setData('reason', e.target.value)} />
                            </AdminField>
                            <AdminButton type="submit" variant="secondary" disabled={stock.processing}>
                                Log adjustment
                            </AdminButton>
                        </form>
                    </AdminPanel>
                    <AdminPanel title="Media">
                        <form
                            className="flex flex-wrap items-end gap-3"
                            onSubmit={(e) => {
                                e.preventDefault();
                                const fd = new FormData(e.currentTarget);
                                router.post(`/admin/products/${product.id}/images`, fd);
                            }}
                        >
                            <AdminField label="Image" htmlFor="image">
                                <input id="image" type="file" name="image" accept="image/*" className="text-sm" />
                            </AdminField>
                            <AdminButton type="submit" variant="secondary">
                                Upload
                            </AdminButton>
                        </form>
                        <div className="mt-4 flex flex-wrap gap-2">
                            {product.images?.map((img: { id: number; path_webp?: string; path: string }) => (
                                <img
                                    key={img.id}
                                    src={`/storage/${img.path_webp || img.path}`}
                                    alt={product.name}
                                    className="h-20 w-20 rounded-lg object-cover"
                                />
                            ))}
                        </div>
                    </AdminPanel>
                </div>
            )}
        </AdminLayout>
    );
}
