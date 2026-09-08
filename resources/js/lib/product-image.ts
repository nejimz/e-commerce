const PICSUM = 'https://picsum.photos';

export function placeholderImage(seed: string, width = 800, height = width): string {
    const safe = encodeURIComponent(seed.replace(/\s+/g, '-').toLowerCase() || 'shop');

    return `${PICSUM}/seed/${safe}/${width}/${height}`;
}

export function isBlankImage(src?: string | null): boolean {
    if (!src) {
        return true;
    }

    return /\.svg(\?|$)/i.test(src);
}

export function productImageSrc(src: string | null | undefined, seed: string, size = 800): string {
    if (src && !isBlankImage(src)) {
        return src;
    }

    return placeholderImage(seed, size, size);
}
