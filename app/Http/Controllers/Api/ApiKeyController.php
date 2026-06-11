<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ApiKey;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ApiKeyController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $apiKeys = $request->user()
            ->apiKeys()
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'api_keys' => $apiKeys->map(function ($key) {
                return [
                    'id' => $key->id,
                    'name' => $key->name,
                    'key' => $key->key_prefix . '...',
                    'status' => $key->status,
                    'permissions' => $key->permissions,
                    'allowed_ips' => $key->allowed_ips,
                    'last_used_at' => $key->last_used_at,
                    'last_used_ip' => $key->last_used_ip,
                    'created_at' => $key->created_at,
                ];
            }),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'permissions' => 'nullable|array',
            'permissions.*' => 'string',
            'allowed_ips' => 'nullable|array',
            'allowed_ips.*' => 'ip',
        ]);

        // Limitar a 10 API keys ativas por usuário
        $activeCount = $request->user()->apiKeys()->where('status', 'active')->count();
        if ($activeCount >= 10) {
            return response()->json([
                'message' => 'Máximo de 10 API keys ativas',
            ], 422);
        }

        // Generate plaintext values before create (hashed cast will hash secret)
        $keyData = ApiKey::generateKey();
        $plainSecret = 'fps_' . \Illuminate\Support\Str::random(64);

        $apiKey = $request->user()->apiKeys()->create([
            'name' => $validated['name'],
            'key_prefix' => $keyData['prefix'],
            'key_hash' => $keyData['hash'],
            'secret' => $plainSecret,
            'permissions' => $validated['permissions'] ?? null,
            'allowed_ips' => $validated['allowed_ips'] ?? null,
        ]);

        AuditLog::log('api_key_created', $apiKey, null, [
            'name' => $apiKey->name,
            'permissions' => $apiKey->permissions,
        ]);

        // Retornar a key completa UMA ÚNICA VEZ (plaintext, antes do hash)
        return response()->json([
            'api_key' => [
                'id' => $apiKey->id,
                'name' => $apiKey->name,
                'key' => $keyData['plain'],
                'secret' => $plainSecret,
                'status' => $apiKey->status ?? 'active',
                'permissions' => $apiKey->permissions,
                'allowed_ips' => $apiKey->allowed_ips,
                'created_at' => $apiKey->created_at,
            ],
            'message' => 'Guarde a key e o secret. Não serão exibidos novamente.',
        ], 201);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $apiKey = $request->user()->apiKeys()->findOrFail($id);

        return response()->json([
            'api_key' => [
                'id' => $apiKey->id,
                'name' => $apiKey->name,
                'key' => $apiKey->key_prefix . '...',
                'status' => $apiKey->status,
                'permissions' => $apiKey->permissions,
                'allowed_ips' => $apiKey->allowed_ips,
                'last_used_at' => $apiKey->last_used_at,
                'last_used_ip' => $apiKey->last_used_ip,
                'created_at' => $apiKey->created_at,
            ],
        ]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $apiKey = $request->user()->apiKeys()->findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'status' => ['sometimes', Rule::in(['active', 'inactive'])],
            'permissions' => 'nullable|array',
            'permissions.*' => 'string',
            'allowed_ips' => 'nullable|array',
            'allowed_ips.*' => 'ip',
        ]);

        $oldValues = $apiKey->only(array_keys($validated));
        $apiKey->update($validated);

        AuditLog::log('api_key_updated', $apiKey, $oldValues, $validated);

        return response()->json([
            'api_key' => [
                'id' => $apiKey->id,
                'name' => $apiKey->name,
                'status' => $apiKey->status,
                'permissions' => $apiKey->permissions,
                'allowed_ips' => $apiKey->allowed_ips,
            ],
        ]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $apiKey = $request->user()->apiKeys()->findOrFail($id);

        $apiKey->update(['status' => 'revoked']);
        $apiKey->delete();

        AuditLog::log('api_key_revoked', $apiKey);

        return response()->json([
            'message' => 'API key revogada com sucesso',
        ]);
    }

    public function toggle(Request $request, string $id): JsonResponse
    {
        $apiKey = $request->user()->apiKeys()->findOrFail($id);

        $apiKey->update([
            'status' => $apiKey->status === 'active' ? 'inactive' : 'active',
        ]);

        AuditLog::log('api_key_toggled', $apiKey);

        return response()->json([
            'api_key' => [
                'id' => $apiKey->id,
                'name' => $apiKey->name,
                'status' => $apiKey->status,
            ],
            'message' => $apiKey->status === 'active' ? 'API key ativada!' : 'API key desativada!',
        ]);
    }

    public function regenerate(Request $request, string $id): JsonResponse
    {
        $apiKey = $request->user()->apiKeys()->findOrFail($id);

        $newSecret = 'fps_' . \Illuminate\Support\Str::random(64);
        $newKeyData = ApiKey::generateKey();

        $apiKey->plain_secret = $newSecret;
        $apiKey->update([
            'key_prefix' => $newKeyData['prefix'],
            'key_hash' => $newKeyData['hash'],
            'secret' => $newSecret,
            'status' => 'active',
        ]);

        AuditLog::log('api_key_regenerated', $apiKey);

        return response()->json([
            'api_key' => [
                'id' => $apiKey->id,
                'name' => $apiKey->name,
                'key' => $newKeyData['plain'],
                'secret' => $apiKey->plain_secret,
                'status' => $apiKey->status,
            ],
            'message' => 'Nova key e secret gerados. Guarde-os.',
        ]);
    }
}
