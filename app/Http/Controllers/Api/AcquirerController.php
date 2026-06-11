<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Acquirer;
use App\Models\Dispute;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AcquirerController extends Controller
{
    /**
     * List all acquirers.
     */
    public function index(Request $request): JsonResponse
    {
        $acquirers = Acquirer::orderBy('name')->get();

        $user = $request->user();

        return response()->json([
            'acquirers' => $acquirers->map(fn($a) => [
                'id' => $a->id,
                'name' => $a->name,
                'slug' => $a->slug,
                'logo_url' => $a->logo_url,
                'color' => $a->color,
                'fee_percent' => $a->fee_percent,
                'fee_fixed' => $a->fee_fixed,
                'description' => $a->description,
                'environment' => $a->environment,
                'is_active' => $a->is_active,
                'is_default' => $user->default_acquirer_id === $a->id,
                'has_api_key' => !empty($a->api_key),
            ]),
            'user_default_id' => $user->default_acquirer_id,
        ]);
    }

    /**
     * Set default acquirer for the authenticated user.
     */
    public function setDefault(Request $request, int $id): JsonResponse
    {
        $acquirer = Acquirer::where('is_active', true)->findOrFail($id);

        $request->user()->update([
            'default_acquirer_id' => $acquirer->id,
        ]);

        return response()->json([
            'message' => "Adquirente padrão alterada para {$acquirer->name}",
            'default_acquirer_id' => $acquirer->id,
        ]);
    }

    /**
     * Get stats for an acquirer (charges count, volume, disputes).
     */
    public function stats(Request $request, int $id): JsonResponse
    {
        $acquirer = Acquirer::findOrFail($id);
        $userId = $request->user()->id;

        $charges = \App\Models\Charge::where('acquirer_id', $id)
            ->where('user_id', $userId);

        $totalCharges = $charges->count();
        $totalVolume = $charges->sum('value');
        $paidCharges = (clone $charges)->where('status', 'paid')->count();
        $pendingCharges = (clone $charges)->where('status', 'pending')->count();

        $disputes = Dispute::where('acquirer', $acquirer->name)
            ->where('user_id', $userId)
            ->count();

        return response()->json([
            'acquirer' => [
                'id' => $acquirer->id,
                'name' => $acquirer->name,
                'slug' => $acquirer->slug,
            ],
            'stats' => [
                'total_charges' => $totalCharges,
                'paid_charges' => $paidCharges,
                'pending_charges' => $pendingCharges,
                'total_volume' => $totalVolume,
                'disputes' => $disputes,
            ],
        ]);
    }
}
