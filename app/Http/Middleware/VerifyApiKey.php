<?php

namespace App\Http\Middleware;

use App\Models\ApiKey;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class VerifyApiKey
{
    public function handle(Request $request, Closure $next, string $permission = null): Response
    {
        $apiKeyValue = $request->header('X-Api-Key');

        if (!$apiKeyValue) {
            return response()->json(['message' => 'API key não fornecida'], 401);
        }

        // Extrair prefixo (fpk_ + 8 chars) para lookup
        $prefix = substr($apiKeyValue, 0, 12);
        $apiKey = ApiKey::findByPrefix($prefix);

        if (!$apiKey || !$apiKey->isValidKey($apiKeyValue)) {
            return response()->json(['message' => 'API key inválida ou revogada'], 401);
        }

        // Verificar IP permitido
        if (!$apiKey->isIpAllowed($request->ip())) {
            return response()->json(['message' => 'IP não autorizado para esta API key'], 403);
        }

        // Verificar permissão
        if ($permission && !$apiKey->hasPermission($permission)) {
            return response()->json(['message' => 'Permissão insuficiente: ' . $permission], 403);
        }

        // Registrar uso
        $apiKey->recordUsage($request->ip());

        // Anexar usuário ao request
        $request->merge(['api_key_user' => $apiKey->user]);
        $request->setUserResolver(fn () => $apiKey->user);

        return $next($request);
    }
}
