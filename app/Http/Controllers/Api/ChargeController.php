<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreChargeRequest;
use App\Models\Acquirer;
use App\Models\AuditLog;
use App\Models\Charge;
use App\Models\FeeConfig;
use App\Models\WebhookConfig;
use App\Models\Transaction;
use App\Services\AcquirerFactory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class ChargeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $charges = $request->user()
            ->charges()
            ->with('acquirer')
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return response()->json($charges);
    }

    public function store(StoreChargeRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $fee = FeeConfig::getActive();

        $acquirer = Acquirer::findOrFail($validated['acquirer_id']);

        if (!$acquirer->isActive()) {
            return response()->json([
                'message' => 'Adquirente inativa',
            ], 422);
        }

        $value = (float) $validated['value'];
        $feeValue = $fee->calculateFee($value);
        $correlationId = (string) Str::uuid();

        $charge = DB::transaction(function () use ($request, $validated, $acquirer, $correlationId, $feeValue, $value, $fee) {
            // Support both webhook_url (direct) and callbackUrl (SyncPay-style)
            $webhookUrl = $validated['webhook_url'] ?? $validated['callbackUrl'] ?? null;

            $charge = Charge::create([
                'user_id' => $request->user()->id,
                'acquirer_id' => $acquirer->id,
                'correlation_id' => $correlationId,
                'value' => $value,
                'fee_value' => $feeValue,
                'fee_percent' => $fee->percentual,
                'status' => 'pending',
                'description' => $validated['description'] ?? null,
                'webhook_url' => $webhookUrl,
            ]);

            // Auto-create webhook config if callbackUrl provided via API (SyncPay-style)
            if ($webhookUrl && $request->header('X-Api-Key')) {
                $this->autoCreateWebhookFromCallback($request->user(), $webhookUrl);
            }

            return $charge;
        });

        // Chamar API da adquirente real
        try {
            $service = AcquirerFactory::make($acquirer);

            // Woovi requires at least email+tax_id/phone — only send customer if we have enough data
            $customer = null;
            if (!empty($validated['customer_name'])
                && (!empty($validated['customer_email']) || !empty($validated['customer_tax_id']) || !empty($validated['customer_phone']))
            ) {
                $customer = [
                    'name' => $validated['customer_name'],
                    'email' => $validated['customer_email'] ?? null,
                    'tax_id' => $validated['customer_tax_id'] ?? null,
                    'phone' => $validated['customer_phone'] ?? null,
                ];
            }

            // Criar cobrança na conta principal
            $response = $service->createCharge($charge, $customer);

            // Atualizar cobrança com dados da adquirente
            $chargeData = $response['charge'] ?? $response;
            $charge->update([
                'status' => 'active',
                'pix_key' => $chargeData['pixKey'] ?? $chargeData['brCode'] ?? null,
                'br_code' => $chargeData['brCode'] ?? null,
                'payment_link_url' => config('app.url') . '/pay/' . $correlationId,
                'qr_code_image' => $chargeData['qrCodeImage'] ?? null,
                'acquirer_correlation_id' => $chargeData['correlationID'] ?? null,
                'expires_at' => $chargeData['expiresDate'] ?? null,
                'acquirer_response' => json_encode($chargeData),
            ]);

            // Auditoria
            AuditLog::log('charge_created', $charge, null, [
                'value' => $value,
                'fee' => $feeValue,
                'acquirer' => $acquirer->slug,
            ]);

            // Webhook automático — notifica webhooks configurados do usuário
            try {
                app(\App\Services\WebhookCallbackService::class)->sendChargeCreated($charge->fresh());
            } catch (\Throwable $e) {
                Log::warning('Webhook charge.created failed', ['error' => $e->getMessage()]);
            }

            return response()->json([
                'charge' => $charge->fresh('acquirer'),
                'fee' => [
                    'percentual' => $fee->percentual,
                    'fixed_value' => $fee->fixed_value,
                    'total_fee' => $feeValue,
                    'net_value' => round($value - $feeValue, 2),
                ],
            ], 201);

        } catch (\Exception $e) {
            Log::error('Failed to create charge on acquirer', [
                'charge_id' => $charge->id,
                'acquirer' => $acquirer->slug,
                'error' => $e->getMessage(),
            ]);

            $charge->update(['status' => 'cancelled']);

            return response()->json([
                'message' => 'Erro ao criar cobrança na adquirente',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $charge = $request->user()
            ->charges()
            ->with('acquirer')
            ->where(function ($query) use ($id) {
                $query->where('id', $id)
                      ->orWhere('correlation_id', $id);
            })
            ->firstOrFail();

        return response()->json([
            'charge' => $charge,
        ]);
    }

    public function cancel(Request $request, string $id): JsonResponse
    {
        $charge = $request->user()
            ->charges()
            ->where(function ($query) use ($id) {
                $query->where('id', $id)
                      ->orWhere('correlation_id', $id);
            })
            ->firstOrFail();

        if (!in_array($charge->status, ['pending', 'active'])) {
            return response()->json([
                'message' => 'Não é possível cancelar esta cobrança',
            ], 422);
        }

        $charge->update(['status' => 'cancelled']);

        AuditLog::log('charge_cancelled', $charge, ['status' => 'active'], ['status' => 'cancelled']);

        return response()->json([
            'charge' => $charge->fresh(),
            'message' => 'Cobrança cancelada com sucesso',
        ]);
    }

    /**
     * Auto-create webhook when callbackUrl is provided via API key (SyncPay-style).
     * If a webhook with this URL already exists for the user, skip creation.
     */
    private function autoCreateWebhookFromCallback($user, string $url): void
    {
        $exists = WebhookConfig::where('user_id', $user->id)
            ->where('url', $url)
            ->exists();

        if (!$exists) {
            WebhookConfig::create([
                'user_id' => $user->id,
                'url' => $url,
                'secret' => 'whsec_' . Str::random(32),
                'events' => ['charge.created', 'charge.completed', 'charge.expired', 'charge.cancelled'],
                'description' => 'Auto-gerado via callbackUrl',
                'is_active' => true,
            ]);
        }
    }

    public function stats(Request $request): JsonResponse
    {
        $user = $request->user();

        $totalCharges = $user->charges()->count();
        $totalReceived = $user->charges()->where('status', 'paid')->sum('value');
        $totalFees = $user->charges()->where('status', 'paid')->sum('fee_value');
        $pendingCharges = $user->charges()->where('status', 'active')->count();
        $paidCharges = $user->charges()->where('status', 'paid')->count();

        // Conversion rate = paid / (paid + pending) * 100
        $denominator = $paidCharges + $pendingCharges;
        $conversionRate = $denominator > 0 ? round(($paidCharges / $denominator) * 100, 1) : 0;

        return response()->json([
            'stats' => [
                'total_charges' => $totalCharges,
                'total_received' => (float) $totalReceived,
                'total_fees' => (float) $totalFees,
                'net_received' => round((float) $totalReceived - (float) $totalFees, 2),
                'pending_charges' => $pendingCharges,
                'paid_charges' => $paidCharges,
                'conversion_rate' => $conversionRate,
            ],
        ]);
    }
}
