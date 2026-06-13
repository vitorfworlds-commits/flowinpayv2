# Guia: Como Receber Webhooks da FlowinPay

## Visão Geral

Quando um evento ocorre na FlowinPay (ex: pagamento confirmado), enviamos um POST para a URL que você configurou. Seu sistema precisa:

1. **Receber** o POST na sua URL
2. **Retornar** HTTP 200 rapidamente (timeout de 5 segundos)
3. **Verificar** a assinatura (opcional, mas recomendado)
4. **Processar** o evento

## Passo 1: Configurar a URL

Você pode configurar a URL de webhook de duas formas:

### Opção A: Via Painel
1. Acesse **Integração → Webhooks**
2. Clique em **Novo Webhook**
3. Preencha a URL e selecione os eventos

### Opção B: Via API (Automático)
Ao criar uma cobrança, passe `webhook_url` no body:

```bash
curl -X POST "https://app.flowinpay.com.br/api/v1/charges" \
  -H "X-Api-Key: fp_xxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "value": 50.00,
    "acquirer_id": 1,
    "webhook_url": "https://seusite.com/webhook/flowinpay"
  }'
```

A FlowinPay criará automaticamente um webhook na sua conta.

---

## Passo 2: Criar o Endpoint

Seu endpoint precisa:
- Aceitar POST
- Ler o body como JSON
- Retornar HTTP 200 em menos de 5 segundos

### PHP

```php
<?php
// webhook.php

$secret = 'whsec_seu_secret_aqui';

// Ler o payload
$payload = file_get_contents('php://input');
$data = json_decode($payload, true);

// Verificar assinatura (recomendado)
$signature = $_SERVER['HTTP_X_FLOWINPAY_SIGNATURE'] ?? '';
$expected = hash_hmac('sha256', $payload, $secret);

if (!hash_equals($expected, $signature)) {
    http_response_code(401);
    exit('Assinatura inválida');
}

// Retornar 200 IMEDIATAMENTE
http_response_code(200);
header('Content-Type: application/json');
echo '{}';

// Processar o evento (depois de retornar 200)
$event = $data['event'] ?? '';
$charge = $data['charge'] ?? [];

switch ($event) {
    case 'charge.completed':
        // Pagamento confirmado!
        $correlationId = $charge['correlation_id'];
        $value = $charge['value'];
        // Atualizar pedido no banco de dados
        break;

    case 'charge.expired':
        // Cobrança expirada
        break;

    case 'charge.cancelled':
        // Cobrança cancelada
        break;
}
```

### Node.js (Express)

```javascript
const express = require('express');
const crypto = require('crypto');

const app = express();
const SECRET = 'whsec_seu_secret_aqui';

// IMPORTANTE: usar raw body para verificar assinatura
app.post('/webhook/flowinpay', express.raw({ type: 'application/json' }), (req, res) => {
    // Retornar 200 IMEDIATAMENTE
    res.json({});

    // Verificar assinatura
    const signature = req.headers['x-flowinpay-signature'];
    const expected = crypto.createHmac('sha256', SECRET).update(req.body).digest('hex');

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
        console.error('Assinatura inválida');
        return;
    }

    // Processar evento
    const event = JSON.parse(req.body);

    switch (event.event) {
        case 'charge.completed':
            console.log('Pagamento confirmado!', event.charge.correlation_id);
            // Atualizar pedido no banco de dados
            break;

        case 'charge.expired':
            console.log('Cobrança expirada');
            break;

        case 'charge.cancelled':
            console.log('Cobrança cancelada');
            break;
    }
});

app.listen(3000, () => console.log('Webhook rodando na porta 3000'));
```

### Python (Flask)

```python
from flask import Flask, request, jsonify
import hmac
import hashlib

app = Flask(__name__)
SECRET = 'whsec_seu_secret_aqui'

@app.route('/webhook/flowinpay', methods=['POST'])
def webhook():
    # Retornar 200 IMEDIATAMENTE
    response = jsonify({})

    # Verificar assinatura
    payload = request.get_data()
    signature = request.headers.get('X-FlowinPay-Signature', '')
    expected = hmac.new(SECRET.encode(), payload, hashlib.sha256).hexdigest()

    if not hmac.compare_digest(signature, expected):
        print('Assinatura inválida')
        return response

    # Processar evento
    data = request.get_json()
    event = data.get('event')
    charge = data.get('charge', {})

    if event == 'charge.completed':
        print(f'Pagamento confirmado! {charge.get("correlation_id")}')
        # Atualizar pedido no banco de dados

    elif event == 'charge.expired':
        print('Cobrança expirada')

    elif event == 'charge.cancelled':
        print('Cobrança cancelada')

    return response

if __name__ == '__main__':
    app.run(port=3000)
```

