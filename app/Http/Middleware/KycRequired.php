<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class KycRequired
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Não autenticado'], 401);
        }

        // Admin bypass
        if ($user->role === 'admin') {
            return $next($request);
        }

        // Check if user has approved KYC
        $hasApproved = $user->kycDocuments()
            ->where('status', 'approved')
            ->exists();

        if (!$hasApproved) {
            return response()->json([
                'message' => 'Verificação de identidade necessária',
                'kyc_required' => true,
                'kyc_status' => $this->getKycStatus($user),
            ], 403);
        }

        return $next($request);
    }

    private function getKycStatus($user): string
    {
        $hasPending = $user->kycDocuments()
            ->where('status', 'pending')
            ->exists();

        $hasRejected = $user->kycDocuments()
            ->where('status', 'rejected')
            ->exists();

        if ($hasPending) return 'pending';
        if ($hasRejected) return 'rejected';
        return 'not_submitted';
    }
}
