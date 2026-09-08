<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\Response;

class SitemapController extends Controller
{
    public function sitemap(): Response
    {
        $urls = [
            ['loc' => url('/'), 'changefreq' => 'daily', 'priority' => '1.0'],
            ['loc' => url('/shop'), 'changefreq' => 'daily', 'priority' => '0.9'],
        ];

        foreach (['terms', 'privacy', 'shipping', 'returns', 'contact'] as $page) {
            $urls[] = ['loc' => url('/p/'.$page), 'changefreq' => 'monthly', 'priority' => '0.3'];
        }

        Category::query()->active()->with('parent')->orderBy('sort_order')->orderBy('name')->get()
            ->each(function (Category $category) use (&$urls) {
                $urls[] = ['loc' => url($category->storePath()), 'changefreq' => 'daily', 'priority' => '0.8'];
            });

        Brand::query()->active()->orderBy('name')->get()
            ->each(function (Brand $brand) use (&$urls) {
                $urls[] = ['loc' => url($brand->storePath()), 'changefreq' => 'weekly', 'priority' => '0.7'];
            });

        Product::query()->active()->orderBy('name')->get(['slug'])
            ->each(function (Product $product) use (&$urls) {
                $urls[] = ['loc' => url('/products/'.$product->slug), 'changefreq' => 'weekly', 'priority' => '0.6'];
            });

        return response()
            ->view('sitemap', ['urls' => $urls])
            ->header('Content-Type', 'application/xml; charset=UTF-8');
    }

    public function robots(): Response
    {
        $lines = ['User-agent: *'];
        if (config('app.env') === 'production') {
            $lines[] = 'Allow: /';
            $lines[] = 'Disallow: /admin';
            $lines[] = 'Disallow: /cart';
            $lines[] = 'Disallow: /checkout';
            $lines[] = 'Disallow: /account';
            $lines[] = 'Sitemap: '.url('/sitemap.xml');
        } else {
            $lines[] = 'Disallow: /';
        }

        return response(implode("\n", $lines)."\n", 200, [
            'Content-Type' => 'text/plain; charset=UTF-8',
        ]);
    }
}
