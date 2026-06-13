# Autenticação

A API FlowinPay utiliza uma **App ID** (API Key) para autenticação. Todas as requisições à API REST (`/api/v1/...`) devem incluir o header **`X-Api-Key`**.

## Gerar a App ID

1. Acesse o painel em `https://app.flowinpay.com/api-keys`
2. Clique em **Nova chave**
3. Defina um nome e as permissões desejadas
4. Copie a **App ID** gerada (formato: `fpk_xxxxxxxxxxxxxxxx`)

> **Atenção:** A App ID completa só é exibida uma vez. Guarde em local seguro.

## Como Usar

Inclua a App ID no header `X-Api-Key` em todas as requisições:

```
X-Api-Key: fpk_xxxxxxxxxxxxxxxx
```

### Exemplo

```bash
curl -X GET "https://app.flowinpay.com/api/v1/balance" \
  -H "X-Api-Key: fpk_xxxxxxxxxxxxxxxx" \
  -H "Accept: application/json"
```

## Permissões

A App ID pode ter escopos específicos:

| Permissão | Descrição |
|---|---|
| `charge:read` | Consultar cobranças |
| `charge:create` | Criar cobranças |
| `charge:cancel` | Cancelar cobranças |
| `withdrawal:read` | Consultar saques |
| `withdrawal:create` | Solicitar saques |
| `balance:read` | Consultar saldo, extrato e resumo |
| `*` | Acesso total |

## Restrição por IP

Opcionalmente, a App ID pode ser restrita a uma lista de IPs autorizados. Requisições de outros IPs recebem `403`.

## Autenticação do Painel (login)

O painel administrativo usa um **Bearer Token** gerado no login — **diferente** da App ID da API:

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

Use o token retornado no header `Authorization: Bearer 1|abc123def456...` — **apenas** para as rotas do painel. As rotas `/api/v1/*` continuam usando `X-Api-Key`.

## Erros de Autenticação

| Status | Descrição |
|---|---|
| `401` | App ID ausente, inválida ou revogada |
| `403` | App ID válida, mas sem permissão para o recurso (ou IP não autorizado) |
| `429` | Rate limit excedido |
