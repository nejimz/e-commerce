import { adminBtnClass } from '@/components/admin/admin-button';
import { AdminInput } from '@/components/admin/admin-field';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminPagination, type Paginator } from '@/components/admin/admin-pagination';
import { AdminRow, AdminTable, AdminTd, AdminTh, AdminThead } from '@/components/admin/admin-table';
import { EmptyState } from '@/components/empty-state';
import AdminLayout from '@/layouts/admin-layout';
import { router } from '@inertiajs/react';
import { FormEvent } from 'react';

type CustomerRow = { id: number; name: string; email: string; phone?: string };

export default function CustomersIndex({
    customers,
    filters,
}: {
    customers: Paginator<CustomerRow>;
    filters?: { search?: string };
}) {
    const submit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        router.get('/admin/customers', { search: fd.get('search') }, { preserveState: true });
    };

    return (
        <AdminLayout title="Customers">
            <AdminPageHeader title="Customers" description="Accounts that have registered or placed an order." />
            <form className="mb-4 flex flex-wrap gap-2" onSubmit={submit}>
                <AdminInput
                    name="search"
                    defaultValue={filters?.search || ''}
                    placeholder="Search name or email"
                    className="max-w-xs"
                    aria-label="Search customers"
                />
                <button className={adminBtnClass.secondary} type="submit">
                    Search
                </button>
            </form>
            {customers.data.length === 0 ? (
                <EmptyState title="No customers" body="Customer accounts will appear here after they register." />
            ) : (
                <>
                    <AdminTable>
                        <AdminThead>
                            <tr>
                                <AdminTh>Name</AdminTh>
                                <AdminTh>Email</AdminTh>
                                <AdminTh>Phone</AdminTh>
                            </tr>
                        </AdminThead>
                        <tbody>
                            {customers.data.map((c) => (
                                <AdminRow key={c.id} href={`/admin/customers/${c.id}`}>
                                    <AdminTd className="font-medium">{c.name}</AdminTd>
                                    <AdminTd>{c.email}</AdminTd>
                                    <AdminTd>{c.phone || '—'}</AdminTd>
                                </AdminRow>
                            ))}
                        </tbody>
                    </AdminTable>
                    <AdminPagination paginator={customers} />
                </>
            )}
        </AdminLayout>
    );
}
