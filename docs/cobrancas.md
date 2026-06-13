# Cobranças (PIX)

## Criar Cobrança

Permite requisição de pagamento PIX. Após o processamento, webhooks serão enviados para a `callbackUrl` fornecida.

```
POST /api/v1/charges
```

### Headers

| Header | Valor |
|---|---|
| `X-Api-Key` | `fp_xxxx` |
| `Content-Type` | `application/json` |
| `Accept` | `application/json` |

### Body

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `value` | number | Sim | Valor em reais (mín: R$2, máx: R$150) |
| `acquirer_id` | integer | Sim | ID da adquirente (use 1) |
| `description` | string | Não | Descrição da cobrança |
| `callbackUrl` | string | Não | URL para receber webhooks (cria webhook automaticamente) |
| `webhook_url` | string | Não | Alias para `callbackUrl` |
| `customer_name` | string | Não | Nome do pagador |
| `customer_email` | string | Não | Email do pagador |
| `customer_tax_id` | string | Não | CPF/CNPJ do pagador |
| `customer_phone` | string | Não | Telefone do pagador |

### Exemplo

```bash
curl -X POST "https://app.flowinpay.com.br/api/v1/charges" \
  -H "X-Api-Key: fp_xxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "value": 50.00,
    "description": "Pedido #123",
    "acquirer_id": 1,
    "callbackUrl": "https://seusite.com/webhook/flowinpay",
    "customer": {
      "name": "João Silva",
      "email": "joao@email.com"
    }
  }'
```

### Response (200)

```json
{
  "message": "Cashin request successfully submitted",
  "charge": {
    "id": 42,
    "correlation_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "value": "50.00",
    "fee_value": "2.00",
    "status": "active",
    "br_code": "00020101021226580014br.gov.bcb.pix...",
    "payment_link_url": "https://app.flowinpay.com.br/pay/a1b2c3d4...",
    "expires_at": "2026-06-06T13:00:00Z"
  }
}
```

### Campos Importantes

| Campo | Descrição |
|---|---|
| `br_code` | PIX copia e cola — exiba para o pagador |
| `payment_link_url` | Link de pagamento — compartilhe com o pagador |
| `qr_code_image` | URL da imagem do QR Code |
| `expires_at` | Expiração (geralmente 24h) |

---

## Listar Cobranças

```
GET /api/v1/charges
```

### Query Parameters

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `status` | string | Filtrar por status |
| `page` | integer | Página (padrão: 1) |

### Response (200)

```json
{
  "current_page": 1,
  "data": [
    {
      "id": 42,
      "correlation_id": "a1b2c3d4...",
      "value": "50.00",
      "status": "paid",
      "description": "Pedido #123",
      "paid_at": "2026-06-05T14:30:00Z",
      "created_at": "2026-06-05T13:00:00Z"
    }
  ],
  "last_page": 1,
  "total": 1
}
```

---

## Consultar Cobrança

```
GET /api/v1/charges/{id}
```

### Response (200)

```json
{
  "charge": {
    "id": 42,
    "correlation_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "value": "50.00",
    "fee_value": "2.00",
    "fee_percent": "2.00",
    "status": "paid",
    "br_code": "00020101021226580014br.gov.bcb.pix...",
    "payment_link_url": "https://app.flowinpay.com.br/pay/a1b2c3d4...",
    "description": "Pedido #123",
    "customer_name": "João Silva",
    "paid_at": "2026-06-05T14:30:00Z",
    "expires_at": "2026-06-06T13:00:00Z",
    "created_at": "2026-06-05T13:00:00Z",
    "acquirer": {
      "name": "Woovi",
      "slug": "openpix"
    }
  }
}
```

---

## Cancelar Cobrança

```
POST /api/v1/charges/{id}/cancel
```

### Response (200)

```json
{
  "message": "Cobrança cancelada com sucesso",
  "charge": {
    "id": 42,
    "status": "cancelled"
  }
}
```

> Apenas cobranças com status `active` podem ser canceladas.

---

## Status das Cobranças

| Status | Descrição |
|---|---|
| `pending` | Aguardando processamento |
| `active` | PIX gerado, aguardando pagamento |
| `paid` | Pagamento confirmado |
| `cancelled` | Cancelada pelo usuário |
| `expired` | Expirada (após 24h) |

---

## Fluxo de Pagamento

1. **Crie a cobrança** → Receba `br_code` e `payment_link_url`
2. **Envie o link** → Compartilhe `payment_link_url` com o pagador
3. **Aguarde confirmação** → Use webhooks para receber notificação
4. **Consulte se necessário** → Use `GET /api/v1/charges/{id}`

### Webhook Automático (callbackUrl)

Ao criar uma cobrança, passe `callbackUrl` no body — a FlowinPay criará automaticamente um webhook na sua conta apontando para essa URL. Quando o pagamento for confirmado (ou expirar/cancelar), enviaremos um POST para a URL.

> **Importante:** Se a mesma `callbackUrl` for usada em múltiplas cobranças, apenas **um webhook** será criado (sem duplicatas). O webhook aparece na aba **Integração → Webhooks** do painel.
