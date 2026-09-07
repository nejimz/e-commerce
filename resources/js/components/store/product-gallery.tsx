import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export type GalleryImage = { url: string; alt?: string | null };

export function ProductGallery({ images, productName }: { images: GalleryImage[]; productName: string }) {
    const [index, setIndex] = useState(0);
    const [open, setOpen] = useState(false);
    const current = images[index];

    if (!current) {
        return (
            <div className="flex aspect-square items-center justify-center rounded-[var(--shop-radius-image)] bg-[var(--shop-surface)] text-[var(--shop-text-muted)]">
                No image
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="-mx-4 aspect-square overflow-hidden bg-[var(--shop-surface)] md:mx-0 md:rounded-[var(--shop-radius-image)]"
                aria-label="View larger image"
            >
                <img src={current.url} alt={current.alt || productName} className="h-full w-full object-cover" />
            </button>
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
                                'h-20 w-20 shrink-0 overflow-hidden rounded-[var(--shop-radius-image)] border-2',
                                i === index ? 'border-[var(--shop-accent)]' : 'border-transparent',
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
