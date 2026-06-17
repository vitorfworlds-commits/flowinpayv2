<?php

namespace App\Services\Acquirers;

use App\Models\Acquirer;
use App\Models\Charge;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OpenPixService implements AcquirerInterface
{
    private Acquirer $acquirer;
    private string $baseUrl;
    private string $apiKey;

    public function __construct(Acquirer $acquirer)
    {
        $this->acquirer = $acquirer;
        $this->baseUrl = rtrim($acquirer->base_url, '/');
        $this->apiKey = $acquirer->api_key;
    }

    private function headers(): array
    {
        return [
            'Authorization' => $this->apiKey,
            'Content-Type' => 'application/json',
            'Accept' => 'application/json',
        ];
    }

    public function createCharge(Charge $charge, array $customer = null): array
    {
        $payload = [
            'correlationID' => $charge->correlation_id,
            'value' => (int) ($charge->value * 100),
        ];

        if ($customer) {
            $payload['customer'] = $this->formatCustomer($customer);
        }

        $response = Http::withHeaders($this->headers())
            ->timeout(30)

            ->post("{$this->baseUrl}/api/v1/charge", $payload);

        if ($response->failed()) {
            Log::error('OpenPix create charge failed', [
                'status' => $response->status(),
                'response' => $response->body(),
                'charge_id' => $charge->id,
            ]);

            throw new \Exception('Erro ao criar cobrança na OpenPix: ' . $response->body());
        }

        return $response->json();
    }

    public function getCharge(string $correlationId): array
    {
        $response = Http::withHeaders($this->headers())
            ->timeout(30)

            ->get("{$this->baseUrl}/api/v1/charge/{$correlationId}");

        if ($response->failed()) {
            Log::error('OpenPix get charge failed', [
                'status' => $response->status(),
                'response' => $response->body(),
                'correlation_id' => $correlationId,
            ]);

            throw new \Exception('Erro ao buscar cobrança na OpenPix');
        }

        return $response->json();
    }

    public function getChargeByEndToEndId(string $endToEndId): ?array
    {
        $response = Http::withHeaders($this->headers())
            ->timeout(30)
            ->get("{$this->baseUrl}/api/v1/charge", [
                'endToEndId' => $endToEndId,
            ]);

        if ($response->failed()) {
            Log::error('OpenPix get charge by endToEndId failed', [
                'status' => $response->status(),
                'response' => $response->body(),
                'endToEndId' => $endToEndId,
            ]);
            return null;
        }

        $data = $response->json();
        return $data['data'] ?? $data['charges'] ?? null;
    }

    public function listCharges(int $page = 1, int $limit = 50): array
    {
        $response = Http::withHeaders($this->headers())
            ->timeout(30)

            ->get("{$this->baseUrl}/api/v1/charge", [
                'page' => $page,
                'limit' => $limit,
            ]);

        if ($response->failed()) {
            throw new \Exception('Erro ao listar cobranças na OpenPix');
        }

        return $response->json();
    }

    public function createWithdrawal(string $pixKey, string $pixKeyType, float $value): array
    {
        $correlationId = 'withdrawal_' . time() . '_' . bin2hex(random_bytes(8));

        $response = Http::withHeaders($this->headers())
            ->timeout(30)

            ->post("{$this->baseUrl}/api/v1/payment", [
                'correlationID' => $correlationId,
                'destinationAlias' => $pixKey,
                'destinationAliasType' => strtoupper($pixKeyType),
                'type' => 'PIX_KEY',
                'value' => (int) ($value * 100),
                'comment' => 'Saque FlowinPay',
            ]);

        if ($response->failed()) {
            Log::error('Woovi create payment failed', [
                'status' => $response->status(),
                'response' => $response->body(),
            ]);

            throw new \Exception('Erro ao solicitar pagamento na Woovi: ' . $response->body());
        }

        // Aprovar o pagamento
        $approve = Http::withHeaders($this->headers())
            ->timeout(30)
            ->post("{$this->baseUrl}/api/v1/payment/approve", [
                'correlationID' => $correlationId,
            ]);

        if ($approve->failed()) {
            Log::error('Woovi approve payment failed', [
                'status' => $approve->status(),
                'response' => $approve->body(),
            ]);

            throw new \Exception('Erro ao aprovar pagamento na Woovi: ' . $approve->body());
        }

        return [
            'success' => true,
            'status' => 'APPROVED',
            'transaction' => [
                'correlationID' => $correlationId,
                'status' => 'COMPLETED',
                'value' => (int) ($value * 100),
            ],
        ];
    }

    public function verifyWebhookSignature(string $payload, string $signature): bool
    {
        $secretKey = $this->acquirer->api_secret;

        if (!$secretKey) {
            Log::warning('OpenPix webhook secret not configured');
            return false;
        }

        $expected = base64_encode(hash_hmac('sha1', $payload, $secretKey, true));

        return hash_equals($expected, $signature);
    }

    public function refund(string $correlationId, float $value, string $refundCorrelationId = null): array
    {
        if (!$refundCorrelationId) {
            $refundCorrelationId = 'refund_' . time() . '_' . bin2hex(random_bytes(8));
        }

        $payload = [
            'correlationID' => $refundCorrelationId,
            'value' => (int) ($value * 100),
        ];

        // POST /api/v1/charge/{correlationID}/refund — correlationID of the CHARGE in URL
        $response = Http::withHeaders($this->headers())
            ->timeout(30)

            ->post("{$this->baseUrl}/api/v1/charge/{$correlationId}/refund", $payload);

        if ($response->failed()) {
            Log::error('OpenPix refund failed', [
                'status' => $response->status(),
                'response' => $response->body(),
            ]);

            throw new \Exception('Erro ao criar reembolso na OpenPix');
        }

        return $response->json();
    }

    private function formatCustomer(array $customer): array
    {
        $formatted = [
            'name' => $customer['name'] ?? '',
        ];

        if (!empty($customer['tax_id'])) {
            $formatted['taxID'] = $customer['tax_id'];
        }

        if (!empty($customer['email'])) {
            $formatted['email'] = $customer['email'];
        }

        if (!empty($customer['phone'])) {
            $formatted['phone'] = $customer['phone'];
        }

        return $formatted;
    }

    // ========== SUBACCOUNT METHODS ==========

    public function createSubAccount(string $pixKey, string $name): array
    {
        $response = Http::withHeaders($this->headers())
            ->timeout(30)

            ->post("{$this->baseUrl}/api/v1/subaccount", [
                'pixKey' => $pixKey,
                'name' => $name,
            ]);

        if ($response->failed()) {
            Log::error('OpenPix create subaccount failed', [
                'status' => $response->status(),
                'response' => $response->body(),
            ]);

            throw new \Exception('Erro ao criar subconta na OpenPix: ' . $response->body());
        }

        return $response->json();
    }

    public function getSubAccount(string $pixKey): array
    {
        $response = Http::withHeaders($this->headers())
            ->timeout(30)

            ->get("{$this->baseUrl}/api/v1/subaccount/{$pixKey}");

        if ($response->failed()) {
            Log::error('OpenPix get subaccount failed', [
                'status' => $response->status(),
                'response' => $response->body(),
            ]);

            throw new \Exception('Erro ao buscar subconta na OpenPix');
        }

        return $response->json();
    }

    public function listSubAccounts(int $page = 1, int $limit = 50): array
    {
        $response = Http::withHeaders($this->headers())
            ->timeout(30)

            ->get("{$this->baseUrl}/api/v1/subaccount", [
                'skip' => ($page - 1) * $limit,
                'limit' => $limit,
            ]);

        if ($response->failed()) {
            throw new \Exception('Erro ao listar subcontas na OpenPix');
        }

        return $response->json();
    }

    public function getSubAccountBalance(string $pixKey): array
    {
        $response = Http::withHeaders($this->headers())
            ->timeout(30)

            ->get("{$this->baseUrl}/api/v1/subaccount/{$pixKey}");

        if ($response->failed()) {
            throw new \Exception('Erro ao buscar saldo da subconta');
        }

        return $response->json();
    }

    public function withdrawFromSubAccount(string $subAccountPixKey, float $value): array
    {
        $response = Http::withHeaders($this->headers())
            ->timeout(30)

            ->post("{$this->baseUrl}/api/v1/subaccount/{$subAccountPixKey}/withdraw", [
                'value' => (int) ($value * 100),
            ]);

        if ($response->failed()) {
            Log::error('OpenPix subaccount withdraw failed', [
                'status' => $response->status(),
                'response' => $response->body(),
            ]);

            throw new \Exception('Erro ao sacar da subconta: ' . $response->body());
        }

        return $response->json();
    }

    public function transferToSubAccount(string $subAccountPixKey, float $value, string $description = null): array
    {
        $payload = [
            'value' => (int) ($value * 100),
            'toPixKey' => $subAccountPixKey,
        ];

        if ($description) {
            $payload['description'] = $description;
        }

        $response = Http::withHeaders($this->headers())
            ->timeout(30)

            ->post("{$this->baseUrl}/api/v1/subaccount/transfer", $payload);

        if ($response->failed()) {
            Log::error('OpenPix transfer to subaccount failed', [
                'status' => $response->status(),
                'response' => $response->body(),
            ]);

            throw new \Exception('Erro ao transferir pra subconta: ' . $response->body());
        }

        return $response->json();
    }

    public function createChargeOnSubAccount(string $subAccountPixKey, Charge $charge, array $customer = null): array
    {
        $payload = [
            'correlationID' => $charge->correlation_id,
            'value' => (int) ($charge->value * 100),
            'subaccount' => $subAccountPixKey,
        ];

        if ($customer) {
            $payload['customer'] = $this->formatCustomer($customer);
        }

        $response = Http::withHeaders($this->headers())
            ->timeout(30)

            ->post("{$this->baseUrl}/api/v1/charge", $payload);

        if ($response->failed()) {
            Log::error('OpenPix create charge on subaccount failed', [
                'status' => $response->status(),
                'response' => $response->body(),
                'charge_id' => $charge->id,
            ]);

            throw new \Exception('Erro ao criar cobrança na subconta: ' . $response->body());
        }

        return $response->json();
    }

    public function getBalance(): array
    {
        $response = Http::withHeaders($this->headers())
            ->timeout(15)

            ->get("{$this->baseUrl}/api/v1/balance");

        if ($response->failed()) {
            return ['balance' => 0, 'blocked' => 0];
        }

        $data = $response->json();
        return [
            'balance' => ($data['balance'] ?? 0) / 100,
            'blocked' => ($data['blocked'] ?? 0) / 100,
        ];
    }
}
