# Saques (CashOut)

Endpoints para solicitar e consultar saques via PIX.

## Solicitar Saque

```
POST /api/v1/withdrawals
```

### Body

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `value` | number | Sim | Valor em reais (mín: R$10) |
| `pix_key` | string | Sim | Chave PIX de destino |
| `pix_key_type` | string | Sim | Tipo: `cpf`, `cnpj`, `email`, `phone`, `random` |
| `description` | string | Não | Descrição do saque |

### Exemplo

```bash
curl -X POST "https://app.flowinpay.com/api/v1/withdrawals" \
  -H "Authorization: Bearer fp_xxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "value": 100.00,
    "pix_key": "12345678901",
    "pix_key_type": "cpf",
    "description": "Saque mensal"
  }'
```

### Response (201)

```json
{
  "message": "Saque solicitado com sucesso",
  "withdrawal": {
    "id": 15,
    "value": "100.00",
    "fee_value": "2.00",
    "net_value": "98.00",
    "pix_key": "12345678901",
    "pix_key_type": "cpf",
    "status": "pending",
    "description": "Saque mensal",
    "created_at": "2026-06-05T15:00:00.000000Z"
  }
}
```

### Taxas

| Configuração | Valor |
|---|---|
| Taxa fixa | R$2,00 por saque |
| Valor mínimo | R$10,00 |
| Processamento | Até 1 hora útil |

---

## Listar Saques

```
GET /api/v1/withdrawals
```

### Response (200)

```json
[
  {
    "id": 15,
    "value": "100.00",
    "fee_value": "2.00",
    "net_value": "98.00",
    "pix_key": "12345678901",
    "pix_key_type": "cpf",
    "status": "completed",
    "processed_at": "2026-06-05T15:30:00.000000Z",
    "created_at": "2026-06-05T15:00:00.000000Z"
  }
]
```

---

## Status dos Saques

| Status | Descrição |
|---|---|
| `pending` | Aguardando processamento |
| `processing` | Em processamento na adquirente |
| `completed` | Saque concluído |
| `failed` | Falha no processamento |
| `cancelled` | Cancelado pelo usuário |

> **Importante:** Saques só podem ser cancelados enquanto estiverem com status `pending`.

---

## Cancelar Saque

```
POST /api/v1/withdrawals/{id}/cancel
```

### Response (200)

```json
{
  "message": "Saque cancelado",
  "withdrawal": {
    "id": 15,
    "status": "cancelled"
  }
}
```

---

## Erros Comuns

| Status | Erro | Solução |
|---|---|---|
| 422 | Saldo insuficiente | Verifique o saldo antes de solicitar |
| 422 | Valor mínimo R$10 | Aumente o valor do saque |
| 422 | Chave PIX inválida | Verifique o tipo e formato da chave |
| 429 | Rate limit (5/min) | Aguarde antes de tentar novamente |
