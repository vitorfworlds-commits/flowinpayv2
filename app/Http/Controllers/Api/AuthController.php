<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => ['required', 'confirmed', Password::min(8)],
            'phone' => 'nullable|string|max:20',
            'tax_id' => 'nullable|string|max:20',
        ]);

        $validated['password'] = Hash::make($validated['password']);

        $user = User::create($validated);
        $user->forceFill(['status' => 'active', 'role' => 'user'])->save();

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'user' => $this->sanitizeUser($user->fresh()),
            'token' => $token,
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        // Rate limiting por conta (proteção contra brute force)
        $lockoutKey = 'login_attempts:' . Str::lower($validated['email']);
        if (RateLimiter::tooManyAttempts($lockoutKey, 5)) {
            $seconds = RateLimiter::availableIn($lockoutKey);
            Log::warning('Login rate limit exceeded', ['email' => $validated['email'], 'ip' => $request->ip()]);
            return response()->json([
                'message' => 'Muitas tentativas. Tente novamente em ' . ceil($seconds / 60) . ' minutos.',
            ], 429);
        }

        if (!Auth::attempt($validated)) {
            RateLimiter::hit($lockoutKey, 5 * 60); // 5 minutos
            Log::warning('Failed login attempt', ['email' => $validated['email'], 'ip' => $request->ip()]);
            return response()->json([
                'message' => 'Credenciais inválidas',
            ], 401);
        }

        RateLimiter::clear($lockoutKey); // Login bem-sucedido, resetar contador

        $user = User::where('email', $validated['email'])->first();

        if ($user->status !== 'active') {
            return response()->json([
                'message' => 'Conta não está ativa.',
            ], 403);
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'user' => $this->sanitizeUser($user),
            'token' => $token,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logout realizado com sucesso',
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $this->sanitizeUser($request->user()),
        ]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'phone' => 'nullable|string|max:20',
            'tax_id' => 'nullable|string|max:20',
            'pix_key' => 'nullable|string|max:255',
        ]);

        $request->user()->update($validated);

        return response()->json([
            'user' => $this->sanitizeUser($request->user()->fresh()),
        ]);
    }

    private function sanitizeUser(User $user): array
    {
        return $user->only([
            'id', 'name', 'email', 'phone', 'tax_id', 'pix_key',
            'default_acquirer_id', 'subaccount_pix_key', 'subaccount_id',
            'balance', 'balance_blocked',
            'status', 'role', 'created_at', 'updated_at',
        ]);
    }
}
