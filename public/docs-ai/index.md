# FlowinPay API Documentation

## Base URL
```
https://app.flowinpay.com.br/api/v1
```

## Authentication
All API endpoints require the `X-Api-Key` header with your API key.
```
X-Api-Key: fp_SUA_CHAVE
```

### API Key Permissions
| Permission | Description |
|---|---|
| charge:create | Create charges |
| charge:read | Read charges |
| charge:cancel | Cancel charges |
| withdrawals:write | Request withdrawals |
| balance:read | Check balance |
| webhooks:write | Create webhooks |
| webhooks:read | List webhooks |

## Endpoints

### Charges (PIX)

**POST /api/v1/charges** — Create a PIX charge

| Field | Type | Required | Description |
|---|---|---|---|
| value | number | yes | Amount in reais (R$2 to R$150) |
| acquirer_id | integer | yes | Acquirer ID (use 1 for Woovi) |
| description | string | no | Charge description |
| webhook_url | string | no | Auto-creates webhook on first use |
| customer_name | string | no | Payer name |
| customer_email | string | no | Payer email |
| customer_tax_id | string | no | Payer CPF/CNPJ |

Response:
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

**GET /api/v1/charges** — List charges

**GET /api/v1/charges/{id}** — Get charge by ID

**POST /api/v1/charges/{id}/cancel** — Cancel a charge

### Charge Status
| Status | Description |
|---|---|
| active | Waiting for payment |
| paid | Paid |
| cancelled | Cancelled |
| expired | Expired |

### Balance

**GET /api/v1/balance** — Check balance

Response:
```json
{
  "balance": {
    "available": 1250.75,
    "blocked": 100.00,
    "total": 1350.75
  }
}
```

**GET /api/v1/summary** — Financial summary (today, week, month, counts, conversion_rate)

### Withdrawals

**POST /api/v1/withdrawals** — Request withdrawal

| Field | Type | Required | Description |
|---|---|---|---|
| value | number | yes | Amount in reais (min: R$10) |
| pix_key | string | yes | PIX destination key |
| pix_key_type | string | yes | cpf, cnpj, email, phone, random |

**GET /api/v1/withdrawals** — List withdrawals

### Transactions

**GET /api/v1/transactions** — Transaction history

| Field | Type | Required | Description |
|---|---|---|---|
| type | string | no | charge_received, withdrawal, refund... |
| start_date | date | no | YYYY-MM-DD |
| end_date | date | no | YYYY-MM-DD |

**GET /api/v1/transactions/{id}** — Transaction detail

### Webhooks

**POST /api/v1/webhooks** — Register webhook

**GET /api/v1/webhooks** — List webhooks

**DELETE /api/v1/webhooks/{id}** — Delete webhook

**POST /api/v1/webhooks/{id}/test** — Test webhook

**POST /api/v1/webhooks/{id}/regenerate-secret** — Regenerate webhook secret

### Webhook Events
| Event | Description |
|---|---|
| charge.created | Charge created |
| charge.completed | Charge paid |
| charge.expired | Charge expired |
| charge.cancelled | Charge cancelled |
| withdrawal.completed | Withdrawal processed |
| withdrawal.failed | Withdrawal failed |
| dispute.opened | Dispute opened |
| dispute.accepted | Dispute accepted |
| dispute.rejected | Dispute rejected |
| dispute.cancelled | Dispute cancelled |

### Webhook Payload
```json
{
  "event": "charge.completed",
  "charge": {
    "id": 42,
    "correlation_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "value": 50.00,
    "status": "paid",
    "paid_at": "2026-06-05T14:30:00Z"
  },
  "timestamp": "2026-06-05T14:30:00Z"
}
```

### Webhook Signature Verification
HMAC-SHA256 with shared secret.
Header: `X-FlowinPay-Signature`

```
expected = HMAC-SHA256(body, "whsec_seu_secret")
if signature != expected → 401 Unauthorized
```

### Webhook Retry
On failure: immediate → 5s → 30s → 2min → 15min (5 attempts)

### Fee Configuration (Admin)

**GET /api/v1/fees/current** — Get active fee config

**GET /api/v1/fees** — List all fee configs (admin)

**POST /api/v1/fees** — Create fee config (admin)

**PUT /api/v1/fees/{id}** — Update fee config (admin)

### Acquirers

**GET /api/v1/acquirers** — List acquirers

**GET /api/v1/acquirers/{id}/stats** — Acquirer stats

### Disputes

**GET /api/v1/disputes** — List disputes

**GET /api/v1/disputes/stats** — Dispute stats

**GET /api/v1/disputes/{id}** — Dispute detail

**POST /api/v1/disputes/{id}/defend** — Submit defense

### API Keys

**GET /api/v1/api-keys** — List API keys

**POST /api/v1/api-keys** — Create API key

**DELETE /api/v1/api-keys/{id}** — Delete API key

**POST /api/v1/api-keys/{id}/regenerate** — Regenerate key

### Health

**GET /health** — System health check

## Errors

| Code | Description |
|---|---|
| 200 | Success |
| 201 | Created |
| 401 | Unauthorized (invalid API key) |
| 403 | Forbidden (admin only) |
| 404 | Not found |
| 422 | Validation error |
| 429 | Rate limit exceeded |
| 500 | Internal server error |

## Rate Limits

| Endpoint | Limit |
|---|---|
| POST /charges | 30/min |
| POST /withdrawals | 60/min |
| POST /webhook/{acquirer} | 100/min |
| Default (authenticated) | 120/min |
| Login/register | 10/min |
