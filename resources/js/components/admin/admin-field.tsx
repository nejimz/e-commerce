import InputError from '@/components/input-error';
import { cn } from '@/lib/utils';
import { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

export const adminControlClass =
    'h-11 w-full rounded-md border border-[var(--shop-border)] bg-[var(--shop-surface)] px-3 text-[var(--shop-text)] placeholder:text-[var(--shop-text-dim)] outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-[var(--shop-accent)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

export function AdminField({
    label,
    htmlFor,
    error,
    hint,
    children,
}: {
    label: string;
    htmlFor?: string;
    error?: string;
    hint?: string;
    children: ReactNode;
}) {
    return (
        <div className="space-y-1.5">
            <label htmlFor={htmlFor} className="block text-sm font-medium text-[var(--shop-text)]">
                {label}
            </label>
            {children}
            {hint && !error && <p className="text-sm text-[var(--shop-text-muted)]">{hint}</p>}
            <InputError message={error} className="text-[var(--shop-danger)]" />
        </div>
    );
}

export function AdminInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
    return <input className={cn(adminControlClass, className)} {...props} />;
}

export function AdminSelect({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
    return <select className={cn(adminControlClass, className)} {...props} />;
}

export function AdminTextarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
    return <textarea className={cn(adminControlClass, 'h-auto min-h-24 py-2', className)} {...props} />;
}

export function AdminCheckbox({
    label,
    className,
    ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
    return (
        <label className={cn('flex min-h-11 cursor-pointer items-center gap-3 text-sm', className)}>
            <input
                {...props}
                type="checkbox"
                className="size-4 rounded border-[var(--shop-border)] accent-[var(--shop-accent)]"
            />
            {label}
        </label>
    );
}
