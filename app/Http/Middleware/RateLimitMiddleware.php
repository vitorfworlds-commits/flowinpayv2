<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Symfony\Component\HttpFoundation\Response;

class RateLimitMiddleware
{
    public function handle(Request $request, Closure $next, string $limit = '60'): Response
    {
        $key = $this->resolveRequestKey($request);

        $parts = explode(',', $limit);
        $maxAttempts = (int) ($parts[0] ?? 60);
        $decayMinutes = (int) ($parts[1] ?? 1);

        if (RateLimiter::tooManyAttempts($key, $maxAttempts)) {
            $retryAfter = RateLimiter::availableIn($key);

            return response()->json([
                'message' => 'Muitas requisições. Tente novamente em ' . $retryAfter . ' segundos.',
                'retry_after' => $retryAfter,
            ], 429)->header('Retry-After', $retryAfter);
        }

        RateLimiter::hit($key, $decayMinutes);

        $response = $next($request);

        return $response->header('X-RateLimit-Remaining', RateLimiter::remaining($key, $maxAttempts));
    }

    private function resolveRequestKey(Request $request): string
    {
        if ($request->user()) {
            return 'user:' . $request->user()->id;
        }

        return 'ip:' . $request->ip();
    }
}
