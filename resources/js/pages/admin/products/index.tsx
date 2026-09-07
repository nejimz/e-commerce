import { adminBtnClass } from '@/components/admin/admin-button';
import { AdminInput } from '@/components/admin/admin-field';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminPagination, type Paginator } from '@/components/admin/admin-pagination';
import { AdminRow, AdminTable, AdminTd, AdminTh, AdminThead } from '@/components/admin/admin-table';
import { StatusPill, stockStatus } from '@/components/admin/status-pill';
import { EmptyState } from '@/components/empty-state';
import { formatMoney } from '@/components/product-card';
import AdminLayout from '@/layouts/admin-layout';
import { Link, router } from '@inertiajs/react';
import { FormEvent } from 'react';

type ProductRow = {
    id: number;
    name: string;
    sku: string;
    price: number;
    stock_quantity: number;
    low_stock_threshold?: number;
};

export default function ProductsIndex({
    products,
    filters,
}: {
    products: Paginator<ProductRow>;
    filters?: { search?: string };
}) {
    const submit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        router.get('/admin/products', { search: fd.get('search') }, { preserveState: true });
    };

    return (
        <AdminLayout title="Products">
            <AdminPageHeader
                title="Products"
                description="Catalog, pricing, and stock."
                actions={
                    <Link href="/admin/products/create" className={adminBtnClass.primary}>
                        New product
                    </Link>
                }
            />
            <form className="mb-4 flex flex-wrap gap-2" onSubmit={submit}>
                <AdminInput
                    name="search"
                    defaultValue={filters?.search || ''}
                    placeholder="Search name or SKU"
                    className="max-w-xs"
                    aria-label="Search products"
                />
                <button className={adminBtnClass.secondary} type="submit">
                    Search
                </button>
            </form>

            {products.data.length === 0 ? (
                <EmptyState title="No products" body="Create a product to start selling.">
                    <Link href="/admin/products/create" className={adminBtnClass.primary}>
                        New product
                    </Link>
                </EmptyState>
            ) : (
                <>
                    <AdminTable>
                        <AdminThead>
                            <tr>
                                <AdminTh>Name</AdminTh>
                                <AdminTh>SKU</AdminTh>
                                <AdminTh numeric>Price</AdminTh>
                                <AdminTh>Stock</AdminTh>
                            </tr>
                        </AdminThead>
                        <tbody>
                            {products.data.map((p) => (
                                <AdminRow key={p.id} href={`/admin/products/${p.id}/edit`}>
                                    <AdminTd className="font-medium">{p.name}</AdminTd>
                                    <AdminTd className="text-[var(--shop-text-muted)]">{p.sku}</AdminTd>
                                    <AdminTd numeric>{formatMoney(p.price)}</AdminTd>
                                    <AdminTd>
                                        <StatusPill kind="stock" value={stockStatus(p.stock_quantity, p.low_stock_threshold ?? 5)} />
                                        <span className="ml-2 tabular-nums text-[var(--shop-text-muted)]">{p.stock_quantity}</span>
                                    </AdminTd>
                                </AdminRow>
                            ))}
                        </tbody>
                    </AdminTable>
                    <AdminPagination paginator={products} />
                </>
            )}
        </AdminLayout>
    );
}
