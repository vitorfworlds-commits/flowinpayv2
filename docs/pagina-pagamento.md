# Página Pública de Pagamento

## Visão Geral

Ao criar uma cobrança, a FlowinPay gera um `payment_link_url` que pode ser compartilhado diretamente com o pagador. Essa página pública exibe o QR Code e o PIX copia-e-cola para pagamento.

```
GET /pay/{correlationId}
```

> Essa é uma página HTML/SPA — não uma rota de API. O integrador apenas compartilha o link.

## Fluxo

1. **Integrador cria cobrança** via `POST /api/v1/charges`
2. **Recebe `payment_link_url`** no response
3. **Compartilha o link** com o pagador (WhatsApp, email, botão de pagamento, etc.)
4. **Pagador acessa o link** → vê QR Code + PIX copia-e-cola + countdown de expiração
5. **Pagador paga** → webhook `charge.completed` é disparado automaticamente

## O que o pagador vê

- Valor da cobrança
- QR Code do PIX
- Código PIX copia-e-cola (`br_code`)
- Countdown de expiração (24h)
- Status do pagamento (aguardando → confirmado)

## Endpoint Público da API

A página consulta o status da cobrança via endpoint público (sem autenticação):

```
GET /api/public/charge/{correlationId}
```

### Response (200)

```json
{
  "charge": {
    "id": 42,
    "correlation_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "value": "50.00",
    "status": "active",
    "br_code": "00020101021226580014br.gov.bcb.pix...",
    "qr_code_image": "https://app.flowinpay.com.br/storage/qr/abc123.png",
    "expires_at": "2026-06-06T13:00:00Z"
  }
}
```

> **Rate limit:** 30 requisições por minuto por IP.

### Campos retornados (públicos)

| Campo | Descrição |
|---|---|
| `value` | Valor da cobrança |
| `status` | Status atual (`active`, `paid`, `expired`) |
| `br_code` | PIX copia-e-cola |
| `qr_code_image` | URL da imagem do QR Code |
| `expires_at` | Data de expiração |

> **Nota:** Dados sensíveis (customer, API key, etc.) não são expostos neste endpoint.
