<?php

namespace App\Console\Commands;

use App\Models\Charge;
use App\Models\Transaction;
use App\Models\User;
use App\Models\Withdrawal;
use App\Services\AcquirerFactory;
use App\Services\WebhookCallbackService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Rede de segurança: consulta a Woovi pelo status de cobranças que ainda estão
 * pendentes (caso um webhook tenha se perdido) e credita as que já foram pagas.
 * É idempotente — se o webhook chegar junto, o lock + checagem de status evita
 * crédito duplicado. Também sinaliza saques travados para revisão manual.
 */
class ReconcileCharges extends Command
{
    protected $signature = 'flowinpay:reconcile {--limit=100}';
    protected $description = 'Reconcilia cobranças pendentes com a Woovi (recupera webhooks perdidos)';

    public function handle(): int
    {
        $limit = (int) $this->option('limit');

        $charges = Charge::whereIn('status', ['active', 'pending'])
            ->where('created_at', '<', now()->subMinutes(3))
            ->where('created_at', '>', now()->subHours(12))
            ->with('acquirer')
            ->orderBy('created_at')
            ->limit($limit)
            ->get();

        $recovered = 0;
        foreach ($charges as $charge) {
            if (!$charge->acquirer || !$charge->acquirer->isActive()) {
                continue;
            }
            try {
                $remote = AcquirerFactory::make($charge->acquirer)->getCharge($charge->correlation_id);
                $status = strtoupper($remote['charge']['status'] ?? $remote['status'] ?? '');

                if (in_array($status, ['COMPLETED', 'CONFIRMED', 'PAID'], true)) {
                    if ($this->creditCharge($charge, $remote)) {
                        $recovered++;
                    }
                } elseif ($status === 'EXPIRED') {
                    $charge->update(['status' => 'expired']);
                }
            } catch (\Throwable $e) {
                Log::warning('Reconcile: falha ao consultar cobrança', [
                    'charge_id' => $charge->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        // Visibilidade: saques presos em processing (timeout) precisam de revisão manual.
        $stuck = Withdrawal::where('status', 'processing')
            ->where('updated_at', '<', now()->subMinutes(30))
            ->count();
        if ($stuck > 0) {
            Log::warning('Reconcile: saques travados em processing aguardando revisão manual', ['count' => $stuck]);
        }

        $this->info("Reconcile: {$charges->count()} cobranças checadas, {$recovered} recuperadas, {$stuck} saques travados.");
        return self::SUCCESS;
    }

    /**
     * Credita a cobrança de forma idempotente (mesma lógica/locks do webhook).
     * Retorna true se creditou agora; false se já estava processada.
     */
    private function creditCharge(Charge $charge, array $data): bool
    {
        $credited = DB::transaction(function () use ($charge, $data) {
            $locked = Charge::where('id', $charge->id)->lockForUpdate()->first();
            if (!$locked || !in_array($locked->status, ['active', 'pending'], true)) {
                return false; // webhook chegou antes — não credita de novo
            }

            $user = User::lockForUpdate()->findOrFail($locked->user_id);
            $locked->update([
                'status' => 'paid',
                'paid_at' => $data['charge']['paidAt'] ?? now()->toDateTimeString(),
                'acquirer_response' => json_encode($data),
            ]);

            $net = $locked->value - $locked->fee_value;
            $before = $user->balance;
            $user->forceFill(['balance' => $user->balance + $net])->save();

            Transaction::create([
                'user_id' => $user->id,
                'type' => 'charge_received',
                'amount' => $net,
                'balance_before' => $before,
                'balance_after' => $user->balance,
                'reference_type' => Charge::class,
                'reference_id' => $locked->id,
                'description' => 'Pagamento recuperado por reconciliação (taxa R$' . number_format($locked->fee_value, 2, '.', '') . ' descontada)',
            ]);

            return true;
        });

        if ($credited) {
            app(WebhookCallbackService::class)->sendChargeCompleted($charge->fresh());
            Log::info('Reconcile: webhook perdido recuperado', ['charge_id' => $charge->id]);
        }

        return $credited;
    }
}
