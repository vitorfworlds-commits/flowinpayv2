# Exemplos com Node.js

## Configuração

```javascript
// flowinpay.js
const BASE_URL = 'https://app.flowinpay.com.br/api';
const API_KEY = 'fp_xxxxxxxxxxxxxxxx';

async function request(method, path, body = null) {
  const options = {
    method,
    headers: {
      'X-Api-Key': API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${path}`, options);
  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.message || 'Erro na API');
    error.status = response.status;
    error.errors = data.errors;
    throw error;
  }

  return data;
}

module.exports = {
  // Cobranças
  createCharge: (data) => request('POST', '/v1/charges', data),
  getCharge: (id) => request('GET', `/v1/charges/${id}`),
  listCharges: (page = 1) => request('GET', `/v1/charges?page=${page}`),
  cancelCharge: (id) => request('POST', `/v1/charges/${id}/cancel`),

  // Saldo
  getBalance: () => request('GET', '/v1/balance'),
  getSummary: () => request('GET', '/v1/summary'),

  // Transações
  listTransactions: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request('GET', `/v1/transactions?${query}`);
  },

  // Saques
  createWithdrawal: (data) => request('POST', '/v1/withdrawals', data),
  listWithdrawals: () => request('GET', '/v1/withdrawals'),

  // Webhooks
  createWebhook: (data) => request('POST', '/webhooks', data),
  listWebhooks: () => request('GET', '/webhooks'),
  testWebhook: (id) => request('POST', `/webhooks/${id}/test`),
};
```

---

## Uso Básico

```javascript
const flowinpay = require('./flowinpay');

async function main() {
  // Criar cobrança
  const result = await flowinpay.createCharge({
    value: 50.00,
    description: 'Plano Premium',
    acquirer_id: 1,
  });

  const charge = result.charge;

  console.log('Link:', charge.payment_link_url);
  console.log('PIX:', charge.br_code);
  console.log('Status:', charge.status);
}

main().catch(console.error);
```

---

## Exemplo: Servidor Express.js

```javascript
const express = require('express');
const crypto = require('crypto');
const flowinpay = require('./flowinpay');

const app = express();
app.use(express.json());

// ========== ROTA: Criar pagamento ==========
app.post('/api/checkout', async (req, res) => {
  try {
    const { items, customerEmail, customerName } = req.body;

    // Calcular total
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Criar cobrança na FlowinPay
    const result = await flowinpay.createCharge({
      value: total,
      description: `Pedido #${Date.now()}`,
      acquirer_id: 1,
      customer_name: customerName,
      customer_email: customerEmail,
    });

    const charge = result.charge;

    // Salvar pedido no banco
    // await db.orders.create({ paymentId: charge.correlation_id, ... });

    // Retornar link de pagamento
    res.json({
      payment_url: charge.payment_link_url,
      pix_code: charge.br_code,
      expires_at: charge.expires_at,
    });
  } catch (error) {
    console.error('Erro ao criar cobrança:', error.message);
    res.status(error.status || 500).json({ error: error.message });
  }
});

// ========== ROTA: Webhook FlowinPay ==========
app.post('/webhook/flowinpay', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const secret = process.env.FLOWINPAY_WEBHOOK_SECRET;

  // Verificar assinatura
  const payload = JSON.stringify(req.body);
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    console.warn('Assinatura inválida');
    return res.status(401).json({ message: 'Invalid signature' });
  }

  const { event, charge } = req.body;

  console.log(`Evento: ${event}`, charge);

  switch (event) {
    case 'charge.completed':
      // Pagamento confirmado — liberar acesso
      handlePaymentConfirmed(charge);
      break;

    case 'charge.expired':
      // Cobrança expirada — cancelar pedido
      handlePaymentExpired(charge);
      break;

    case 'charge.cancelled':
      // Cobrança cancelada
      handlePaymentCancelled(charge);
      break;

    default:
      console.log(`Evento não tratado: ${event}`);
  }

  res.json({ message: 'OK' });
});

// ========== ROTA: Verificar status ==========
app.get('/api/payment/:correlationId', async (req, res) => {
  try {
    const result = await flowinpay.getCharge(req.params.correlationId);
    res.json(result.charge);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

function handlePaymentConfirmed(charge) {
  console.log(`Pagamento confirmado: ${charge.correlation_id}`);
  // Liberar acesso, enviar produto, etc.
}

function handlePaymentExpired(charge) {
  console.log(`Cobrança expirada: ${charge.correlation_id}`);
}

function handlePaymentCancelled(charge) {
  console.log(`Cobrança cancelada: ${charge.correlation_id}`);
}

app.listen(3000, () => {
  console.log('Servidor rodando na porta 3000');
});
```

---

## Exemplo: TypeScript

```typescript
interface Charge {
  id: number;
  correlation_id: string;
  value: string;
  fee_value: string;
  status: 'pending' | 'active' | 'paid' | 'cancelled' | 'expired';
  br_code: string | null;
  payment_link_url: string | null;
  description: string | null;
  created_at: string;
  paid_at: string | null;
  expires_at: string | null;
}

interface Balance {
  available: number;
  blocked: number;
  total: number;
}

interface CreateChargeRequest {
  value: number;
  acquirer_id: number;
  description?: string;
  customer_name?: string;
  customer_email?: string;
  customer_tax_id?: string;
  customer_phone?: string;
}

class FlowinPayClient {
  constructor(
    private apiUrl: string,
    private apiKey: string,
  ) {}

  async createCharge(data: CreateChargeRequest): Promise<{ charge: Charge }> {
    const response = await fetch(`${this.apiUrl}/v1/charges`, {
      method: 'POST',
      headers: {
        'X-Api-Key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    return response.json();
  }

  async getBalance(): Promise<{ balance: Balance }> {
    const response = await fetch(`${this.apiUrl}/v1/balance`, {
      headers: {
        'X-Api-Key': this.apiKey,
      },
    });

    return response.json();
  }

  verifyWebhook(payload: string, signature: string, secret: string): boolean {
    const crypto = require('crypto');
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  }
}

// Uso
const client = new FlowinPayClient(
  'https://app.flowinpay.com.br/api',
  'fp_xxxxxxxxxxxxxxxx'
);

const { charge } = await client.createCharge({
  value: 100,
  acquirer_id: 1,
  description: 'Pedido #1234',
});

console.log(charge.payment_link_url);
```

---

## Exemplo: Polling com Backoff

```javascript
async function waitForPayment(chargeId, maxWait = 600000) {
  const start = Date.now();
  let delay = 2000; // Começar com 2s

  while (Date.now() - start < maxWait) {
    const result = await flowinpay.getCharge(chargeId);
    const charge = result.charge;

    if (charge.status === 'paid') {
      return charge;
    }

    if (['cancelled', 'expired'].includes(charge.status)) {
      throw new Error(`Cobrança ${charge.status}`);
    }

    // Exponential backoff: 2s, 4s, 8s, 16s, 30s (max)
    await new Promise(r => setTimeout(r, Math.min(delay, 30000)));
    delay *= 2;
  }

  throw new Error('Timeout aguardando pagamento');
}

// Uso
try {
  const paid = await waitForPayment('correlation-id-aqui');
  console.log('Pago!', paid.paid_at);
} catch (err) {
  console.error('Erro:', err.message);
}
```
