import { Minus, Plus } from 'lucide-react';

import { cn } from '@/lib/utils';

export function QuantityStepper({
    value,
    min = 1,
    max,
    onChange,
    disabled,
    className,
}: {
    value: number;
    min?: number;
    max: number;
    onChange: (next: number) => void;
    disabled?: boolean;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'inline-flex h-11 items-center rounded-[var(--shop-radius-control)] border border-[var(--shop-border)] bg-[var(--shop-surface)]',
                className,
            )}
        >
            <button
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center disabled:opacity-40"
                aria-label="Decrease quantity"
                disabled={disabled || value <= min}
                onClick={() => onChange(value - 1)}
            >
                <Minus className="h-4 w-4" />
            </button>
            <span className="min-w-8 text-center tabular-nums" aria-live="polite">
                {value}
            </span>
            <button
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center disabled:opacity-40"
                aria-label="Increase quantity"
                disabled={disabled || value >= max}
                onClick={() => onChange(value + 1)}
            >
                <Plus className="h-4 w-4" />
            </button>
        </div>
    );
}
