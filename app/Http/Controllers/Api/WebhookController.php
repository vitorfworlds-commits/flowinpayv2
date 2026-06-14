<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Acquirer;
use App\Services\WebhookCallbackService;
use App\Models\Charge;
use App\Models\Transaction;
use App\Models\Dispute;
use App\Models\WebhookLog;
use App\Services\DisputeEvidenceService;
use App\Jobs\SendDisputeDossier;
use App\Services\AcquirerFactory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class WebhookController extends Controller
{
    public function handle(Request $request, string $acquirerSlug): JsonResponse
    {
        $acquirer = Acquirer::where('slug', $acquirerSlug)->where('is_active', true)->first();

        if (!$acquirer) {
            return response()->json(['message' => 'Adquirente não encontrada'], 404);
        }

        $rawBody = $request->getContent();
        $payload = $request->all();

        $eventType = $payload['event'] ?? $payload['eventName'] ?? 'unknown';
        $correlationId = $payload['correlationID']
            ?? $payload['charge']['correlationID']
            ?? $payload['Charge']['correlationID']
            ?? null;

        // --- VERIFICAÇÃO DE ASSINATURA ---
        // Método 1 (recomendado): RSA-SHA256 via x-webhook-signature
        // Método 2 (legado): HMAC-SHA1 via X-OpenPix-Signature
        $rsaSignature = $request->header('x-webhook-signature');
        $hmacSignature = $request->header('x-openpix-signature');

        $signatureValid = false;

        if ($rsaSignature) {
            // Método 1: RSA-SHA256 com chave pública da Woovi
            $publicKey = config('services.openpix.webhook_public_key') ?: "-----BEGIN PUBLIC KEY-----\nMIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC/+NtIkjzevvqD+I3MMv3bLXDt\npvxBjY4BsRrSdca3rtAwMcRYYvxSnd7jagVLpctMiOxQO8ieUCKLSWHpsMAjO/zZ\nWMKbqoG8MNpi/u3fp6zz0mcHCOSqYsPUUG19buW8bis5ZZ2IZgBObWSpTvJ0cnj6\nHKBAA82Jln+lGwS1MwIDAQAB\n-----END PUBLIC KEY-----";

            if ($publicKey) {
                $result = openssl_verify($rawBody, base64_decode($rsaSignature), $publicKey, 'sha256WithRSAEncryption');
                $signatureValid = ($result === 1);
            }

            if (!$signatureValid) {
                Log::warning('Woovi RSA signature verification failed', [
                    'acquirer' => $acquirer->slug,
                    'ip' => $request->ip(),
                ]);
                return response()->json(['message' => 'invalid signature'], 401);
            }
        } elseif ($hmacSignature) {
            // Método 2: HMAC-SHA1 com secret key do webhook
            $signatureValid = false;
            $secrets = array_filter(explode(',', $acquirer->api_secret));

            foreach ($secrets as $secret) {
                $secret = trim($secret);
                if (empty($secret)) continue;

                $expected = base64_encode(hash_hmac('sha1', $rawBody, $secret, true));
                if (hash_equals($expected, $hmacSignature)) {
                    $signatureValid = true;
                    break;
                }
            }

            if (!$signatureValid) {
                Log::warning('HMAC signature verification failed', [
                    'acquirer' => $acquirer->slug,
                    'ip' => $request->ip(),
                ]);
                return response()->json(['message' => 'invalid signature'], 401);
            }
        } else {
            // Nenhuma assinatura — rejeitar
            Log::warning('Webhook received without any signature', [
                'acquirer' => $acquirer->slug,
                'ip' => $request->ip(),
            ]);
            return response()->json(['message' => 'missing signature'], 401);
        }

        // Log do webhook (assinatura já validada acima)
        $webhookLog = WebhookLog::create([
            'acquirer_id' => $acquirer->id,
            'event_type' => $eventType,
            'correlation_id' => $correlationId,
            'payload' => $payload,
            'status' => 'received',
            'ip_address' => $request->ip(),
            'signature' => $rsaSignature ?? $hmacSignature,
        ]);

        // Idempotência: verificar se já processou este webhook
        $webhookId = $payload['id'] ?? $payload['webhookId'] ?? null;
        if ($webhookId) {
            $alreadyProcessed = WebhookLog::where('acquirer_id', $acquirer->id)
                ->where('event_type', $eventType)
                ->where('payload->id', $webhookId)
                ->where('status', 'processed')
                ->exists();

            if ($alreadyProcessed) {
                Log::info('Webhook already processed (idempotent)', [
                    'webhook_id' => $webhookId,
                    'event' => $eventType,
                ]);
                return response()->json(['message' => 'ok']);
            }
        }

        try {
            $this->processEvent($acquirer, $eventType, $payload, $correlationId);
            $webhookLog->update(['status' => 'processed']);
        } catch (\Exception $e) {
            Log::error('Webhook processing failed', [
                'acquirer' => $acquirer->slug,
                'event' => $eventType,
                'correlation_id' => $correlationId,
                'error' => $e->getMessage(),
            ]);

            $webhookLog->update([
                'status' => 'failed',
                'error_message' => $e->getMessage(),
            ]);

            // Retornar 200 mesmo com erro pra Woovi não bloquear
            return response()->json(['message' => 'ok']);
        }

        return response()->json(['message' => 'ok']);
    }

    private function processEvent(Acquirer $acquirer, string $eventType, array $payload, ?string $correlationId): void
    {
        // Normalizar payload - OpenPix pode vir em 'charge' ou 'Charge'
        $chargeData = $payload['charge'] ?? $payload['Charge'] ?? $payload;

        match ($eventType) {
            // Cobrança paga
            'OPENPIX:CHARGE_COMPLETED',
            'OPENPIX:MOVEMENT_CONFIRMED',
            => $this->handleChargeCompleted($acquirer, $chargeData, $correlationId),

            // Cobrança paga por pessoa diferente do customer
            'OPENPIX:CHARGE_COMPLETED_NOT_SAME_CUSTOMER_PAYER',
            => $this->handleChargeCompleted($acquirer, $chargeData, $correlationId),

            // Cobrança expirada
            'OPENPIX:CHARGE_EXPIRED',
            => $this->handleChargeExpired($acquirer, $chargeData, $correlationId),

            // Cobrança criada
            'OPENPIX:CHARGE_CREATED',
            => $this->handleChargeCreated($acquirer, $chargeData, $correlationId),

            // Transação recebida (QR code estático)
            'OPENPIX:TRANSACTION_RECEIVED',
            => $this->handleTransactionReceived($acquirer, $chargeData, $correlationId),

            // Reembolso recebido
            'OPENPIX:TRANSACTION_REFUND_RECEIVED',
            => $this->handleRefundReceived($acquirer, $chargeData, $correlationId),

            // Pagamento falhou
            'OPENPIX:MOVEMENT_FAILED',
            => $this->handleMovementFailed($acquirer, $chargeData, $correlationId),

            // Pagamento removido (estorno)
            'OPENPIX:MOVEMENT_REMOVED',
            => $this->handleMovementRemoved($acquirer, $chargeData, $correlationId),

            // Disputas
            'OPENPIX:DISPUTE_CREATED',
            => $this->handleDisputeCreated($acquirer, $chargeData, $correlationId),

            'OPENPIX:DISPUTE_ACCEPTED',
            => $this->handleDisputeAccepted($acquirer, $chargeData, $correlationId),

            'OPENPIX:DISPUTE_REJECTED',
            => $this->handleDisputeRejected($acquirer, $chargeData, $correlationId),

            'OPENPIX:DISPUTE_CANCELED',
            => $this->handleDisputeCanceled($acquirer, $chargeData, $correlationId),

            // Log de eventos não tratados
            default => Log::info('Unhandled webhook event', [
                'event' => $eventType,
                'acquirer' => $acquirer->slug,
            ]),
        };
    }

    private function handleChargeCompleted(Acquirer $acquirer, array $data, ?string $correlationId): void
    {
        if (!$correlationId) return;

        // Saques usam correlationId prefixado com "withdrawal_"
        if (str_starts_with($correlationId, 'withdrawal_')) {
            $this->handleWithdrawalCompleted($acquirer, $data, $correlationId);
            return;
        }

        $charge = DB::transaction(function () use ($acquirer, $data, $correlationId) {
            // Lock na CHARGE primeiro para evitar double-credit
            $charge = Charge::where('correlation_id', $correlationId)
                ->where('acquirer_id', $acquirer->id)
                ->lockForUpdate()
                ->first();

            // Only accept active or pending charges
            if (!$charge || !in_array($charge->status, ['active', 'pending'])) {
                return null;
            }

            // Lock no USER
            $user = \App\Models\User::lockForUpdate()->findOrFail($charge->user_id);

            $charge->update([
                'status' => 'paid',
                'paid_at' => $data['charge']['paidAt'] ?? now()->toDateTimeString(),
                'acquirer_response' => json_encode($data),
            ]);

            $netValue = $charge->value - $charge->fee_value;
            $balanceBefore = $user->balance;

            $user->forceFill([
                'balance' => $user->balance + $netValue,
            ])->save();

            Transaction::create([
                'user_id' => $user->id,
                'type' => 'charge_received',
                'amount' => $netValue,
                'balance_before' => $balanceBefore,
                'balance_after' => $user->balance,
                'reference_type' => Charge::class,
                'reference_id' => $charge->id,
                'description' => 'Pagamento recebido via ' . $charge->acquirer->name . ' (taxa R$' . number_format($charge->fee_value, 2, '.', '') . ' descontada)',
            ]);

            Log::info('Charge completed via webhook', [
                'charge_id' => $charge->id,
                'correlation_id' => $correlationId,
                'value' => $charge->value,
                'fee' => $charge->fee_value,
            ]);

            return $charge;
        });

        // Fora da transação (locks já liberados): enfileira o callback pro integrador.
        // Evita segurar locks de banco enquanto espera o servidor do lojista.
        if ($charge) {
            app(WebhookCallbackService::class)->sendChargeCompleted($charge);
        }
    }

    private function handleWithdrawalCompleted(Acquirer $acquirer, array $data, ?string $correlationId): void
    {
        $withdrawal = Withdrawal::where('transaction_id', $correlationId)
            ->where('status', 'processing')
            ->first();

        if (!$withdrawal) {
            Log::info('Withdrawal not found or already processed', [
                'correlation_id' => $correlationId,
            ]);
            return;
        }

        DB::transaction(function () use ($withdrawal, $data) {
            $withdrawal->update([
                'status' => 'completed',
                'processed_at' => now(),
                'acquirer_response' => json_encode($data),
            ]);

            // Liberar saldo bloqueado
            $user = \App\Models\User::lockForUpdate()->findOrFail($withdrawal->user_id);
            $user->decrement('balance_blocked', $withdrawal->value);

            Transaction::create([
                'user_id' => $user->id,
                'type' => 'withdrawal_completed',
                'amount' => -$withdrawal->net_value,
                'balance_before' => $user->balance,
                'balance_after' => $user->balance,
                'reference_type' => Withdrawal::class,
                'reference_id' => $withdrawal->id,
                'description' => 'Saque confirmado via webhook',
            ]);
        });

        Log::info('Withdrawal completed via webhook', [
            'withdrawal_id' => $withdrawal->id,
            'correlation_id' => $correlationId,
        ]);
    }

    private function handleChargeExpired(Acquirer $acquirer, array $data, ?string $correlationId): void
    {
        if (!$correlationId) return;

        $charge = Charge::where('correlation_id', $correlationId)
            ->where('acquirer_id', $acquirer->id)
            ->where('status', 'active')
            ->first();

        if ($charge) {
            $charge->update([
                'status' => 'expired',
                'acquirer_response' => json_encode($data),
            ]);

            Log::info('Charge expired via webhook', [
                'charge_id' => $charge->id,
                'correlation_id' => $correlationId,
            ]);
        }
    }

    private function handleChargeCreated(Acquirer $acquirer, array $data, ?string $correlationId): void
    {
        if (!$correlationId) return;

        $charge = Charge::where('correlation_id', $correlationId)
            ->where('acquirer_id', $acquirer->id)
            ->first();

        if ($charge && $charge->status === 'pending') {
            $charge->update([
                'status' => 'active',
                'pix_key' => $data['pixKey'] ?? null,
                'br_code' => $data['brCode'] ?? null,
                'payment_link_url' => $data['paymentLinkUrl'] ?? null,
                'qr_code_image' => $data['qrCodeImage'] ?? null,
                'acquirer_correlation_id' => $data['identifier'] ?? null,
                'acquirer_response' => json_encode($data),
            ]);
        }
    }

    private function handleMovementRemoved(Acquirer $acquirer, array $data, ?string $correlationId): void
    {
        if (!$correlationId) return;

        DB::transaction(function () use ($acquirer, $data, $correlationId) {
            // Lock na charge para evitar double-refund
            $charge = Charge::where('correlation_id', $correlationId)
                ->where('acquirer_id', $acquirer->id)
                ->where('status', 'paid')
                ->lockForUpdate()
                ->first();

            if (!$charge) return;

            $user = \App\Models\User::lockForUpdate()->findOrFail($charge->user_id);
            $netValue = $charge->value - $charge->fee_value;

            $balanceBefore = $user->balance;
            $user->forceFill([
                'balance' => $user->balance - $netValue,
            ])->save();

            $charge->update([
                'status' => 'refunded',
                'acquirer_response' => json_encode($data),
            ]);

            Transaction::create([
                'user_id' => $user->id,
                'type' => 'refund',
                'amount' => -$netValue,
                'balance_before' => $balanceBefore,
                'balance_after' => $user->balance,
                'reference_type' => Charge::class,
                'reference_id' => $charge->id,
                'description' => 'Estorno recebido via webhook',
            ]);

            Log::info('Charge refunded via webhook', [
                'charge_id' => $charge->id,
                'correlation_id' => $correlationId,
            ]);
        });
    }

    private function handleTransactionReceived(Acquirer $acquirer, array $data, ?string $correlationId): void
    {
        // Transação recebida de QR code estático ou cobrança
        Log::info('Transaction received via webhook', [
            'correlation_id' => $correlationId,
            'event' => 'OPENPIX:TRANSACTION_RECEIVED',
        ]);

        // Se tem correlationId, processar como cobrança
        if ($correlationId) {
            $this->handleChargeCompleted($acquirer, $data, $correlationId);
        }
    }

    private function handleRefundReceived(Acquirer $acquirer, array $data, ?string $correlationId): void
    {
        if (!$correlationId) return;

        DB::transaction(function () use ($acquirer, $data, $correlationId) {
            $charge = Charge::where('correlation_id', $correlationId)
                ->where('acquirer_id', $acquirer->id)
                ->where('status', 'paid')
                ->lockForUpdate()
                ->first();

            if (!$charge) return;

            $user = \App\Models\User::lockForUpdate()->findOrFail($charge->user_id);
            $netValue = $charge->value - $charge->fee_value;

            $balanceBefore = $user->balance;
            $user->forceFill([
                'balance' => $user->balance - $netValue,
            ])->save();

            $charge->update([
                'status' => 'refunded',
                'acquirer_response' => json_encode($data),
            ]);

            Transaction::create([
                'user_id' => $user->id,
                'type' => 'refund',
                'amount' => -$netValue,
                'balance_before' => $balanceBefore,
                'balance_after' => $user->balance,
                'reference_type' => Charge::class,
                'reference_id' => $charge->id,
                'description' => 'Reembolso recebido via webhook',
            ]);

            Log::info('Refund received via webhook', [
                'charge_id' => $charge->id,
                'correlation_id' => $correlationId,
            ]);
        });
    }

    private function handleMovementFailed(Acquirer $acquirer, array $data, ?string $correlationId): void
    {
        if ($correlationId) {
            Charge::where('correlation_id', $correlationId)
                ->where('acquirer_id', $acquirer->id)
                ->where('status', 'active')
                ->update([
                    'status' => 'expired',
                    'acquirer_response' => json_encode($data),
                ]);
        }

        Log::info('Movement failed via webhook', [
            'correlation_id' => $correlationId,
        ]);
    }

    private function handleDisputeCreated(Acquirer $acquirer, array $data, ?string $correlationId): void
    {
        Log::warning('Dispute created', [
            'correlation_id' => $correlationId,
            'data' => $data,
        ]);

        $disputeData = $data['dispute'] ?? $data;

        // Find charge to get user_id
        $charge = null;
        if ($correlationId) {
            $charge = Charge::where('correlation_id', $correlationId)
                ->where('acquirer_id', $acquirer->id)
                ->first();

            if ($charge) {
                $charge->update(['acquirer_response' => json_encode($data)]);
            }
        }

        // Upsert dispute record
        $status = 'open';
        $disputeStatus = strtoupper($disputeData['status'] ?? '');
        if ($disputeStatus === 'OPENED') $status = 'open';
        elseif ($disputeStatus === 'ACCEPTED') $status = 'accepted';
        elseif ($disputeStatus === 'REJECTED') $status = 'rejected';
        elseif ($disputeStatus === 'CANCELED') $status = 'cancelled';

        // Prioritize dispute.id (needed for evidence API), fallback to endToEndId
        $externalId = $disputeData['id'] ?? $disputeData['endToEndId'] ?? null;

        $dispute = Dispute::updateOrCreate(
            ['external_id' => $externalId],
            [
                'user_id' => $charge?->user_id,
                'charge_id' => $charge?->id,
                'type' => ($disputeData['type'] ?? 'MED') === 'CHARGEBACK' ? 'chargeback' : 'med',
                'status' => $status,
                'amount' => ($disputeData['value'] ?? $charge?->value ?? 0) / (isset($disputeData['value']) ? 100 : 1),
                'reason' => $disputeData['disputeReason'] ?? null,
                'description' => "Contestação via {$acquirer->name}",
                'acquirer' => $acquirer->name,
                'evidence' => json_encode($data),
            ]
        );

        // Auto-defend: dispatch job to generate dossier and send to Woovi
        try {
            SendDisputeDossier::dispatch($dispute->id);
        } catch (\Throwable $e) {
            Log::error('Failed to dispatch SendDisputeDossier', [
                'dispute_id' => $dispute->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    private function handleDisputeAccepted(Acquirer $acquirer, array $data, ?string $correlationId): void
    {
        Log::warning('Dispute accepted - estorno confirmado', [
            'correlation_id' => $correlationId,
            'data' => $data,
        ]);

        $disputeData = $data['dispute'] ?? $data;
        $externalId = $disputeData['id'] ?? $disputeData['endToEndId'] ?? null;

        // Update dispute status
        if ($externalId) {
            Dispute::where('external_id', $externalId)->update([
                'status' => 'accepted',
                'resolved_at' => now(),
                'resolution' => 'Contestação aceita - estorno confirmado',
            ]);
        }

        // Disputa aceita = cliente ganhou = estornar saldo
        if ($correlationId) {
            DB::transaction(function () use ($acquirer, $data, $correlationId, $externalId) {
                $charge = Charge::where('correlation_id', $correlationId)
                    ->where('acquirer_id', $acquirer->id)
                    ->where('status', 'paid')
                    ->lockForUpdate()
                    ->first();

                if (!$charge) return;

                $user = \App\Models\User::lockForUpdate()->findOrFail($charge->user_id);
                $netValue = $charge->value - $charge->fee_value;

                $balanceBefore = $user->balance;
                $user->forceFill([
                    'balance' => $user->balance - $netValue,
                ])->save();

                $charge->update([
                    'status' => 'refunded',
                    'acquirer_response' => json_encode($data),
                ]);

                Transaction::create([
                    'user_id' => $user->id,
                    'type' => 'refund',
                    'amount' => -$netValue,
                    'balance_before' => $balanceBefore,
                    'balance_after' => $user->balance,
                    'reference_type' => Charge::class,
                    'reference_id' => $charge->id,
                    'description' => 'Disputa aceita - estorno confirmado',
                ]);

                // Also link dispute to charge if not linked
                if ($externalId) {
                    Dispute::where('external_id', $externalId)
                        ->whereNull('charge_id')
                        ->update(['charge_id' => $charge->id, 'user_id' => $user->id]);
                }
            });
        }
    }

    private function handleDisputeRejected(Acquirer $acquirer, array $data, ?string $correlationId): void
    {
        Log::info('Dispute rejected - gateway manteve o pagamento', [
            'correlation_id' => $correlationId,
            'data' => $data,
        ]);

        $disputeData = $data['dispute'] ?? $data;
        $externalId = $disputeData['id'] ?? $disputeData['endToEndId'] ?? null;

        // Update dispute status
        if ($externalId) {
            Dispute::where('external_id', $externalId)->update([
                'status' => 'rejected',
                'resolved_at' => now(),
                'resolution' => 'Contestação rejeitada - pagamento mantido',
            ]);
        }

        if ($correlationId) {
            Charge::where('correlation_id', $correlationId)
                ->where('acquirer_id', $acquirer->id)
                ->update(['acquirer_response' => json_encode($data)]);
        }
    }

    private function handleDisputeCanceled(Acquirer $acquirer, array $data, ?string $correlationId): void
    {
        Log::info('Dispute canceled', [
            'correlation_id' => $correlationId,
            'data' => $data,
        ]);

        $disputeData = $data['dispute'] ?? $data;
        $externalId = $disputeData['id'] ?? $disputeData['endToEndId'] ?? null;

        // Update dispute status
        if ($externalId) {
            Dispute::where('external_id', $externalId)->update([
                'status' => 'cancelled',
                'resolved_at' => now(),
                'resolution' => 'Contestação cancelada pelo pagador',
            ]);
        }

        if ($correlationId) {
            Charge::where('correlation_id', $correlationId)
                ->where('acquirer_id', $acquirer->id)
                ->update(['acquirer_response' => json_encode($data)]);
        }
    }
}
