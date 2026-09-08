<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Vite;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        /** @var Response $response */
        $response = $next($request);

        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
        $response->headers->set('Content-Security-Policy', $this->contentSecurityPolicy());

        return $response;
    }

    /**
     * Allow the Vite HMR origin while `public/hot` is present so @vite scripts
     * on :5173 are not blocked (blank Inertia pages). Production stays strict.
     */
    private function contentSecurityPolicy(): string
    {
        $vite = $this->viteDevOrigins();

        return implode('; ', [
            "default-src 'self'",
            "img-src 'self' data: blob: https://picsum.photos https://fastly.picsum.photos https://i.picsum.photos{$vite}",
            "style-src 'self' 'unsafe-inline'{$vite}",
            "script-src 'self' 'unsafe-inline'{$vite}",
            "font-src 'self' data:{$vite}",
            "connect-src 'self' ws: wss:{$vite}",
        ]);
    }

    private function viteDevOrigins(): string
    {
        if (! Vite::isRunningHot()) {
            return '';
        }

        $hot = trim((string) file_get_contents(public_path('hot')));

        return $hot !== '' ? " {$hot}" : '';
    }
}
