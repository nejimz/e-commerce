<?php

namespace App\Support;

use Illuminate\Support\Str;

class CatalogSeo
{
    /**
     * @param  array<string, mixed>  $filters
     * @param  iterable<int, array{slug: string, name: string}>  $productCards
     * @return array{title: string, description: string, canonical: string, robots: string, og_image: ?string, og_type: string, jsonLd: array<string, mixed>}
     */
    public static function listing(
        string $storeName,
        string $path,
        string $heading,
        ?string $description,
        ?string $metaTitle,
        ?string $metaDescription,
        array $filters,
        int $page,
        int $total,
        iterable $productCards,
        bool $categoryLocked,
        bool $brandLocked,
        ?string $ogImage = null,
    ): array {
        $faceted = self::isFaceted($filters, $categoryLocked, $brandLocked);
        $title = $metaTitle ?: ($heading === $storeName ? $heading : $heading.' | '.$storeName);
        $title = Str::limit($title, 70, '');

        $descSource = $metaDescription ?: $description ?: 'Shop '.$heading.' at '.$storeName.'. Prices in PHP.';
        $descriptionText = Str::limit(trim((string) preg_replace('/\s+/', ' ', strip_tags($descSource))), 160, '');

        $canonical = url($path);
        if (! $faceted && $page > 1) {
            $canonical .= '?page='.$page;
        }

        $items = [];
        $position = 1;
        foreach ($productCards as $card) {
            $items[] = [
                '@type' => 'ListItem',
                'position' => $position++,
                'url' => url('/products/'.$card['slug']),
                'name' => $card['name'],
            ];
        }

        return [
            'title' => $title,
            'description' => $descriptionText,
            'canonical' => $canonical,
            'robots' => $faceted ? 'noindex,follow' : 'index,follow',
            'og_image' => $ogImage,
            'og_type' => 'website',
            'jsonLd' => [
                '@context' => 'https://schema.org',
                '@type' => 'CollectionPage',
                'name' => $heading,
                'description' => $descriptionText,
                'url' => $canonical,
                'mainEntity' => [
                    '@type' => 'ItemList',
                    'numberOfItems' => $total,
                    'itemListElement' => $items,
                ],
            ],
        ];
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    public static function isFaceted(array $filters, bool $categoryLocked, bool $brandLocked): bool
    {
        foreach (['q', 'min_price', 'max_price', 'in_stock', 'sort'] as $key) {
            if (filled($filters[$key] ?? null)) {
                return true;
            }
        }
        if (! $categoryLocked && filled($filters['category'] ?? null)) {
            return true;
        }
        if (! $brandLocked && filled($filters['brand'] ?? null)) {
            return true;
        }

        return false;
    }
}