### Java (Spring Boot)

```java
@RestController
public class FlowinPayWebhookController {

    private static final String SECRET = "whsec_seu_secret_aqui";

    @PostMapping("/webhook/flowinpay")
    public ResponseEntity<String> handleWebhook(@RequestBody String payload,
                                                 @RequestHeader("X-FlowinPay-Signature") String signature) {
        // Verificar assinatura
        String expected = hmacSha256(payload, SECRET);
        if (!MessageDigest.isEqual(expected.getBytes(), signature.getBytes())) {
            return ResponseEntity.status(401).body("Assinatura inválida");
        }

        // Retornar 200 IMEDIATAMENTE
        ResponseEntity<String> response = ResponseEntity.ok("{}");

        // Processar evento
        JSONObject data = new JSONObject(payload);
        String event = data.getString("event");
        JSONObject charge = data.getJSONObject("charge");

        switch (event) {
            case "charge.completed":
                System.out.println("Pagamento confirmado! " + charge.getString("correlation_id"));
                break;
            case "charge.expired":
                System.out.println("Cobrança expirada");
                break;
            case "charge.cancelled":
                System.out.println("Cobrança cancelada");
                break;
        }

        return response;
    }

    private String hmacSha256(String data, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(), "HmacSHA256"));
            byte[] hash = mac.doFinal(data.getBytes());
            return bytesToHex(hash);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
```

### Go

```go
package main

import (
    "crypto/hmac"
    "crypto/sha256"
    "encoding/hex"
    "encoding/json"
    "fmt"
    "io"
    "net/http"
)

const secret = "whsec_seu_secret_aqui"

type WebhookPayload struct {
    Event string `json:"event"`
    Charge struct {
        ID            int     `json:"id"`
        CorrelationID string  `json:"correlation_id"`
        Value         float64 `json:"value"`
        Status        string  `json:"status"`
    } `json:"charge"`
    Timestamp string `json:"timestamp"`
}

func webhookHandler(w http.ResponseWriter, r *http.Request) {
    // Retornar 200 IMEDIATAMENTE
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusOK)
    w.Write([]byte("{}"))

    // Ler payload
    body, _ := io.ReadAll(r.Body)

    // Verificar assinatura
    signature := r.Header.Get("X-FlowinPay-Signature")
    mac := hmac.New(sha256.New, []byte(secret))
    mac.Write(body)
    expected := hex.EncodeToString(mac.Sum(nil))

    if !hmac.Equal([]byte(signature), []byte(expected)) {
        fmt.Println("Assinatura inválida")
        return
    }

    // Processar evento
    var payload WebhookPayload
    json.Unmarshal(body, &payload)

    switch payload.Event {
    case "charge.completed":
        fmt.Printf("Pagamento confirmado! %s\n", payload.Charge.CorrelationID)
    case "charge.expired":
        fmt.Println("Cobrança expirada")
    case "charge.cancelled":
        fmt.Println("Cobrança cancelada")
    }
}

func main() {
    http.HandleFunc("/webhook/flowinpay", webhookHandler)
    http.ListenAndServe(":3000", nil)
}
```

### C# (.NET)

```csharp
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Mvc;

[ApiController]
public class FlowinPayWebhookController : ControllerBase
{
    private const string Secret = "whsec_seu_secret_aqui";

    [HttpPost("/webhook/flowinpay")]
    public async Task<IActionResult> HandleWebhook()
    {
        // Retornar 200 IMEDIATAMENTE
        var response = Ok(new { });

        // Ler payload
        using var reader = new StreamReader(Request.Body);
        var payload = await reader.ReadToEndAsync();

        // Verificar assinatura
        var signature = Request.Headers["X-FlowinPay-Signature"].ToString();
        var expected = HmacSha256(payload, Secret);

        if (!CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(signature),
            Encoding.UTF8.GetBytes(expected)))
        {
            return Unauthorized("Assinatura inválida");
        }

        // Processar evento
        var data = JsonSerializer.Deserialize<WebhookPayload>(payload);

        switch (data?.Event)
        {
            case "charge.completed":
                Console.WriteLine($"Pagamento confirmado! {data.Charge.CorrelationId}");
                break;
            case "charge.expired":
                Console.WriteLine("Cobrança expirada");
                break;
            case "charge.cancelled":
                Console.WriteLine("Cobrança cancelada");
                break;
        }

        return response;
    }

    private static string HmacSha256(string data, string secret)
    {
        var keyBytes = Encoding.UTF8.GetBytes(secret);
        var dataBytes = Encoding.UTF8.GetBytes(data);
        using var hmac = new HMACSHA256(keyBytes);
        var hash = hmac.ComputeHash(dataBytes);
        return Convert.ToHexString(hash).ToLower();
    }
}
```

