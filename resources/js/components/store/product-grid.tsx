import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

export function ProductGrid({ children, className }: { children: ReactNode; className?: string }) {
    return <div className={cn('shop-grid', className)}>{children}</div>;
}
