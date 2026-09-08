import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef, useState } from 'react';

export type GalleryImage = { url: string; alt?: string | null };

export function ProductGallery({ images, productName }: { images: GalleryImage[]; productName: string }) {
    const [index, setIndex] = useState(0);
    const [open, setOpen] = useState(false);
    const touchStart = useRef<number | null>(null);
    const current = images[index];

    if (!current) {
        return (
            <div className="flex aspect-square items-center justify-center rounded-[var(--shop-radius-image)] bg-[var(--shop-surface)] text-[var(--shop-text-muted)]">
                No image
            </div>
        );
    }

    const go = (next: number) => {
        const last = images.length - 1;
        setIndex(next < 0 ? last : next > last ? 0 : next);
    };

    return (
        <div className="space-y-3">
            <div
                className="group relative -mx-4 overflow-hidden bg-[var(--shop-surface)] md:mx-0 md:rounded-[var(--shop-radius-image)]"
                onTouchStart={(e) => {
                    touchStart.current = e.changedTouches[0]?.clientX ?? null;
                }}
                onTouchEnd={(e) => {
                    const start = touchStart.current;
                    const end = e.changedTouches[0]?.clientX;
                    touchStart.current = null;
                    if (start == null || end == null || images.length < 2) {
                        return;
                    }
                    const delta = start - end;
                    if (Math.abs(delta) > 40) {
                        go(index + (delta > 0 ? 1 : -1));
                    }
                }}
            >
                <button type="button" onClick={() => setOpen(true)} className="block aspect-square w-full" aria-label="View larger image">
                    <img src={current.url} alt={current.alt || productName} className="h-full w-full object-cover" />
                </button>
                {images.length > 1 && (
                    <>
                        <button
                            type="button"
                            className="absolute left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--shop-surface)]/90 text-[var(--shop-text)] shadow-[var(--shop-shadow-e1)] md:group-hover:inline-flex"
                            aria-label="Previous image"
                            onClick={() => go(index - 1)}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            className="absolute right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--shop-surface)]/90 text-[var(--shop-text)] shadow-[var(--shop-shadow-e1)] md:group-hover:inline-flex"
                            aria-label="Next image"
                            onClick={() => go(index + 1)}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </>
                )}
            </div>
            {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto px-0">
                    {images.map((img, i) => (
                        <button
                            key={`${img.url}-${i}`}
                            type="button"
                            onClick={() => setIndex(i)}
                            aria-label={`View image ${i + 1}`}
                            aria-current={i === index}
                            className={cn(
                                'h-16 w-16 shrink-0 overflow-hidden rounded-[var(--shop-radius-image)] ring-2 ring-offset-2 ring-offset-[var(--shop-bg)] md:h-20 md:w-20',
                                i === index ? 'ring-[var(--shop-accent)]' : 'ring-transparent hover:ring-[var(--shop-border)]',
                            )}
                        >
                            <img src={img.url} alt={img.alt || `${productName} ${i + 1}`} className="h-full w-full object-cover" />
                        </button>
                    ))}
                </div>
            )}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-3xl border-none bg-transparent p-0 shadow-none">
                    <DialogTitle className="sr-only">{current.alt || productName}</DialogTitle>
                    <img src={current.url} alt={current.alt || productName} className="max-h-[85vh] w-full rounded-[var(--shop-radius-image)] object-contain" />
                </DialogContent>
            </Dialog>
        </div>
    );
}
