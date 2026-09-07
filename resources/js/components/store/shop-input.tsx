import { forwardRef, type InputHTMLAttributes, type LabelHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

export const shopControlClass =
    'h-11 w-full rounded-[var(--shop-radius-control)] border border-[var(--shop-border)] bg-[var(--shop-surface)] px-3 text-[15px] text-[var(--shop-text)] outline-none transition-[border-color,box-shadow] duration-[var(--shop-duration-micro)] ease-[var(--shop-ease)] placeholder:text-[var(--shop-text-dim)] focus-visible:border-[var(--shop-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--shop-accent)] disabled:opacity-45';

export const ShopInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function ShopInput({ className, ...props }, ref) {
    return <input ref={ref} className={cn(shopControlClass, className)} {...props} />;
});

export function ShopSelect({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
    return (
        <select className={cn(shopControlClass, 'bg-[var(--shop-surface)]', className)} {...props}>
            {children}
        </select>
    );
}

export function ShopTextarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
    return <textarea className={cn(shopControlClass, 'h-auto min-h-24 py-2.5', className)} {...props} />;
}

export function ShopLabel({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
    return <label className={cn('shop-caption mb-1.5 block text-[var(--shop-text)]', className)} {...props} />;
}
