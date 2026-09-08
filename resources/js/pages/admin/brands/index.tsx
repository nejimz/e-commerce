import { adminBtnClass } from '@/components/admin/admin-button';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminRow, AdminTable, AdminTd, AdminTh, AdminThead } from '@/components/admin/admin-table';
import { ConfirmButton } from '@/components/admin/confirm-button';
import { StatusPill } from '@/components/admin/status-pill';
import { EmptyState } from '@/components/empty-state';
import AdminLayout from '@/layouts/admin-layout';
import { cn } from '@/lib/utils';
import { Link, router } from '@inertiajs/react';

type BrandRow = {
    id: number;
    name: string;
    slug: string;
    is_active: boolean;
    products_count: number;
};

export default function BrandsIndex({ brands }: { brands: BrandRow[] }) {
    return (
        <AdminLayout title="Brands">
            <AdminPageHeader
                title="Brands"
                description="Managed brands for product listings and storefront facets. Deactivate instead of deleting brands that still have products."
                actions={
                    <Link href="/admin/brands/create" className={adminBtnClass.primary}>
                        New brand
                    </Link>
                }
            />

            {brands.length === 0 ? (
                <EmptyState title="No brands" body="Create a brand, then assign it on a product.">
                    <Link href="/admin/brands/create" className={adminBtnClass.primary}>
                        New brand
                    </Link>
                </EmptyState>
            ) : (
                <AdminTable>
                    <AdminThead>
                        <tr>
                            <AdminTh>Name</AdminTh>
                            <AdminTh>Slug</AdminTh>
                            <AdminTh numeric>Products</AdminTh>
                            <AdminTh>Status</AdminTh>
                            <AdminTh> </AdminTh>
                        </tr>
                    </AdminThead>
                    <tbody>
                        {brands.map((row) => (
                            <AdminRow key={row.id}>
                                <AdminTd className="font-medium">{row.name}</AdminTd>
                                <AdminTd className="text-[var(--shop-text-muted)]">{row.slug}</AdminTd>
                                <AdminTd numeric>{row.products_count}</AdminTd>
                                <AdminTd>
                                    <StatusPill value={row.is_active ? 'active' : 'off'} />
                                </AdminTd>
                                <AdminTd>
                                    <div className="flex flex-wrap items-center justify-end gap-1">
                                        <Link
                                            href={`/admin/brands/${row.id}/edit`}
                                            className={cn(adminBtnClass.secondary, 'h-auto px-2 py-1')}
                                        >
                                            Edit
                                        </Link>
                                        <ConfirmButton
                                            recordName={row.name}
                                            description={
                                                row.products_count > 0
                                                    ? 'Brands with products cannot be deleted. Deactivate instead.'
                                                    : `This will remove ${row.name} from the catalog.`
                                            }
                                            confirmLabel={`Remove ${row.name}`}
                                            onConfirm={() => router.delete(`/admin/brands/${row.id}`)}
                                        >
                                            Delete
                                        </ConfirmButton>
                                    </div>
                                </AdminTd>
                            </AdminRow>
                        ))}
                    </tbody>
                </AdminTable>
            )}
        </AdminLayout>
    );
}
