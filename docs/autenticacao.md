# Autenticação

A API FlowinPay utiliza **API Keys** para autenticação. Todas as requisições autenticadas devem incluir o header `Authorization` com o token.

## Gerar API Key

1. Acesse o painel em `https://app.flowinpay.com/api-keys`
2. Clique em **Nova API Key**
3. Defina um nome e as permissões desejadas
4. Copie a chave gerada (formato: `fp_xxxxxxxxxxxxxxxx`)

> **Atenção:** A chave completa só é exibida uma vez. Guarde em local seguro.

## Como Usar

Inclua a API Key no header de todas as requisições:

```
Authorization: Bearer fp_xxxxxxxxxxxxxxxx
```

### Exemplo

```bash
curl -X GET "https://app.flowinpay.com/api/v1/balance" \
  -H "Authorization: Bearer fp_xxxxxxxxxxxxxxxx" \
  -H "Accept: application/json"
```

## Permissões

As API Keys podem ter permissões específicas:

| Permissão | Descrição |
|---|---|
| `charges:read` | Consultar cobranças |
| `charges:write` | Criar/cancelar cobranças |
| `withdrawals:read` | Consultar saques |
| `withdrawals:write` | Solicitar saques |
| `balance:read` | Consultar saldo |
| `webhooks:read` | Consultar webhooks |
| `webhooks:write` | Criar/atualizar webhooks |
| `*` | Acesso total |

## Autenticação por Token (Painel)

Para o painel administrativo, a autenticação é feita via **Bearer Token** gerado pelo login:

```bash
curl -X POST "https://app.flowinpay.com/api/login" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"email":"usuario@email.com","password":"senha123"}'
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "name": "João Silva",
    "email": "usuario@email.com"
  },
  "token": "1|abc123def456..."
}
```

Use o token retornado no header `Authorization: Bearer 1|abc123def456...`

## Erros de Autenticação

| Status | Descrição |
|---|---|
| `401` | Token ausente, inválido ou expirado |
| `403` | Token válido, mas sem permissão para o recurso |
| `429` | Rate limit excedido |
