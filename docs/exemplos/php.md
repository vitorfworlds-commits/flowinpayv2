# Exemplos com PHP

## Configuração

```php
<?php

class FlowinPay
{
    private string $apiUrl;
    private string $apiKey;

    public function __construct(string $apiUrl, string $apiKey)
    {
        $this->apiUrl = rtrim($apiUrl, '/');
        $this->apiKey = $apiKey;
    }

    private function request(string $method, string $path, array $data = []): array
    {
        $url = $this->apiUrl . $path;

        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_HTTPHEADER => [
                'X-Api-Key: ' . $this->apiKey,
                'Content-Type: application/json',
                'Accept: application/json',
            ],
        ]);

        if ($method === 'POST') {
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        } elseif ($method === 'PUT') {
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        } elseif ($method === 'DELETE') {
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');
        }

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            throw new Exception("cURL Error: {$error}");
        }

        $result = json_decode($response, true);

        if ($httpCode >= 400) {
            $message = $result['message'] ?? 'Erro desconhecido';
            throw new Exception("HTTP {$httpCode}: {$message}");
        }

        return $result;
    }

    // ========== COBRANÇAS ==========

    public function createCharge(float $value, string $description = null, array $customer = null): array
    {
        $data = [
            'value' => $value,
            'acquirer_id' => 1,
        ];

        if ($description) $data['description'] = $description;
        if ($customer) $data = array_merge($data, $customer);

        return $this->request('POST', '/v1/charges', $data);
    }

    public function getCharge(int $id): array
    {
        return $this->request('GET', "/v1/charges/{$id}");
    }

    public function listCharges(int $page = 1): array
    {
        return $this->request('GET', "/v1/charges?page={$page}");
    }

    public function cancelCharge(int $id): array
    {
        return $this->request('POST', "/v1/charges/{$id}/cancel");
    }

    // ========== SALDO ==========

    public function getBalance(): array
    {
        return $this->request('GET', '/v1/balance');
    }

    public function getSummary(): array
    {
        return $this->request('GET', '/v1/summary');
    }

    // ========== TRANSAÇÕES ==========

    public function listTransactions(array $filters = []): array
    {
        $query = http_build_query($filters);
        return $this->request('GET', "/v1/transactions?{$query}");
    }

    // ========== SAQUES ==========

    public function createWithdrawal(float $value, string $pixKey, string $pixKeyType, string $description = null): array
    {
        $data = [
            'value' => $value,
            'pix_key' => $pixKey,
            'pix_key_type' => $pixKeyType,
        ];

        if ($description) $data['description'] = $description;

        return $this->request('POST', '/v1/withdrawals', $data);
    }

    public function listWithdrawals(): array
    {
        return $this->request('GET', '/v1/withdrawals');
    }

    // ========== WEBHOOKS ==========

    public function verifyWebhook(string $payload, string $signature, string $secret): bool
    {
        $expected = hash_hmac('sha256', $payload, $secret);
        return hash_equals($expected, $signature);
    }
}
```

---

## Uso Básico

```php
<?php

require_once 'FlowinPay.php';

$flowinpay = new FlowinPay(
    'https://app.flowinpay.com/api',
    'fp_xxxxxxxxxxxxxxxx'
);

// Criar cobrança
$result = $flowinpay->createCharge(
    value: 50.00,
    description: 'Plano Premium'
);

$charge = $result['charge'];

echo "Link de pagamento: {$charge['payment_link_url']}\n";
echo "PIX copia e cola: {$charge['br_code']}\n";
echo "Status: {$charge['status']}\n";
```

---

## Exemplo: Loja Virtual

```php
<?php

// Quando o cliente finaliza a compra
$orderId = 1234;
$orderTotal = 99.90;

$result = $flowinpay->createCharge(
    value: $orderTotal,
    description: "Pedido #{$orderId}",
    customer: [
        'customer_name' => $customer->name,
        'customer_email' => $customer->email,
        'customer_tax_id' => $customer->cpf,
    ]
);

$charge = $result['charge'];

// Salvar no banco de dados
DB::table('orders')->where('id', $orderId)->update([
    'payment_id' => $charge['correlation_id'],
    'payment_url' => $charge['payment_link_url'],
    'payment_status' => 'pending',
]);

// Redirecionar cliente para pagamento
header("Location: {$charge['payment_link_url']}");
exit;
```

---

## Exemplo: Receber Webhook (Laravel)

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class FlowinPayWebhookController extends Controller
{
    public function handle(Request $request)
    {
        // Verificar assinatura
        $signature = $request->header('x-webhook-signature');
        $secret = config('services.flowinpay.webhook_secret');

        $expected = hash_hmac('sha256', $request->getContent(), $secret);

        if (!hash_equals($expected, $signature)) {
            Log::warning('FlowinPay webhook: assinatura inválida');
            return response()->json(['message' => 'Invalid signature'], 401);
        }

        $event = $request->json();

        Log::info('FlowinPay webhook recebido', [
            'event' => $event->get('event'),
        ]);

        switch ($event->get('event')) {
            case 'charge.completed':
                $this->handleChargeCompleted($event->get('charge'));
                break;

            case 'charge.expired':
                $this->handleChargeExpired($event->get('charge'));
                break;

            case 'charge.cancelled':
                $this->handleChargeCancelled($event->get('charge'));
                break;

            default:
                Log::info('Evento não tratado', ['event' => $event->get('event')]);
        }

        return response()->json(['message' => 'OK']);
    }

    private function handleChargeCompleted(array $charge): void
    {
        $orderId = $charge['correlation_id'];

        DB::table('orders')->where('payment_id', $orderId)->update([
            'payment_status' => 'paid',
            'paid_at' => $charge['paid_at'],
        ]);

        // Liberar acesso, enviar produto, etc.
    }

    private function handleChargeExpired(array $charge): void
    {
        $orderId = $charge['correlation_id'];

        DB::table('orders')->where('payment_id', $orderId)->update([
            'payment_status' => 'expired',
        ]);
    }

    private function handleChargeCancelled(array $charge): void
    {
        $orderId = $charge['correlation_id'];

        DB::table('orders')->where('payment_id', $orderId)->update([
            'payment_status' => 'cancelled',
        ]);
    }
}
```

---

## Exemplo: Polling de Status (sem Webhook)

```php
<?php

function waitForPayment(FlowinPay $flowinpay, int $chargeId, int $timeout = 600): array
{
    $start = time();

    while (time() - $start < $timeout) {
        $result = $flowinpay->getCharge($chargeId);
        $charge = $result['charge'];

        if ($charge['status'] === 'paid') {
            return $charge;
        }

        if (in_array($charge['status'], ['cancelled', 'expired'])) {
            throw new Exception("Cobrança {$charge['status']}");
        }

        sleep(5); // Consultar a cada 5 segundos
    }

    throw new Exception("Timeout aguardando pagamento");
}
```
