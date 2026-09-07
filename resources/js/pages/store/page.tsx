import StoreLayout from '@/layouts/store-layout';
import { ShopBreadcrumb } from '@/components/store/shop-breadcrumb';

export default function StaticPage({ title, body }: { title: string; body: string }) {
    return (
        <StoreLayout title={title}>
            <ShopBreadcrumb items={[{ label: 'Home', href: '/' }, { label: title }]} />
            <article className="max-w-2xl">
                <h1 className="shop-h1">{title}</h1>
                <p className="mt-6 whitespace-pre-wrap leading-relaxed text-[var(--shop-text-muted)]">{body}</p>
            </article>
        </StoreLayout>
    );
}
