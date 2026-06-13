# Exemplos com cURL

## Configuração

```bash
# Variáveis de ambiente
API_URL="https://app.flowinpay.com/api"
API_KEY="fpk_xxxxxxxxxxxxxxxx"
```

---

## Autenticação

### Login

```bash
curl -X POST "$API_URL/login" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "email": "seu@email.com",
    "password": "suasenha"
  }'
```

### Consultar Perfil

```bash
curl -X GET "$API_URL/me" \
  -H "X-Api-Key: $API_KEY" \
  -H "Accept: application/json"
```

---

## Cobranças

### Criar Cobrança

```bash
curl -X POST "$API_URL/v1/charges" \
  -H "X-Api-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "value": 50.00,
    "description": "Plano Premium - Mensal",
    "acquirer_id": 1,
    "callbackUrl": "https://seusite.com/webhook/flowinpay"
  }'
```

### Criar com Dados do Cliente

```bash
curl -X POST "$API_URL/v1/charges" \
  -H "X-Api-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "value": 100.00,
    "description": "Pedido #1234",
    "acquirer_id": 1,
    "customer_name": "João Silva",
    "customer_email": "joao@email.com",
    "customer_tax_id": "12345678901"
  }'
```

### Listar Cobranças

```bash
curl -X GET "$API_URL/v1/charges" \
  -H "X-Api-Key: $API_KEY" \
  -H "Accept: application/json"
```

### Listar com Filtro

```bash
curl -X GET "$API_URL/v1/charges?status=active&page=1" \
  -H "X-Api-Key: $API_KEY" \
  -H "Accept: application/json"
```

### Consultar Cobrança

```bash
curl -X GET "$API_URL/v1/charges/42" \
  -H "X-Api-Key: $API_KEY" \
  -H "Accept: application/json"
```

### Cancelar Cobrança

```bash
curl -X POST "$API_URL/v1/charges/42/cancel" \
  -H "X-Api-Key: $API_KEY" \
  -H "Accept: application/json"
```

---

## Saldo

### Consultar Saldo

```bash
curl -X GET "$API_URL/v1/balance" \
  -H "X-Api-Key: $API_KEY" \
  -H "Accept: application/json"
```

### Resumo Financeiro

```bash
curl -X GET "$API_URL/v1/summary" \
  -H "X-Api-Key: $API_KEY" \
  -H "Accept: application/json"
```

---

## Transações

### Listar Transações

```bash
curl -X GET "$API_URL/v1/transactions" \
  -H "X-Api-Key: $API_KEY" \
  -H "Accept: application/json"
```

### Filtrar por Tipo e Data

```bash
curl -X GET "$API_URL/v1/transactions?type=charge_received&start_date=2026-06-01&end_date=2026-06-30" \
  -H "X-Api-Key: $API_KEY" \
  -H "Accept: application/json"
```

---

## Saques

### Solicitar Saque

```bash
curl -X POST "$API_URL/v1/withdrawals" \
  -H "X-Api-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "value": 100.00,
    "pix_key": "12345678901",
    "pix_key_type": "cpf",
    "description": "Saque mensal"
  }'
```

### Listar Saques

```bash
curl -X GET "$API_URL/v1/withdrawals" \
  -H "X-Api-Key: $API_KEY" \
  -H "Accept: application/json"
```

---

## Webhooks

### Registrar Webhook

```bash
curl -X POST "$API_URL/webhooks" \
  -H "X-Api-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "url": "https://meusite.com/webhook/flowinpay",
    "events": ["charge.completed", "charge.expired"],
    "description": "Notificações de pagamento"
  }'
```

### Listar Webhooks

```bash
curl -X GET "$API_URL/webhooks" \
  -H "X-Api-Key: $API_KEY" \
  -H "Accept: application/json"
```

### Testar Webhook

```bash
curl -X POST "$API_URL/webhooks/1/test" \
  -H "X-Api-Key: $API_KEY" \
  -H "Accept: application/json"
```

---

## Health Check

```bash
curl -X GET "$API_URL/health" \
  -H "Accept: application/json"
```

---

## Verificar Assinatura do Webhook (Bash)

```bash
SECRET="whsec_xxxxxxxxxxxxxxxxxxxx"
PAYLOAD='{"event":"charge.completed","charge":{"id":42}}'
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$SECRET" | cut -d' ' -f2)

echo "Assinatura: $SIGNATURE"
```
