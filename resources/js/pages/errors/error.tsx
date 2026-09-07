import { Head, Link } from '@inertiajs/react';

const copy: Record<number, { title: string; body: string }> = {
    403: { title: 'No access', body: 'You do not have permission to view this page.' },
    404: { title: 'Page not found', body: 'We could not find that page.' },
    419: { title: 'Session expired', body: 'Please refresh and try again.' },
    429: { title: 'Too many requests', body: 'Please wait a moment and try again.' },
    500: { title: 'Something went wrong', body: 'Please try again in a few minutes.' },
};

export default function ErrorPage({ status, message }: { status: number; message?: string }) {
    const c = copy[status] || copy[500];
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--shop-bg)] px-4 text-center text-[var(--shop-text)]">
            <Head title={c.title} />
            <p className="text-sm text-[var(--shop-text-muted)]">{status}</p>
            <h1 className="mt-2 text-3xl font-semibold">{c.title}</h1>
            <p className="mt-2 max-w-md text-[var(--shop-text-muted)]">{message || c.body}</p>
            <Link href="/" className="mt-6 h-11 rounded-md bg-[var(--shop-accent)] px-4 leading-[2.75rem] text-[var(--shop-on-accent)]">
                Back to shop
            </Link>
        </div>
    );
}
