<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        @php
            $seo = $page['props']['seo'] ?? null;
            $docTitle = $seo['title'] ?? config('app.name', 'Shop');
        @endphp
        <title inertia>{{ $docTitle }}</title>
        @if (is_array($seo))
            @if (! empty($seo['description']))
                <meta inertia head-key="description" name="description" content="{{ $seo['description'] }}">
            @endif
            <meta inertia head-key="robots" name="robots" content="{{ $seo['robots'] ?? 'index,follow' }}">
            @if (! empty($seo['canonical']))
                <link inertia head-key="canonical" rel="canonical" href="{{ $seo['canonical'] }}">
                <meta inertia head-key="og:url" property="og:url" content="{{ $seo['canonical'] }}">
            @endif
            <meta inertia head-key="og:title" property="og:title" content="{{ $docTitle }}">
            @if (! empty($seo['description']))
                <meta inertia head-key="og:description" property="og:description" content="{{ $seo['description'] }}">
            @endif
            <meta inertia head-key="og:type" property="og:type" content="{{ $seo['og_type'] ?? 'website' }}">
            @if (! empty($seo['og_image']))
                <meta inertia head-key="og:image" property="og:image" content="{{ $seo['og_image'] }}">
            @endif
            @if (! empty($seo['jsonLd']))
                <script type="application/ld+json">{!! json_encode($seo['jsonLd'], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) !!}</script>
            @endif
        @endif

        @routes
        @viteReactRefresh
        @vite(['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