### Ruby (Sinatra)

```ruby
require 'sinatra'
require 'json'
require 'openssl'

SECRET = 'whsec_seu_secret_aqui'

post '/webhook/flowinpay' do
  # Retornar 200 IMEDIATAMENTE
  status 200
  content_type :json
  '{}'

  # Verificar assinatura
  payload = request.body.read
  signature = request.env['HTTP_X_FLOWINPAY_SIGNATURE']
  expected = OpenSSL::HMAC.hexdigest('sha256', SECRET, payload)

  unless Rack::Utils.secure_compare(signature, expected)
    halt 401, 'Assinatura inválida'
  end

  # Processar evento
  data = JSON.parse(payload)
  event = data['event']
  charge = data['charge'] || {}

  case event
  when 'charge.completed'
    puts "Pagamento confirmado! #{charge['correlation_id']}"
  when 'charge.expired'
    puts 'Cobrança expirada'
  when 'charge.cancelled'
    puts 'Cobrança cancelada'
  end
end
```

---

## Passo 3: Testar

### Teste via Painel
1. Vá em **Integração → Webhooks**
2. Clique no webhook
3. Clique em **Testar**

### Teste via API
```bash
curl -X POST "https://app.flowinpay.com.br/api/v1/webhooks/1/test" \
  -H "X-Api-Key: fp_xxxx"
```

### Teste Local (ngrok)
```bash
# Instalar ngrok
ngrok http 3000

# Use a URL gerada como webhook_url
# Ex: https://abc123.ngrok.io/webhook/flowinpay
```

---

## Passo 4: Processar o Evento

### Eventos Importantes

| Evento | Quando | Ação recomendada |
|---|---|---|
| `charge.created` | Cobrança criada | Salvar no banco, exibir QR Code |
| `charge.completed` | Pagamento confirmado | Liberar acesso, enviar produto |
| `charge.expired` | Cobrança expirada | Cancelar pedido |
| `charge.cancelled` | Cobrança cancelada | Cancelar pedido |
| `charge.refunded` | Estorno processado | Estornar pedido |

### Exemplo: Atualizar Pedido

```php
<?php
// Depois de retornar 200

if ($event === 'charge.completed') {
    $correlationId = $charge['correlation_id'];
    $value = $charge['value'];

    // Atualizar pedido no banco
    $pdo->prepare("UPDATE orders SET status = 'paid', paid_at = NOW() WHERE payment_id = ?")
        ->execute([$correlationId]);

    // Liberar acesso
    // Enviar produto
    // Enviar email de confirmação
}
```

---

## Boas Práticas

1. **Retorne 200 rápido** — Processe o evento de forma assíncrona (filas, jobs)
2. **Verifique a assinatura** — Sempre valide o header `X-FlowinPay-Signature`
3. **Implemente idempotência** — O mesmo evento pode ser enviado mais de uma vez
4. **Use HTTPS** — URLs HTTP são aceitas mas não recomendadas
5. **Log de eventos** — Registre todos os webhooks recebidos para debugging

---

## Troubleshooting

### Webhook não está recebendo
- Verifique se a URL está correta e acessível
- Verifique se o servidor está rodando
- Teste com ngrok para ambientes locais

### Assinatura inválida
- Verifique se o secret está correto
- Verifique se está usando o body raw (não parseado)

### Timeout
- Retorne 200 antes de processar o evento
- Use filas/jobs para processamento pesado

### Evento duplicado
- Implemente idempotência usando o `correlation_id`
- Verifique se o pedido já foi processado antes de atualizar
