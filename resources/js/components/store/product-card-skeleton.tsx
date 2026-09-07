import { Skeleton } from '@/components/empty-state';

export function ProductCardSkeleton() {
    return (
        <div>
            <Skeleton className="aspect-square rounded-[var(--shop-radius-image)]" />
            <Skeleton className="mt-3 h-3 w-16" />
            <Skeleton className="mt-2 h-4 w-3/4" />
            <Skeleton className="mt-2 h-4 w-20" />
        </div>
    );
}
