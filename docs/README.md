# FlowinPay - Documentação da API

## API Docs
- [Autenticação](./autenticacao.md): Gere sua API Key e autentique suas requisições.
- [Saldo](./saldo.md): Consulta o saldo disponível e bloqueado.
- [Transações](./transacoes.md): Consulta o extrato de transações.
- [Cobranças (PIX)](./cobrancas.md): Crie cobranças PIX e receba pagamentos. Após o processamento, webhooks serão enviados para a callbackUrl fornecida.
- [Saques](./saques.md): Solicitação de saque via PIX. Autenticação obrigatória.
- [Webhooks](./webhooks.md): Como configurar e receber notificações de eventos.
- [Guia Webhooks](./webhook-guide.md): Passo-a-passo para receber webhooks (PHP, Node.js, Python, Java, Go, C#, Ruby).
- [Erros](./erros.md): Códigos de erro e como resolver.

## Exemplos
- [cURL](./exemplos/curl.md)
- [PHP](./exemplos/php.md)
- [Node.js](./exemplos/nodejs.md)

## Visão Geral

| Informação | Valor |
|---|---|
| Base URL | `https://app.flowinpay.com.br/api/v1` |
| Formato | JSON |
| Autenticação | API Key via header `X-Api-Key` |
| Timeout Webhooks | 5 segundos |
| Rate Limit | 120 req/min (padrão), 30/min (cobranças), 5/min (saques) |

## Endpoints

### Autenticação
| Método | Endpoint | Descrição |
|---|---|---|
| POST | `/api/register` | Registrar novo usuário |
| POST | `/api/login` | Login do painel (retorna Bearer Token) |
| GET | `/api/me` | Dados do usuário autenticado |
| POST | `/api/logout` | Revogar token atual |

### Cobranças (PIX)
| Método | Endpoint | Descrição |
|---|---|---|
| POST | `/api/v1/charges` | Criar cobrança PIX. Aceita `callbackUrl` para webhook automático. |
| GET | `/api/v1/charges` | Listar cobranças |
| GET | `/api/v1/charges/{id}` | Consultar cobrança |
| POST | `/api/v1/charges/{id}/cancel` | Cancelar cobrança |

### Saques
| Método | Endpoint | Descrição |
|---|---|---|
| POST | `/api/v1/withdrawals` | Solicitar saque PIX |
| GET | `/api/v1/withdrawals` | Listar saques |

### Financeiro
| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/api/v1/balance` | Consultar saldo disponível |
| GET | `/api/v1/summary` | Resumo financeiro (hoje/semana/mês) |
| GET | `/api/v1/transactions` | Extrato de transações |
| GET | `/api/v1/transactions/{id}` | Detalhar transação |

### Webhooks
| Método | Endpoint | Descrição |
|---|---|---|
| POST | `/api/v1/webhooks` | Registrar webhook |
| GET | `/api/v1/webhooks` | Listar webhooks |
| PUT | `/api/v1/webhooks/{id}` | Atualizar webhook |
| DELETE | `/api/v1/webhooks/{id}` | Remover webhook |
| POST | `/api/v1/webhooks/{id}/test` | Testar webhook |

### Integração
| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/api/v1/fees/current` | Configuração de taxas |
| GET | `/api/health` | Status da API (público) |

## Eventos de Webhook

| Evento | Descrição |
|---|---|
| `charge.created` | Nova cobrança criada |
| `charge.completed` | Cobrança paga |
| `charge.expired` | Cobrança expirada |
| `charge.cancelled` | Cobrança cancelada |
| `charge.refunded` | Cobrança estornada |
| `withdrawal.completed` | Saque processado |
| `withdrawal.failed` | Saque falhou |
| `dispute.opened` | Contestação aberta |
| `dispute.accepted` | Contestação aceita |
| `dispute.rejected` | Contestação rejeitada |
| `dispute.cancelled` | Contestação cancelada |
