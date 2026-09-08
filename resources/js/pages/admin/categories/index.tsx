import { AdminButton, adminBtnClass } from '@/components/admin/admin-button';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminRow, AdminTable, AdminTd, AdminTh, AdminThead } from '@/components/admin/admin-table';
import { ConfirmButton } from '@/components/admin/confirm-button';
import { StatusPill } from '@/components/admin/status-pill';
import { EmptyState } from '@/components/empty-state';
import AdminLayout from '@/layouts/admin-layout';
import { cn } from '@/lib/utils';
import { Link, router } from '@inertiajs/react';

type CategoryRow = {
    id: number;
    name: string;
    slug: string;
    is_active: boolean;
    products_count: number;
    parent_id: number | null;
    children?: CategoryRow[];
};

type FlatRow = CategoryRow & { depth: number; isFirst: boolean; isLast: boolean };

function flatten(parents: CategoryRow[]): FlatRow[] {
    const rows: FlatRow[] = [];
    parents.forEach((parent, index) => {
        rows.push({ ...parent, depth: 0, isFirst: index === 0, isLast: index === parents.length - 1 });
        const children = parent.children ?? [];
        children.forEach((child, childIndex) => {
            rows.push({
                ...child,
                depth: 1,
                isFirst: childIndex === 0,
                isLast: childIndex === children.length - 1,
            });
        });
    });

    return rows;
}

function move(id: number, direction: 'up' | 'down') {
    router.patch(`/admin/categories/${id}/move`, { direction }, { preserveScroll: true });
}

export default function CategoriesIndex({ categories }: { categories: CategoryRow[] }) {
    const rows = flatten(categories);

    return (
        <AdminLayout title="Categories">
            <AdminPageHeader
                title="Categories"
                description="Two-level catalog tree. Deactivate instead of deleting categories that still have products."
                actions={
                    <Link href="/admin/categories/create" className={adminBtnClass.primary}>
                        New category
                    </Link>
                }
            />

            {rows.length === 0 ? (
                <EmptyState title="No categories" body="Create a top-level category, then add subcategories if you need them.">
                    <Link href="/admin/categories/create" className={adminBtnClass.primary}>
                        New category
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
                        {rows.map((row) => (
                            <AdminRow key={row.id}>
                                <AdminTd className={cn('font-medium', row.depth === 1 && 'pl-10')}>
                                    {row.name}
                                </AdminTd>
                                <AdminTd className="text-[var(--shop-text-muted)]">{row.slug}</AdminTd>
                                <AdminTd numeric>{row.products_count}</AdminTd>
                                <AdminTd>
                                    <StatusPill value={row.is_active ? 'active' : 'off'} />
                                </AdminTd>
                                <AdminTd>
                                    <div className="flex flex-wrap items-center justify-end gap-1">
                                        <AdminButton
                                            variant="ghost"
                                            className="h-auto px-2 py-1"
                                            disabled={row.isFirst}
                                            onClick={() => move(row.id, 'up')}
                                        >
                                            Up
                                        </AdminButton>
                                        <AdminButton
                                            variant="ghost"
                                            className="h-auto px-2 py-1"
                                            disabled={row.isLast}
                                            onClick={() => move(row.id, 'down')}
                                        >
                                            Down
                                        </AdminButton>
                                        <Link
                                            href={`/admin/categories/${row.id}/edit`}
                                            className={cn(adminBtnClass.secondary, 'h-auto px-2 py-1')}
                                        >
                                            Edit
                                        </Link>
                                        <ConfirmButton
                                            recordName={row.name}
                                            description={
                                                row.products_count > 0 || (row.children?.length ?? 0) > 0
                                                    ? 'Categories with products or subcategories cannot be deleted. Deactivate instead.'
                                                    : `This will remove ${row.name} from the catalog.`
                                            }
                                            confirmLabel={`Remove ${row.name}`}
                                            onConfirm={() => router.delete(`/admin/categories/${row.id}`)}
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
