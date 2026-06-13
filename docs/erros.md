# Erros

A API FlowinPay utiliza códigos de status HTTP padrão e retorna erros em formato JSON.

## Formato do Erro

```json
{
  "message": "Descrição do erro",
  "errors": {
    "campo": ["Mensagem de validação"]
  }
}
```

## Códigos de Status

| Status | Descrição |
|---|---|
| `200` | Sucesso |
| `201` | Criado com sucesso |
| `400` | Requisição inválida |
| `401` | Não autenticado |
| `403` | Sem permissão |
| `404` | Recurso não encontrado |
| `422` | Erro de validação |
| `429` | Rate limit excedido |
| `500` | Erro interno do servidor |

## Erros Comuns

### 401 - Não Autenticado

```json
{
  "message": "Unauthenticated."
}
```

**Causas:**
- App ID ausente no header `X-Api-Key`
- App ID inválida ou revogada
- Formato incorreto (use `X-Api-Key: fpk_xxxx`)

**Solução:**
```bash
# Verifique se a App ID está correta e ativa no painel
curl -H "X-Api-Key: fpk_xxxx" "https://app.flowinpay.com.br/api/v1/balance"
```

---

### 403 - Sem Permissão

```json
{
  "message": "Esta ação não é autorizada."
}
```

**Causas:**
- API Key sem permissão para o endpoint
- Usuário sem acesso ao recurso

**Solução:**
- Verifique as permissões da API Key
- Use uma chave com permissões adequadas

---

### 404 - Não Encontrado

```json
{
  "message": "No query results for model [App\\Models\\Charge] 999"
}
```

**Causas:**
- ID do recurso não existe
- Recurso pertence a outro usuário

**Solução:**
- Verifique se o ID está correto
- Consulte a listagem para IDs válidos

---

### 422 - Erro de Validação

```json
{
  "message": "O valor da cobrança é obrigatório.",
  "errors": {
    "value": ["O valor da cobrança é obrigatório."]
  }
}
```

**Erros de Validação Comuns:**

#### Cobranças

| Campo | Erro | Solução |
|---|---|---|
| `value` | O valor da cobrança é obrigatório | Envie o campo `value` |
| `value` | O valor mínimo é R$ 2,00 | Aumente o valor |
| `value` | O valor máximo é R$ 150,00 | Diminua o valor |
| `acquirer_id` | Selecione uma adquirente | Envie `acquirer_id: 1` |
| `acquirer_id` | Adquirente inválida | Use um ID válido |
| `customer_email` | E-mail do cliente inválido | Formato: `user@example.com` |

#### Saques

| Campo | Erro | Solução |
|---|---|---|
| `value` | Saldo insuficiente | Verifique o saldo |
| `value` | Valor mínimo R$10 | Aumente o valor |
| `pix_key` | Chave PIX obrigatória | Envie a chave PIX |
| `pix_key_type` | Tipo inválido | Use: `cpf`, `cnpj`, `email`, `phone`, `random` |

#### Webhooks

| Campo | Erro | Solução |
|---|---|---|
| `url` | URL inválida | Use formato completo: `https://...` |
| `events` | Evento inválido | Use eventos da lista disponível |
| `events` | Selecione pelo menos um | Envie array com 1+ eventos |

---

### 429 - Rate Limit

```json
{
  "message": "Too Many Attempts.",
  "retry_after": 45
}
```

**Limites:**

| Endpoint | Limite |
|---|---|
| Login/Registro | 10 req/min |
| Cobranças | 30 req/min |
| Saques | 5 req/min |
| Outros | 120 req/min |

**Solução:**
- Aguarde `retry_after` segundos
- Implemente exponential backoff
- Use webhooks em vez de polling

---

### 500 - Erro Interno

```json
{
  "message": "Erro interno do servidor"
}
```

**Causas:**
- Erro na adquirente (Woovi)
- Timeout na API externa
- Falha temporária

**Solução:**
- Tente novamente em alguns segundos
- Verifique o status da API: `GET /api/health`
- Se persistir, contate o suporte

---

## Erros Específicos da Adquirente

### Erro ao criar cobrança

```json
{
  "message": "Erro ao criar cobrança na adquirente"
}
```

**Causas comuns:**
- Chave PIX inválida
- Valor fora do limite
- Falha de conexão com Woovi

**Solução:**
- Verifique os dados da cobrança
- Tente com outro valor
- Aguarde e tente novamente

---

## Boas Práticas

1. **Sempre verifique o status** — Não assuma sucesso
2. **Trate erros de validação** — Use o campo `errors` para feedback
3. **Implemente retry** — Para erros 429 e 500
4. **Log de erros** — Registre erros para debugging
5. **Idempotência** — Use `correlation_id` para evitar duplicatas

---

## Exemplo de Tratamento de Erros

### JavaScript

```javascript
async function createCharge(data) {
  try {
    const response = await fetch('/api/v1/charges', {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      
      if (response.status === 422) {
        // Erro de validação
        console.error('Validação:', error.errors);
        throw new Error(Object.values(error.errors).flat().join(', '));
      }
      
      if (response.status === 429) {
        // Rate limit - aguardar
        await new Promise(r => setTimeout(r, error.retry_after * 1000));
        return createCharge(data); // Retry
      }
      
      throw new Error(error.message);
    }

    return await response.json();
  } catch (error) {
    console.error('Erro:', error.message);
    throw error;
  }
}
```

### PHP

```php
function createCharge(array $data): array {
    $ch = curl_init('https://app.flowinpay.com.br/api/v1/charges');
    
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($data),
        CURLOPT_HTTPHEADER => [
            'X-Api-Key: ' . env('FLOWINPAY_API_KEY'),
            'Content-Type: application/json',
            'Accept: application/json',
        ],
        CURLOPT_RETURNTRANSFER => true,
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    $result = json_decode($response, true);
    
    if ($httpCode >= 400) {
        $errorMessage = $result['message'] ?? 'Erro desconhecido';
        
        if ($httpCode === 422) {
            $errors = collect($result['errors'])->flatten()->implode(', ');
            throw new Exception("Erro de validação: {$errors}");
        }
        
        if ($httpCode === 429) {
            sleep($result['retry_after']);
            return createCharge($data); // Retry
        }
        
        throw new Exception($errorMessage);
    }
    
    return $result;
}
```
