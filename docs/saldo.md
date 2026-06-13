# Saldo e Resumo Financeiro

## Consultar Saldo

```
GET /api/v1/balance
```

### Response (200)

```json
{
  "balance": {
    "available": 1250.75,
    "blocked": 100.00,
    "total": 1350.75
  }
}
```

### Campos

| Campo | Tipo | Descrição |
|---|---|---|
| `available` | number | Saldo disponível para saque |
| `blocked` | number | Saldo bloqueado (saques pendentes) |
| `total` | number | Total (available + blocked) |

### Exemplo

```bash
curl -X GET "https://app.flowinpay.com/api/v1/balance" \
  -H "X-Api-Key: fpk_xxxx" \
  -H "Accept: application/json"
```

---

## Resumo Financeiro

```
GET /api/v1/summary
```

### Response (200)

```json
{
  "summary": {
    "today": {
      "income": 1500.00,
      "expenses": 200.00,
      "fees": 45.00,
      "count": 12
    },
    "week": {
      "income": 8500.00,
      "expenses": 1200.00,
      "fees": 210.00,
      "count": 65
    },
    "month": {
      "income": 32000.00,
      "expenses": 5000.00,
      "fees": 850.00,
      "count": 240
    },
    "counts": {
      "charges": 240,
      "withdrawals": 5,
      "disputes": 2
    }
  }
}
```

### Exemplo

```bash
curl -X GET "https://app.flowinpay.com/api/v1/summary" \
  -H "X-Api-Key: fpk_xxxx" \
  -H "Accept: application/json"
```
