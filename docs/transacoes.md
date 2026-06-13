# Transações (Extrato)

## Listar Transações

```
GET /api/v1/transactions
```

### Query Parameters

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `type` | string | Filtrar por tipo: `charge_received`, `charge_fee`, `withdrawal`, `withdrawal_fee`, `refund`, `adjustment` |
| `start_date` | date | Data inicial (YYYY-MM-DD) |
| `end_date` | date | Data final (YYYY-MM-DD) |
| `min_amount` | number | Valor mínimo |
| `max_amount` | number | Valor máximo |
| `search` | string | Buscar por descrição |
| `page` | integer | Página |

### Response (200)

```json
{
  "current_page": 1,
  "data": [
    {
      "id": 150,
      "type": "charge_received",
      "amount": "48.00",
      "balance_before": "1000.00",
      "balance_after": "1048.00",
      "description": "Pagamento cobrança #42",
      "reference_type": "App\\Models\\Charge",
      "reference_id": 42,
      "created_at": "2026-06-05T14:30:00.000000Z"
    }
  ],
  "last_page": 1,
  "total": 1
}
```

### Tipos de Transação

| Tipo | Descrição | Sinal |
|---|---|---|
| `charge_received` | Recebimento de cobrança | + |
| `charge_fee` | Taxa da cobrança | - |
| `withdrawal` | Saque | - |
| `withdrawal_fee` | Taxa do saque | - |
| `refund` | Estorno | + |
| `adjustment` | Ajuste manual | +/- |

### Exemplo

```bash
curl -X GET "https://app.flowinpay.com.br/api/v1/transactions?type=charge_received&start_date=2026-06-01" \
  -H "X-Api-Key: fpk_xxxx" \
  -H "Accept: application/json"
```

---

## Consultar Transação

```
GET /api/v1/transactions/{id}
```

### Response (200)

```json
{
  "transaction": {
    "id": 150,
    "type": "charge_received",
    "amount": "48.00",
    "balance_before": "1000.00",
    "balance_after": "1048.00",
    "description": "Pagamento cobrança #42",
    "reference_type": "App\\Models\\Charge",
    "reference_id": 42,
    "created_at": "2026-06-05T14:30:00.000000Z"
  }
}
```
