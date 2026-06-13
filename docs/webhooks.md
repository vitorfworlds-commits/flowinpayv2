# Webhooks

Webhooks permitem que seu sistema receba notificações em tempo real sobre eventos na FlowinPay.

**TODOS OS WEBHOOKS TEM TIMEOUT DE 5 SEGUNDOS.**

## Registrar Webhook

```
POST /api/v1/webhooks
```

### Body

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `url` | string | Sim | URL de destino (HTTPS recomendado) |
| `events` | array | Sim | Eventos desejados |
| `description` | string | Não | Descrição do webhook |

### Eventos Disponíveis

| Evento | Descrição |
|---|---|
| `charge.created` | Cobrança criada |
| `charge.completed` | Cobrança paga |
| `charge.expired` | Cobrança expirada |
| `charge.cancelled` | Cobrança cancelada |
| `charge.refunded` | Cobrança estornada |
| `withdrawal.completed` | Saque processado |
| `withdrawal.failed` | Saque falhou |
| `dispute.opened` | Contestação aberta |
| `dispute.accepted` | Contestação aceita |
| `dispute.rejected` | Contestação rejeitada |
| `dispute.cancelled` | Contestação cancelada |

### Exemplo

```bash
curl -X POST "https://app.flowinpay.com.br/api/v1/webhooks" \
  -H "X-Api-Key: fp_xxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://seusite.com/webhook/flowinpay",
    "events": ["charge.completed", "charge.expired"]
  }'
```

### Response (201)

```json
{
  "message": "Webhook criado com sucesso! Guarde o secret — não será exibido novamente.",
  "webhook": {
    "id": 1,
    "url": "https://seusite.com/webhook/flowinpay",
    "events": ["charge.completed", "charge.expired"],
    "is_active": true,
    "secret": "whsec_xxxxxxxxxxxxxxxxxxxx",
    "created_at": "2026-06-05T15:00:00Z"
  }
}
```

> **Importante:** O `secret` é usado para verificar a assinatura dos webhooks. Guarde-o — não será exibido novamente.

---

## Listar Webhooks

```
GET /api/v1/webhooks
```

### Response (200)

```json
[
  {
    "id": 1,
    "url": "https://seusite.com/webhook/flowinpay",
    "events": ["charge.completed", "charge.expired"],
    "is_active": true,
    "secret_preview": "whsec_xxxxx••••••••",
    "last_triggered_at": "2026-06-05T16:00:00Z",
    "failure_count": 0,
    "created_at": "2026-06-05T15:00:00Z"
  }
]
```

---

## Atualizar Webhook

```
PUT /api/v1/webhooks/{id}
```

| Campo | Tipo | Descrição |
|---|---|---|
| `url` | string | Nova URL de destino |
| `events` | array | Novos eventos |
| `description` | string | Nova descrição |
| `is_active` | boolean | Ativar/desativar |

---

## Remover Webhook

```
DELETE /api/v1/webhooks/{id}
```

### Response (200)

```json
{ "message": "Webhook removido com sucesso" }
```

---

## Regenerar Secret

```
POST /api/v1/webhooks/{id}/regenerate-secret
```

### Response (200)

```json
{
  "message": "Secret regenerado!",
  "webhook": {
    "id": 1,
    "secret": "whsec_novosecretxxxxx"
  }
}
```

---

## Testar Webhook

```
POST /api/v1/webhooks/{id}/test
```

Envia um payload de teste para a URL configurada.

---

## Payload do Webhook

Quando um evento ocorre, a FlowinPay envia um POST para sua URL:

### Headers

| Header | Descrição |
|---|---|
| `event` | Tipo do evento (ex: `charge.completed`) |
| `X-FlowinPay-Event` | Tipo do evento (duplicado) |
| `X-FlowinPay-Signature` | Assinatura HMAC-SHA256 |
| `Content-Type` | `application/json` |

### Payload — charge.created / charge.completed / charge.expired / charge.cancelled

```json
{
  "event": "charge.completed",
  "charge": {
    "id": 42,
    "correlation_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "value": 50.00,
    "fee_value": 2.00,
    "net_value": 48.00,
    "status": "paid",
    "description": "Pedido #123",
    "paid_at": "2026-06-05T14:30:00Z",
    "created_at": "2026-06-05T13:00:00Z"
  },
  "timestamp": "2026-06-05T14:30:00Z"
}
```

### Response esperada

Retorne HTTP **200** com JSON vazio `{}`.

---

## Verificar Assinatura

Use o `secret` do webhook para verificar que o payload é legítimo:

### PHP

```php
$secret = 'whsec_xxxxxxxxxxxx';
$signature = $_SERVER['HTTP_X_FLOWINPAY_SIGNATURE'] ?? '';
$payload = file_get_contents('php://input');
$expected = hash_hmac('sha256', $payload, $secret);

if (!hash_equals($expected, $signature)) {
    http_response_code(401);
    exit('Assinatura inválida');
}

// Processar evento
$data = json_decode($payload, true);
```

### Node.js

```javascript
const crypto = require('crypto');

app.post('/webhook/flowinpay', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-flowinpay-signature'];
  const expected = crypto.createHmac('sha256', secret).update(req.body).digest('hex');

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return res.status(401).send('Invalid');
  }

  const event = JSON.parse(req.body);
  // Processar evento

  res.json({});
});
```

---

## Retry

Em caso de falha (timeout ou status != 2xx), a FlowinPay reenvia:

| Tentativa | Intervalo |
|---|---|
| 1ª | Imediato |
| 2ª | 5 segundos |
| 3ª | 30 segundos |
| 4ª | 2 minutos |
| 5ª | 15 minutos |

Após 5 tentativas, o webhook é marcado como falho.

---

## Webhook Automático via callbackUrl

Ao criar uma cobrança via API com `callbackUrl`, a FlowinPay cria automaticamente um webhook na sua conta. Não é necessário criar webhook manualmente — basta passar a URL no momento da cobrança.

```bash
curl -X POST "https://app.flowinpay.com.br/api/v1/charges" \
  -H "X-Api-Key: fp_xxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "value": 50.00,
    "acquirer_id": 1,
    "callbackUrl": "https://seusite.com/webhook/flowinpay"
  }'
```

O webhook será criado com todos os eventos ativos e aparecerá na aba **Integração → Webhooks** do painel.
