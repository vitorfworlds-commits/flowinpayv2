<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreWithdrawalRequest;
use App\Models\Acquirer;
use App\Models\AuditLog;
use App\Models\FeeConfig;
use App\Models\Transaction;
use App\Models\User;
use App\Models\Withdrawal;
use App\Services\AcquirerFactory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class WithdrawalController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $withdrawals = $request->user()
            ->withdrawals()
            ->with('acquirer')
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return response()->json($withdrawals);
    }

    public function store(StoreWithdrawalRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $fee = FeeConfig::getActive();
        $acquirer = !empty($validated['acquirer_id'])
            ? Acquirer::findOrFail($validated['acquirer_id'])
            : Acquirer::where('is_active', true)->firstOrFail();

        if (!$acquirer->isActive()) {
            return response()->json([
                'message' => 'Adquirente inativa',
            ], 422);
        }

        $value = (float) $validated['value'];
        $feeValue = $fee->calculateWithdrawalFee($value);
        $netValue = round($value - $feeValue, 2);

        if ($netValue <= 0) {
            return response()->json([
                'message' => 'Valor insuficiente para saque após descontar taxa',
            ], 422);
        }

        // UNIFIED transaction: verify + debit + create withdrawal in ONE lock
        try {
            $withdrawal = DB::transaction(function () use ($request, $value, $validated, $acquirer, $feeValue, $netValue) {
                $user = User::lockForUpdate()->findOrFail($request->user()->id);

                if ($user->balance < $value) {
                    throw new \App\Exceptions\InsufficientBalanceException(
                        $user->balance, $value
                    );
                }

                $user->forceFill([
                    'balance' => $user->balance - $value,
                    'balance_blocked' => $user->balance_blocked + $value,
                ])->save();

                $withdrawal = Withdrawal::create([
                    'user_id' => $user->id,
                    'acquirer_id' => $acquirer->id,
                    'value' => $value,
                    'fee_value' => $feeValue,
                    'net_value' => $netValue,
                    'pix_key' => $validated['pix_key'],
                    'pix_key_type' => $validated['pix_key_type'],
                    'status' => 'pending',
                    'description' => $validated['description'] ?? null,
                ]);

                Transaction::create([
                    'user_id' => $user->id,
                    'type' => 'withdrawal',
                    'amount' => -$value,
                    'balance_before' => $user->balance + $value,
                    'balance_after' => $user->balance,
                    'reference_type' => Withdrawal::class,
                    'reference_id' => $withdrawal->id,
                    'description' => 'Saque solicitado',
                ]);

                Transaction::create([
                    'user_id' => $user->id,
                    'type' => 'withdrawal_fee',
                    'amount' => -$feeValue,
                    'balance_before' => $user->balance,
                    'balance_after' => round($user->balance - $feeValue, 2),
                    'reference_type' => Withdrawal::class,
                    'reference_id' => $withdrawal->id,
                    'description' => 'Taxa de saque',
                ]);

                return $withdrawal;
            });
        } catch (\App\Exceptions\InsufficientBalanceException $e) {
            return response()->json([
                'message' => 'Saldo insuficiente',
                'current_balance' => (float) $request->user()->fresh()->balance,
                'requested' => $value,
            ], 422);
        }

        // Chamar API real da OpenPix pra transferir
        try {
            $service = AcquirerFactory::make($acquirer);

            // Sacar da conta principal
            $response = $service->createWithdrawal(
                $validated['pix_key'],
                $validated['pix_key_type'],
                $netValue
            );

            $transferData = $response['transaction'] ?? $response;
            $withdrawal->update([
                'status' => 'completed',
                'transaction_id' => $transferData['correlationID'] ?? $transferData['transactionID'] ?? null,
                'acquirer_response' => json_encode($transferData),
                'processed_at' => now(),
            ]);

            // Liberar saldo bloqueado (o dinheiro saiu de verdade)
            $user = $request->user()->fresh();
            $user->decrement('balance_blocked', $withdrawal->value);

            AuditLog::log('withdrawal_requested', $withdrawal, null, [
                'value' => $value,
                'fee' => $feeValue,
                'net_value' => $netValue,
                'pix_key_type' => $validated['pix_key_type'],
            ]);

            return response()->json([
                'withdrawal' => $withdrawal->fresh('acquirer'),
                'fee' => [
                    'fee_value' => $feeValue,
                    'net_value' => $netValue,
                ],
            ], 201);

        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            // Timeout: withdrawal MAY have been processed — don't return balance
            Log::error('Withdrawal timeout — may have been processed', [
                'withdrawal_id' => $withdrawal->id,
                'acquirer' => $acquirer->slug,
                'error' => $e->getMessage(),
            ]);

            // IMPORTANTE: status 'processing' (não 'pending') — o PIX PODE ter sido
            // enviado pela adquirente. Deixar como 'pending' permitiria ao usuário
            // cancelar e receber o saldo de volta tendo já recebido o PIX (double-spend).
            // 'processing' não é cancelável; resolução fica para reconciliação/webhook.
            $withdrawal->update([
                'status' => 'processing',
                'acquirer_response' => json_encode(['error' => 'timeout', 'message' => $e->getMessage()]),
            ]);

            AuditLog::log('withdrawal_timeout', $withdrawal, null, [
                'message' => 'Timeout — saldo mantido bloqueado até reconciliação',
            ]);

            return response()->json([
                'message' => 'Saque em processamento. Aguarde a confirmação.',
                'withdrawal' => $withdrawal->fresh('acquirer'),
            ], 202);

        } catch (\Exception $e) {
            Log::error('Failed to process withdrawal on acquirer', [
                'withdrawal_id' => $withdrawal->id,
                'acquirer' => $acquirer->slug,
                'error' => $e->getMessage(),
            ]);

            // Devolver saldo em caso de falha definitiva (não timeout)
            DB::transaction(function () use ($withdrawal, $request) {
                $user = User::lockForUpdate()->findOrFail($request->user()->id);
                $user->forceFill([
                    'balance' => $user->balance + $withdrawal->value,
                    'balance_blocked' => $user->balance_blocked - $withdrawal->value,
                ])->save();

                $withdrawal->update([
                    'status' => 'failed',
                    'acquirer_response' => json_encode(['error' => $e->getMessage()]),
                ]);

                Transaction::create([
                    'user_id' => $user->id,
                    'type' => 'adjustment',
                    'amount' => $withdrawal->value,
                    'balance_before' => $user->balance - $withdrawal->value,
                    'balance_after' => $user->balance,
                    'reference_type' => Withdrawal::class,
                    'reference_id' => $withdrawal->id,
                    'description' => 'Saque falhou - saldo devolvido',
                ]);
            });

            return response()->json([
                'message' => 'Erro ao processar saque na adquirente',
                'error' => null,
            ], 500);
        }
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $withdrawal = $request->user()
            ->withdrawals()
            ->with('acquirer')
            ->where('id', $id)
            ->firstOrFail();

        return response()->json([
            'withdrawal' => $withdrawal,
        ]);
    }

    public function cancel(Request $request, string $id): JsonResponse
    {
        // Verificar dentro do lock pra evitar race condition
        $result = DB::transaction(function () use ($request, $id) {
            $withdrawal = $request->user()
                ->withdrawals()
                ->where('id', $id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($withdrawal->status !== 'pending') {
                return ['error' => true, 'message' => 'Não é possível cancelar este saque'];
            }

            $user = User::lockForUpdate()->findOrFail($request->user()->id);

            $user->forceFill([
                'balance' => $user->balance + $withdrawal->value,
                'balance_blocked' => $user->balance_blocked - $withdrawal->value,
            ])->save();

            $withdrawal->update(['status' => 'cancelled']);

            Transaction::create([
                'user_id' => $user->id,
                'type' => 'adjustment',
                'amount' => $withdrawal->value,
                'balance_before' => $user->balance - $withdrawal->value,
                'balance_after' => $user->balance,
                'reference_type' => Withdrawal::class,
                'reference_id' => $withdrawal->id,
                'description' => 'Saque cancelado - saldo devolvido',
            ]);

            return ['error' => false, 'withdrawal' => $withdrawal->fresh()];
        });

        if (isset($result['error']) && $result['error']) {
            return response()->json(['message' => $result['message']], 422);
        }

        return response()->json([
            'withdrawal' => $result['withdrawal'],
            'message' => 'Saque cancelado e saldo devolvido',
        ]);
    }
}
