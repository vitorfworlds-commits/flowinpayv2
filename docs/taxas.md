# Taxas

## Consultar Taxas Ativas

```
GET /api/v1/fees/current
```

Endpoint público — não requer autenticação.

### Response (200)

```json
{
  "fees": {
    "percentual": "2.00",
    "fixed_value": "1.00",
    "withdrawal_fee": "2.00",
    "minimum_charge": "2.00",
    "maximum_charge": "150.00",
    "minimum_withdrawal": "10.00",
    "maximum_withdrawal": "1000.00"
  }
}
```

### Campos

| Campo | Tipo | Descrição |
|---|---|---|
| `percentual` | string | Taxa percentual sobre cobranças (%) |
| `fixed_value` | string | Taxa fixa por cobrança (R$) |
| `withdrawal_fee` | string | Taxa fixa por saque (R$) |
| `minimum_charge` | string | Valor mínimo de cobrança (R$) |
| `maximum_charge` | string | Valor máximo de cobrança (R$) |
| `minimum_withdrawal` | string | Valor mínimo de saque (R$) |
| `maximum_withdrawal` | string | Valor máximo de saque (R$) |

### Exemplo

```bash
curl -X GET "https://app.flowinpay.com.br/api/v1/fees/current" \
  -H "Accept: application/json"
```
