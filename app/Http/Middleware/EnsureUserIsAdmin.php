<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsAdmin
{
    public function handle(Request $request, Closure $next, string $level = 'staff'): Response
    {
        $user = $request->user();
        if (! $user || ! $user->is_active) {
            abort(403);
        }

        if ($level === 'admin' && ! $user->isAdmin()) {
            abort(403);
        }

        if ($level === 'staff' && ! $user->isStaff()) {
            abort(403);
        }

        return $next($request);
    }
}
