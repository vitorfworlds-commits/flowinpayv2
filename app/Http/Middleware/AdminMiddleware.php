<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        if (!$request->user() || $request->user()->status !== 'active') {
            return response()->json(['message' => 'Não autorizado'], 403);
        }

        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Acesso restrito a administradores'], 403);
        }

        return $next($request);
    }
}
