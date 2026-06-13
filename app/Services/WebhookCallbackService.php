<?php

namespace App\Services;

use App\Models\Charge;
use App\Models\User;
use App\Models\WebhookConfig;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WebhookCallbackService
{
    public function sendChargeCreated(Charge $charge): void
    {
        $payload = [
            'event' => 'charge.created',
            'charge' => $this->formatCharge($charge),
            'timestamp' => now()->toIso8601String(),
        ];

        $this->dispatch($charge, $payload);
    }

    public function sendChargeCompleted(Charge $charge): void
    {
        $payload = [
            'event' => 'charge.completed',
            'charge' => $this->formatCharge($charge, true),
            'timestamp' => now()->toIso8601String(),
        ];

        $this->dispatch($charge, $payload);
    }

    public function sendChargeExpired(Charge $charge): void
    {
        $payload = [
            'event' => 'charge.expired',
            'charge' => [
                'id' => $charge->id,
                'correlation_id' => $charge->correlation_id,
                'value' => (float) $charge->value,
                'status' => 'expired',
            ],
            'timestamp' => now()->toIso8601String(),
        ];

        $this->dispatch($charge, $payload);
    }

    public function sendChargeCancelled(Charge $charge): void
    {
        $payload = [
            'event' => 'charge.cancelled',
            'charge' => [
                'id' => $charge->id,
                'correlation_id' => $charge->correlation_id,
                'value' => (float) $charge->value,
                'status' => 'cancelled',
            ],
            'timestamp' => now()->toIso8601String(),
        ];

        $this->dispatch($charge, $payload);
    }

    public function sendRefundReceived(Charge $charge): void
    {
        $payload = [
            'event' => 'charge.refunded',
            'charge' => [
                'id' => $charge->id,
                'correlation_id' => $charge->correlation_id,
                'value' => (float) $charge->value,
                'status' => 'refunded',
            ],
            'timestamp' => now()->toIso8601String(),
        ];

        $this->dispatch($charge, $payload);
    }

    private function formatCharge(Charge $charge, bool $includePaid = false): array
    {
        $data = [
            'id' => $charge->id,
            'correlation_id' => $charge->correlation_id,
            'value' => (float) $charge->value,
            'fee_value' => (float) $charge->fee_value,
            'net_value' => round((float) $charge->value - (float) $charge->fee_value, 2),
            'status' => $includePaid ? 'paid' : $charge->status,
            'description' => $charge->description,
            'payment_link_url' => $charge->payment_link_url,
            'created_at' => $charge->created_at?->toIso8601String(),
        ];

        if ($includePaid) {
            $data['paid_at'] = $charge->paid_at?->toIso8601String();
        }

        return $data;
    }

    /**
     * Dispatch webhook to all configured destinations:
     * 1. Per-charge webhook_url (if set)
     * 2. User's WebhookConfigs matching the event
     */
    private function dispatch(Charge $charge, array $payload): void
    {
        $urls = [];

        // 1. Per-charge webhook_url
        if ($charge->webhook_url) {
            $urls[] = [
                'url' => $charge->webhook_url,
                'secret' => $charge->webhook_secret,
            ];
        }

        // 2. User's configured webhooks matching the event
        $event = $payload['event'];
        $userWebhooks = WebhookConfig::where('user_id', $charge->user_id)
            ->where('is_active', true)
            ->get()
            ->filter(function ($wh) use ($event) {
                return in_array($event, $wh->events ?? []);
            });

        foreach ($userWebhooks as $wh) {
            $urls[] = [
                'url' => $wh->url,
                'secret' => $wh->secret,
            ];
        }

        // 3. Enfileira UMA entrega por destino — fora do request/transação.
        //    O worker envia (com retry/backoff), sem segurar locks de banco.
        foreach ($urls as $target) {
            \App\Jobs\SendWebhookCallback::dispatch($target['url'], $target['secret'], $payload, $charge->id);
        }
    }

    /**
     * Entrega de um webhook (chamado pelo job SendWebhookCallback).
     * Lança exceção em falha transitória pra a fila re-tentar; bloqueio de
     * SSRF é permanente (retorna sem re-tentar).
     */
    public function sendCallback(string $url, ?string $secret, array $payload, int $chargeId): void
    {
        // SSRF protection: block private/reserved IPs at delivery time
        $host = parse_url($url, PHP_URL_HOST);
        if ($host) {
            $ip = gethostbyname($host);
            if ($ip !== $host && !filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                Log::warning('Webhook callback blocked: private IP', ['url' => $url, 'resolved_ip' => $ip]);
                return; // bloqueio permanente — não re-tenta
            }
        }

        $body = json_encode($payload);

        $headers = [
            'Content-Type' => 'application/json',
            'X-FlowinPay-Event' => $payload['event'],
        ];

        if ($secret) {
            $headers['X-FlowinPay-Signature'] = hash_hmac('sha256', $body, $secret);
        }

        // allow_redirects=false: impede que um endpoint público redirecione (302)
        // para rede interna / metadata (169.254.169.254), driblando a checagem de IP.
        $response = Http::withHeaders($headers)
            ->withOptions(['allow_redirects' => false])
            ->timeout(10)
            ->post($url, $payload);

        Log::info('Webhook callback sent', [
            'charge_id' => $chargeId,
            'url' => $url,
            'event' => $payload['event'],
            'status' => $response->status(),
        ]);

        // Não-2xx → lança pra fila re-tentar com backoff.
        if (!$response->successful()) {
            throw new \RuntimeException("Webhook callback para {$url} retornou HTTP {$response->status()}");
        }
    }
}
