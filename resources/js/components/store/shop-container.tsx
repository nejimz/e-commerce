import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

export function ShopContainer({ children, className }: { children: ReactNode; className?: string }) {
    return <div className={cn('shop-container', className)}>{children}</div>;
}
