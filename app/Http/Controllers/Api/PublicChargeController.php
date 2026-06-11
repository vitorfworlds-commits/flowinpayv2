<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Charge;
use Illuminate\Http\JsonResponse;

class PublicChargeController extends Controller
{
    public function show(string $correlationId): JsonResponse
    {
        $charge = Charge::with('acquirer')
            ->where('correlation_id', $correlationId)
            ->firstOrFail();

        // Only expose safe fields publicly
        return response()->json([
            'charge' => [
                'id' => $charge->id,
                'correlation_id' => $charge->correlation_id,
                'value' => $charge->value,
                'status' => $charge->status,
                'description' => $charge->description,
                'br_code' => $charge->br_code,
                'qr_code_image' => $charge->qr_code_image,
                'payment_link_url' => $charge->payment_link_url,
                'customer_name' => $charge->customer_name,
                'expires_at' => $charge->expires_at,
                'paid_at' => $charge->paid_at,
                'acquirer' => $charge->acquirer ? [
                    'name' => $charge->acquirer->name,
                    'color' => $charge->acquirer->color,
                    'logo_url' => $charge->acquirer->logo_url,
                ] : null,
            ],
        ]);
    }
}
