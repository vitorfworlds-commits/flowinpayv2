<?php

namespace App\Jobs;

use App\Services\WebhookCallbackService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * Entrega de UM webhook de saída (uma URL). Roda na fila, fora do request/
 * transação — assim o processamento do webhook de entrada não fica preso
 * esperando o servidor do lojista. Re-tenta com backoff progressivo.
 */
class SendWebhookCallback implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 5;
    public int $timeout = 30;

    public function __construct(
        public string $url,
        public ?string $secret,
        public array $payload,
        public int $chargeId,
    ) {}

    /** Backoff progressivo entre tentativas (segundos). */
    public function backoff(): array
    {
        return [10, 30, 120, 300];
    }

    public function handle(WebhookCallbackService $service): void
    {
        $service->sendCallback($this->url, $this->secret, $this->payload, $this->chargeId);
    }

    public function failed(\Throwable $e): void
    {
        Log::error('Webhook callback falhou em definitivo', [
            'charge_id' => $this->chargeId,
            'url' => $this->url,
            'event' => $this->payload['event'] ?? null,
            'error' => $e->getMessage(),
        ]);
    }
}
