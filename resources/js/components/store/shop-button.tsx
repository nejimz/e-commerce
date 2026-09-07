import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ButtonHTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

const shopButtonVariants = cva(
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--shop-radius-control)] text-sm font-medium transition-[background-color,color,border-color,opacity,transform] duration-[var(--shop-duration-micro)] ease-[var(--shop-ease)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--shop-accent)] disabled:pointer-events-none disabled:opacity-45',
    {
        variants: {
            variant: {
                primary:
                    'bg-[var(--shop-accent)] text-[var(--shop-on-accent)] hover:bg-[var(--shop-accent-hi)] active:bg-[var(--shop-accent-lo)]',
                secondary:
                    'border border-[var(--shop-border)] bg-[var(--shop-surface)] text-[var(--shop-text)] hover:border-[var(--shop-text-dim)]',
                ghost: 'text-[var(--shop-text)] hover:bg-[var(--shop-bg)]',
                danger: 'bg-[var(--shop-danger)] text-white hover:opacity-90',
            },
            size: {
                sm: 'h-9 px-3',
                md: 'h-11 px-4',
                lg: 'h-[52px] w-full px-5 text-base',
            },
        },
        defaultVariants: {
            variant: 'primary',
            size: 'md',
        },
    },
);

export type ShopButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
    VariantProps<typeof shopButtonVariants> & {
        asChild?: boolean;
    };

export function ShopButton({ className, variant, size, asChild = false, type, ...props }: ShopButtonProps) {
    const Comp = asChild ? Slot : 'button';

    return <Comp className={cn(shopButtonVariants({ variant, size, className }))} type={asChild ? undefined : (type ?? 'button')} {...props} />;
}

export { shopButtonVariants };
