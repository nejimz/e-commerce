import { cn } from '@/lib/utils';

type Tone = 'success' | 'warning' | 'danger' | 'info' | 'muted';

const tones: Record<Tone, string> = {
    success: 'bg-[color-mix(in_srgb,var(--shop-success)_12%,white)] text-[var(--shop-success)]',
    warning: 'bg-[color-mix(in_srgb,var(--shop-warning)_14%,white)] text-[var(--shop-warning)]',
    danger: 'bg-[color-mix(in_srgb,var(--shop-danger)_12%,white)] text-[var(--shop-danger)]',
    info: 'bg-[color-mix(in_srgb,var(--shop-info)_12%,white)] text-[var(--shop-info)]',
    muted: 'bg-[var(--shop-bg)] text-[var(--shop-text-muted)]',
};

function pretty(value: string) {
    return String(value).replaceAll('_', ' ');
}

function orderTone(value: string): Tone {
    switch (value) {
        case 'pending':
            return 'warning';
        case 'confirmed':
        case 'packing':
        case 'out_for_delivery':
            return 'info';
        case 'delivered':
            return 'success';
        case 'cancelled':
            return 'danger';
        default:
            return 'muted';
    }
}

function paymentTone(value: string): Tone {
    switch (value) {
        case 'paid':
            return 'success';
        case 'unpaid':
        case 'pending':
            return 'warning';
        case 'failed':
        case 'refunded':
            return 'danger';
        default:
            return 'muted';
    }
}

export function StatusPill({
    value,
    kind = 'generic',
    className,
}: {
    value: string;
    kind?: 'order' | 'payment' | 'stock' | 'generic';
    className?: string;
}) {
    const v = String(value).toLowerCase();
    let tone: Tone = 'muted';
    let label = pretty(v);

    if (kind === 'order') {
        tone = orderTone(v);
        if (v === 'out_for_delivery') {
            label = 'Out for delivery';
        }
    } else if (kind === 'payment') {
        tone = paymentTone(v);
    } else if (kind === 'stock') {
        if (v === 'out of stock' || v === 'out_of_stock') {
            tone = 'danger';
            label = 'Out of stock';
        } else if (v === 'low stock' || v === 'low_stock') {
            tone = 'warning';
            label = 'Low stock';
        } else {
            tone = 'success';
            label = 'In stock';
        }
    } else if (v === 'active' || v === 'allow') {
        tone = 'success';
    } else if (v === 'off' || v === 'inactive' || v === 'block') {
        tone = v === 'block' ? 'danger' : 'muted';
    }

    return (
        <span
            className={cn(
                'inline-flex capitalize items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                tones[tone],
                className,
            )}
        >
            {label}
        </span>
    );
}

export function stockStatus(quantity: number, threshold = 5) {
    if (quantity <= 0) {
        return 'out of stock';
    }
    if (quantity <= threshold) {
        return 'low stock';
    }
    return 'in stock';
}
