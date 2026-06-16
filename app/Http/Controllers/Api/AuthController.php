<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Http\Requests\RegisterRequest;
use App\Mail\PasswordResetMail;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;


class AuthController extends Controller
{
    public function register(RegisterRequest $request): JsonResponse
    {
        $validated = $request->validated();
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

    public function forgotPassword(Request $request): JsonResponse
    {
        $throttleKey = 'forgot:' . $request->ip();
        if (RateLimiter::tooManyAttempts($throttleKey, 3)) {
            return response()->json(['message' => 'Muitas requisições. Tente novamente mais tarde.'], 429);
        }
        RateLimiter::hit($throttleKey, 3600);

        $request->validate(['email' => 'required|email']);

        $user = User::where('email', $request->email)->first();

        // Always return success to prevent email enumeration
        if (!$user) {
            return response()->json(['message' => 'Se o email existir, um link de redefinição será enviado.']);
        }

        $token = Str::random(64);

        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $user->email],
            ['token' => Hash::make($token), 'created_at' => now()]
        );

        try {
            Mail::to($user->email)->send(new PasswordResetMail($token, $user->email));
        } catch (\Exception $e) {
            Log::error('Failed to send password reset email', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Erro ao enviar email. Tente novamente mais tarde.'], 500);
        }

        return response()->json(['message' => 'Se o email existir, um link de redefinição será enviado.']);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'token' => 'required|string',
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $resetRecord = DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->first();

        if (!$resetRecord || !Hash::check($request->token, $resetRecord->token)) {
            return response()->json(['message' => 'Token inválido ou expirado.'], 422);
        }

        // Check if token is older than 60 minutes
        if (now()->diffInMinutes($resetRecord->created_at) > 60) {
            DB::table('password_reset_tokens')->where('email', $request->email)->delete();
            return response()->json(['message' => 'Token expirado. Solicite um novo link.'], 422);
        }

        $user = User::where('email', $request->email)->first();
        if (!$user) {
            return response()->json(['message' => 'Usuário não encontrado.'], 404);
        }

        $user->update(['password' => Hash::make($request->password)]);
        DB::table('password_reset_tokens')->where('email', $request->email)->delete();

        // Revoke all existing tokens
        $user->tokens()->delete();

        return response()->json(['message' => 'Senha redefinida com sucesso. Faça login com sua nova senha.']);
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
