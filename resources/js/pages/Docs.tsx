import { useState } from 'react';
import { Copy, Check, Zap, Shield, Code, Key, Webhook, DollarSign, ArrowRight, FileCode } from 'lucide-react';
import toast from 'react-hot-toast';

const SECTIONS = [
  { id: 'intro', label: 'Introdução', icon: Zap },
  { id: 'auth', label: 'Autenticação', icon: Key },
  { id: 'charges', label: 'Cobranças', icon: DollarSign },
  { id: 'balance', label: 'Saldo', icon: DollarSign },
  { id: 'withdrawals', label: 'Saques', icon: ArrowRight },
  { id: 'transactions', label: 'Transações', icon: FileCode },
  { id: 'webhooks', label: 'Webhooks', icon: Webhook },
  { id: 'errors', label: 'Erros', icon: Shield },
];

const LANGS = [
  { id: 'curl', label: 'cURL' },
  { id: 'php', label: 'PHP' },
  { id: 'node', label: 'Node.js' },
  { id: 'python', label: 'Python' },
  { id: 'java', label: 'Java' },
  { id: 'go', label: 'Go' },
  { id: 'csharp', label: 'C#' },
  { id: 'ruby', label: 'Ruby' },
];

function CodeBlock({ children, lang = 'bash' }: { children: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => { await navigator.clipboard.writeText(children); setCopied(true); toast.success('Copiado!'); setTimeout(() => setCopied(false), 2000); };
  return (
    <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid hsl(var(--border))', margin: '12px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 14px', background: 'hsl(var(--muted))', borderBottom: '1px solid hsl(var(--border))' }}>
        <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'hsl(var(--muted-foreground))' }}>{lang}</span>
        <button onClick={copy} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--muted-foreground))', padding: 4 }}>{copied ? <Check size={14} /> : <Copy size={14} />}</button>
      </div>
      <pre style={{ padding: '16px 18px', background: 'hsl(224 71% 4%)', color: '#e2e8f0', fontSize: 13, lineHeight: 1.65, overflowX: 'auto', margin: 0, fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}>
        <code>{children}</code>
      </pre>
    </div>
  );
}

function LangSelector({ lang, setLang }: { lang: string; setLang: (l: string) => void }) {
  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', margin: '12px 0 6px' }}>
      {LANGS.map(l => (
        <button key={l.id} onClick={() => setLang(l.id)} style={{
          padding: '5px 12px', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: 'none',
          background: lang === l.id ? 'hsl(var(--foreground))' : 'hsl(var(--muted))',
          color: lang === l.id ? 'hsl(var(--background))' : 'hsl(var(--muted-foreground))',
          transition: 'all 0.15s',
        }}>{l.label}</button>
      ))}
    </div>
  );
}

function MultiCode({ examples, lang }: { examples: Record<string, string>; lang: string }) {
  const code = examples[lang] || examples['curl'] || '';
  const langMap: Record<string, string> = { curl: 'bash', php: 'php', node: 'javascript', python: 'python', java: 'java', go: 'go', csharp: 'csharp', ruby: 'ruby' };
  return <CodeBlock lang={langMap[lang] || 'bash'}>{code}</CodeBlock>;
}

function Endpoint({ method, path, description }: { method: string; path: string; description: string }) {
  const colors: Record<string, string> = { GET: 'hsl(142 76% 36%)', POST: 'hsl(217 91% 60%)', PUT: 'hsl(38 92% 50%)', DELETE: 'hsl(0 84% 60%)', PATCH: 'hsl(280 76% 50%)' };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, border: '1px solid hsl(var(--border))', marginBottom: 8, background: 'hsl(var(--card))' }}>
      <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 6, color: '#fff', background: colors[method] || 'gray', minWidth: 50, textAlign: 'center' }}>{method}</span>
      <code style={{ fontSize: 13, fontWeight: 600, fontFamily: 'monospace', flex: 1 }}>{path}</code>
      <span style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>{description}</span>
    </div>
  );
}

function ParamTable({ params }: { params: { name: string; type: string; required: boolean; desc: string }[] }) {
  return (
    <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid hsl(var(--border))', margin: '12px 0' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead><tr style={{ background: 'hsl(var(--muted))' }}>
          {['Campo', 'Tipo', 'Obrigatório', 'Descrição'].map(h => <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))', borderBottom: '1px solid hsl(var(--border))' }}>{h}</th>)}
        </tr></thead>
        <tbody>{params.map((p, i) => (
          <tr key={p.name} style={{ borderTop: i > 0 ? '1px solid hsl(var(--border))' : undefined }}>
            <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontWeight: 600 }}>{p.name}</td>
            <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: 'hsl(var(--muted-foreground))' }}>{p.type}</td>
            <td style={{ padding: '10px 14px' }}>{p.required ? <span style={{ color: 'hsl(0 84% 60%)', fontWeight: 700, fontSize: 11 }}>SIM</span> : <span style={{ color: 'hsl(var(--muted-foreground))', fontSize: 11 }}>não</span>}</td>
            <td style={{ padding: '10px 14px', color: 'hsl(var(--muted-foreground))' }}>{p.desc}</td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}

function H2({ children }: { children: React.ReactNode }) { return <h2 style={{ fontSize: 22, fontWeight: 800, margin: '32px 0 12px' }}>{children}</h2>; }
function H3({ children }: { children: React.ReactNode }) { return <h3 style={{ fontSize: 16, fontWeight: 700, margin: '24px 0 8px' }}>{children}</h3>; }
function P({ children }: { children: React.ReactNode }) { return <p style={{ fontSize: 14, lineHeight: 1.7, color: 'hsl(var(--muted-foreground))', margin: '8px 0' }}>{children}</p>; }

// ─── Section Components ─────────────────────────────────────────────────────

function Intro({ lang, setLang }: { lang: string; setLang: (l: string) => void }) { return (
  <div>
    <div style={{ padding: '32px 28px', borderRadius: 18, background: 'linear-gradient(135deg, hsl(142 76% 36% / 0.1), hsl(160 84% 39% / 0.08))', border: '1px solid hsl(142 76% 36% / 0.2)', marginBottom: 28 }}>
      <h1 style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 8 }}>API FlowinPay</h1>
      <p style={{ fontSize: 16, color: 'hsl(var(--muted-foreground))', lineHeight: 1.6 }}>Integre pagamentos PIX, saques e webhooks na sua plataforma.</p>
    </div>
    <H2>Início Rápido</H2>
    <LangSelector lang={lang} setLang={setLang} />
    <MultiCode lang={lang} examples={{
      curl: `curl -X POST "https://app.flowinpay.com/api/v1/charges" \\
  -H "X-Api-Key: fp_SUA_CHAVE" \\
  -H "Content-Type: application/json" \\
  -d '{"value": 50.00, "description": "Plano Pro", "acquirer_id": 1}'`,
      php: `<?php
$ch = curl_init('https://app.flowinpay.com/api/v1/charges');
curl_setopt_array($ch, [
    CURLOPT_POST => true, CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => ['X-Api-Key: fp_SUA_CHAVE', 'Content-Type: application/json'],
    CURLOPT_POSTFIELDS => json_encode(['value'=>50,'acquirer_id'=>1,'description'=>'Plano Pro']),
]);
$result = json_decode(curl_exec($ch), true);
echo $result['charge']['payment_link_url'];`,
      node: `const res = await fetch('https://app.flowinpay.com/api/v1/charges', {
  method: 'POST',
  headers: { 'X-Api-Key': 'fp_SUA_CHAVE', 'Content-Type': 'application/json' },
  body: JSON.stringify({ value: 50, acquirer_id: 1, description: 'Plano Pro' }),
});
const { charge } = await res.json();
console.log(charge.payment_link_url);`,
      python: `import requests
r = requests.post('https://app.flowinpay.com/api/v1/charges',
    headers={'X-Api-Key': 'fp_SUA_CHAVE'},
    json={'value': 50, 'acquirer_id': 1, 'description': 'Plano Pro'})
print(r.json()['charge']['payment_link_url'])`,
      java: `var req = HttpRequest.newBuilder()
    .uri(URI.create("https://app.flowinpay.com/api/v1/charges"))
    .header("X-Api-Key", "fp_SUA_CHAVE")
    .header("Content-Type", "application/json")
    .POST(BodyPublishers.ofString("{\\"value\\":50,\\"acquirer_id\\":1,\\"description\\":\\"Plano Pro\\"}"))
    .build();`,
      go: `body := \`{"value":50,"acquirer_id":1,"description":"Plano Pro"}\`
req, _ := http.NewRequest("POST", "https://app.flowinpay.com/api/v1/charges", strings.NewReader(body))
req.Header.Set("X-Api-Key", "fp_SUA_CHAVE")
req.Header.Set("Content-Type", "application/json")`,
      csharp: `var res = await client.PostAsJsonAsync("https://app.flowinpay.com/api/v1/charges",
    new { value = 50, acquirer_id = 1, description = "Plano Pro" });`,
      ruby: `uri = URI('https://app.flowinpay.com/api/v1/charges')
req = Net::HTTP::Post.new(uri, 'X-Api-Key' => 'fp_SUA_CHAVE', 'Content-Type' => 'application/json')
req.body = { value: 50, acquirer_id: 1, description: 'Plano Pro' }.to_json`,
    }} />
    <H2>Base URL</H2>
    <CodeBlock lang="text">https://app.flowinpay.com/api/v1</CodeBlock>
    <H2>Rate Limits</H2>
    <ParamTable params={[
      { name: 'Cobranças', type: '30/min', required: false, desc: 'Criação de cobranças' },
      { name: 'Saques', type: '5/min', required: false, desc: 'Solicitação de saques' },
      { name: 'Outros', type: '120/min', required: false, desc: 'Demais endpoints' },
    ]} />
  </div>
); }

function Auth({ lang, setLang }: { lang: string; setLang: (l: string) => void }) { return (
  <div>
    <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 4 }}>Autenticação</h1>
    <P>API Keys no header <code>X-Api-Key</code>.</P>
    <Endpoint method="POST" path="/api/login" description="Login (painel)" />
    <Endpoint method="GET" path="/api/v1/auth/me" description="Perfil" />
    <H2>Login</H2>
    <LangSelector lang={lang} setLang={setLang} />
    <MultiCode lang={lang} examples={{
      curl: `curl -X POST "https://app.flowinpay.com/api/login" \\
  -H "Content-Type: application/json" \\
  -d '{"email":"user@email.com","password":"senha123"}'`,
      php: `$ch = curl_init('https://app.flowinpay.com/api/login');
curl_setopt_array($ch, [CURLOPT_POST=>true, CURLOPT_RETURNTRANSFER=>true,
    CURLOPT_HTTPHEADER=>['Content-Type: application/json'],
    CURLOPT_POSTFIELDS=>json_encode(['email'=>'user@email.com','password'=>'senha123'])]);
$token = json_decode(curl_exec($ch), true)['token'];`,
      node: `const res = await fetch('https://app.flowinpay.com/api/login', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'user@email.com', password: 'senha123' }),
});
const { token } = await res.json();`,
      python: `r = requests.post('https://app.flowinpay.com/api/login',
    json={'email': 'user@email.com', 'password': 'senha123'})
token = r.json()['token']`,
      java: `var req = HttpRequest.newBuilder()
    .uri(URI.create("https://app.flowinpay.com/api/login"))
    .header("Content-Type", "application/json")
    .POST(BodyPublishers.ofString("{\\"email\\":\\"user@email.com\\",\\"password\\":\\"senha123\\"}"))
    .build();`,
      go: `req, _ := http.NewRequest("POST", "https://app.flowinpay.com/api/login",
    strings.NewReader(\`{"email":"user@email.com","password":"senha123"}\`))
req.Header.Set("Content-Type", "application/json")`,
      csharp: `var res = await client.PostAsJsonAsync("https://app.flowinpay.com/api/login",
    new { email = "user@email.com", password = "senha123" });`,
      ruby: `uri = URI('https://app.flowinpay.com/api/login')
req = Net::HTTP::Post.new(uri, 'Content-Type' => 'application/json')
req.body = { email: 'user@email.com', password: 'senha123' }.to_json`,
    }} />
    <H2>Permissões de API Key</H2>
    <ParamTable params={[
      { name: 'charge:create', type: 'permissão', required: false, desc: 'Criar cobranças' },
      { name: 'charge:read', type: 'permissão', required: false, desc: 'Consultar cobranças' },
      { name: 'charge:cancel', type: 'permissão', required: false, desc: 'Cancelar cobranças' },
      { name: 'withdrawals:write', type: 'permissão', required: false, desc: 'Solicitar saques' },
      { name: 'balance:read', type: 'permissão', required: false, desc: 'Consultar saldo' },
      { name: 'webhooks:write', type: 'permissão', required: false, desc: 'Criar webhooks' },
      { name: 'webhooks:read', type: 'permissão', required: false, desc: 'Listar webhooks' },
    ]} />
  </div>
); }

function Charges({ lang, setLang }: { lang: string; setLang: (l: string) => void }) { return (
  <div>
    <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 4 }}>Cobranças (PIX)</h1>
    <P>Crie cobranças PIX. Aceita <code>webhook_url</code> para webhook automático.</P>
    <Endpoint method="POST" path="/api/v1/charges" description="Criar cobrança" />
    <Endpoint method="GET" path="/api/v1/charges" description="Listar" />
    <Endpoint method="GET" path="/api/v1/charges/{id}" description="Consultar" />
    <Endpoint method="POST" path="/api/v1/charges/{id}/cancel" description="Cancelar" />
    <H2>Criar Cobrança</H2>
    <ParamTable params={[
      { name: 'value', type: 'number', required: true, desc: 'Valor em reais (R$2 a R$150)' },
      { name: 'acquirer_id', type: 'integer', required: true, desc: 'ID adquirente (use 1)' },
      { name: 'description', type: 'string', required: false, desc: 'Descrição' },
      { name: 'webhook_url', type: 'string', required: false, desc: 'URL callback — webhook automático' },
      { name: 'customer_name', type: 'string', required: false, desc: 'Nome pagador' },
      { name: 'customer_email', type: 'string', required: false, desc: 'Email pagador' },
      { name: 'customer_tax_id', type: 'string', required: false, desc: 'CPF/CNPJ pagador' },
    ]} />
    <LangSelector lang={lang} setLang={setLang} />
    <MultiCode lang={lang} examples={{
      curl: `curl -X POST "https://app.flowinpay.com/api/v1/charges" \\
  -H "X-Api-Key: fp_SUA_CHAVE" \\
  -H "Content-Type: application/json" \\
  -d '{"value":50,"acquirer_id":1,"description":"Pedido #123","webhook_url":"https://seusite.com/webhook"}'`,
      php: `$ch = curl_init('https://app.flowinpay.com/api/v1/charges');
curl_setopt_array($ch, [CURLOPT_POST=>true, CURLOPT_RETURNTRANSFER=>true,
    CURLOPT_HTTPHEADER=>['X-Api-Key: fp_SUA_CHAVE','Content-Type: application/json'],
    CURLOPT_POSTFIELDS=>json_encode(['value'=>50,'acquirer_id'=>1,'description'=>'Pedido #123',
        'webhook_url'=>'https://seusite.com/webhook'])]);
$result = json_decode(curl_exec($ch), true);`,
      node: `const res = await fetch('https://app.flowinpay.com/api/v1/charges', {
  method: 'POST',
  headers: { 'X-Api-Key': 'fp_SUA_CHAVE', 'Content-Type': 'application/json' },
  body: JSON.stringify({ value: 50, acquirer_id: 1, description: 'Pedido #123',
    webhook_url: 'https://seusite.com/webhook' }),
});
const { charge } = await res.json();`,
      python: `r = requests.post('https://app.flowinpay.com/api/v1/charges',
    headers={'X-Api-Key': 'fp_SUA_CHAVE'},
    json={'value': 50, 'acquirer_id': 1, 'description': 'Pedido #123',
          'webhook_url': 'https://seusite.com/webhook'})
charge = r.json()['charge']`,
      java: `var req = HttpRequest.newBuilder()
    .uri(URI.create("https://app.flowinpay.com/api/v1/charges"))
    .header("X-Api-Key", "fp_SUA_CHAVE").header("Content-Type", "application/json")
    .POST(BodyPublishers.ofString("{\\"value\\":50,\\"acquirer_id\\":1,\\"description\\":\\"Pedido #123\\"}"))
    .build();`,
      go: `req, _ := http.NewRequest("POST", "https://app.flowinpay.com/api/v1/charges",
    strings.NewReader(\`{"value":50,"acquirer_id":1,"description":"Pedido #123"}\`))
req.Header.Set("X-Api-Key", "fp_SUA_CHAVE")`,
      csharp: `var res = await client.PostAsJsonAsync("https://app.flowinpay.com/api/v1/charges",
    new { value = 50, acquirer_id = 1, description = "Pedido #123" });`,
      ruby: `uri = URI('https://app.flowinpay.com/api/v1/charges')
req = Net::HTTP::Post.new(uri, 'X-Api-Key' => 'fp_SUA_CHAVE', 'Content-Type' => 'application/json')
req.body = { value: 50, acquirer_id: 1, description: 'Pedido #123' }.to_json`,
    }} />
    <H3>Response</H3>
    <CodeBlock lang="json">{`{
  "message": "Cashin request successfully submitted",
  "charge": {
    "id": 42,
    "correlation_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "value": "50.00",
    "fee_value": "2.00",
    "status": "active",
    "br_code": "00020101021226580014br.gov.bcb.pix...",
    "payment_link_url": "https://app.flowinpay.com/pay/a1b2c3d4...",
    "expires_at": "2026-06-06T13:00:00Z"
  }
}`}</CodeBlock>
    <H2>Status</H2>
    <ParamTable params={[
      { name: 'active', type: '🟢', required: false, desc: 'Aguardando pagamento' },
      { name: 'paid', type: '✅', required: false, desc: 'Pago' },
      { name: 'cancelled', type: '🔴', required: false, desc: 'Cancelada' },
      { name: 'expired', type: '⏰', required: false, desc: 'Expirada' },
    ]} />
    <H2>Webhook Automático</H2>
    <P>Passe <code>webhook_url</code> no body — a FlowinPay cria automaticamente um webhook na sua conta. Sem duplicatas.</P>
  </div>
); }

function Balance({ lang, setLang }: { lang: string; setLang: (l: string) => void }) { return (
  <div>
    <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 4 }}>Saldo</h1>
    <Endpoint method="GET" path="/api/v1/balance" description="Consultar saldo" />
    <Endpoint method="GET" path="/api/v1/summary" description="Resumo financeiro" />
    <LangSelector lang={lang} setLang={setLang} />
    <MultiCode lang={lang} examples={{
      curl: `curl "https://app.flowinpay.com/api/v1/balance" -H "X-Api-Key: fp_SUA_CHAVE"`,
      php: `$ch = curl_init('https://app.flowinpay.com/api/v1/balance');
curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER=>true, CURLOPT_HTTPHEADER=>['X-Api-Key: fp_SUA_CHAVE']]);
echo curl_exec($ch);`,
      node: `const res = await fetch('https://app.flowinpay.com/api/v1/balance',
  { headers: { 'X-Api-Key': 'fp_SUA_CHAVE' } });
const { balance } = await res.json();`,
      python: `r = requests.get('https://app.flowinpay.com/api/v1/balance',
    headers={'X-Api-Key': 'fp_SUA_CHAVE'})`,
      java: `var req = HttpRequest.newBuilder()
    .uri(URI.create("https://app.flowinpay.com/api/v1/balance"))
    .header("X-Api-Key", "fp_SUA_CHAVE").build();`,
      go: `req, _ := http.NewRequest("GET", "https://app.flowinpay.com/api/v1/balance", nil)
req.Header.Set("X-Api-Key", "fp_SUA_CHAVE")`,
      csharp: `var res = await client.GetAsync("https://app.flowinpay.com/api/v1/balance");`,
      ruby: `uri = URI('https://app.flowinpay.com/api/v1/balance')
req = Net::HTTP::Get.new(uri, 'X-Api-Key' => 'fp_SUA_CHAVE')`,
    }} />
    <CodeBlock lang="json">{`{ "balance": { "available": 1250.75, "blocked": 100.00, "total": 1350.75 } }`}</CodeBlock>
  </div>
); }

function Withdrawals({ lang, setLang }: { lang: string; setLang: (l: string) => void }) { return (
  <div>
    <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 4 }}>Saques</h1>
    <Endpoint method="POST" path="/api/v1/withdrawals" description="Solicitar saque" />
    <Endpoint method="GET" path="/api/v1/withdrawals" description="Listar saques" />
    <ParamTable params={[
      { name: 'value', type: 'number', required: true, desc: 'Valor (mín: R$10)' },
      { name: 'pix_key', type: 'string', required: true, desc: 'Chave PIX destino' },
      { name: 'pix_key_type', type: 'string', required: true, desc: 'cpf, cnpj, email, phone, random' },
    ]} />
    <LangSelector lang={lang} setLang={setLang} />
    <MultiCode lang={lang} examples={{
      curl: `curl -X POST "https://app.flowinpay.com/api/v1/withdrawals" \\
  -H "X-Api-Key: fp_SUA_CHAVE" -H "Content-Type: application/json" \\
  -d '{"value":100,"pix_key":"12345678901","pix_key_type":"cpf"}'`,
      php: `$ch = curl_init('https://app.flowinpay.com/api/v1/withdrawals');
curl_setopt_array($ch, [CURLOPT_POST=>true, CURLOPT_RETURNTRANSFER=>true,
    CURLOPT_HTTPHEADER=>['X-Api-Key: fp_SUA_CHAVE','Content-Type: application/json'],
    CURLOPT_POSTFIELDS=>json_encode(['value'=>100,'pix_key'=>'12345678901','pix_key_type'=>'cpf'])]);`,
      node: `await fetch('https://app.flowinpay.com/api/v1/withdrawals', {
  method: 'POST', headers: { 'X-Api-Key': 'fp_SUA_CHAVE', 'Content-Type': 'application/json' },
  body: JSON.stringify({ value: 100, pix_key: '12345678901', pix_key_type: 'cpf' }),
});`,
      python: `requests.post('https://app.flowinpay.com/api/v1/withdrawals',
    headers={'X-Api-Key': 'fp_SUA_CHAVE'},
    json={'value': 100, 'pix_key': '12345678901', 'pix_key_type': 'cpf'})`,
      java: `var req = HttpRequest.newBuilder()
    .uri(URI.create("https://app.flowinpay.com/api/v1/withdrawals"))
    .header("X-Api-Key", "fp_SUA_CHAVE").header("Content-Type", "application/json")
    .POST(BodyPublishers.ofString("{\\"value\\":100,\\"pix_key\\":\\"12345678901\\",\\"pix_key_type\\":\\"cpf\\"}"))
    .build();`,
      go: `req, _ := http.NewRequest("POST", "https://app.flowinpay.com/api/v1/withdrawals",
    strings.NewReader(\`{"value":100,"pix_key":"12345678901","pix_key_type":"cpf"}\`))
req.Header.Set("X-Api-Key", "fp_SUA_CHAVE")`,
      csharp: `await client.PostAsJsonAsync("https://app.flowinpay.com/api/v1/withdrawals",
    new { value = 100, pix_key = "12345678901", pix_key_type = "cpf" });`,
      ruby: `req = Net::HTTP::Post.new(uri, 'X-Api-Key' => 'fp_SUA_CHAVE', 'Content-Type' => 'application/json')
req.body = { value: 100, pix_key: '12345678901', pix_key_type: 'cpf' }.to_json`,
    }} />
  </div>
); }

function Transactions() { return (
  <div>
    <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 4 }}>Transações</h1>
    <Endpoint method="GET" path="/api/v1/transactions" description="Extrato" />
    <Endpoint method="GET" path="/api/v1/transactions/{id}" description="Detalhar" />
    <ParamTable params={[
      { name: 'type', type: 'string', required: false, desc: 'charge_received, withdrawal, refund...' },
      { name: 'start_date', type: 'date', required: false, desc: 'YYYY-MM-DD' },
      { name: 'end_date', type: 'date', required: false, desc: 'YYYY-MM-DD' },
    ]} />
    <H2>Tipos</H2>
    <ParamTable params={[
      { name: 'charge_received', type: '+', required: false, desc: 'Recebimento' },
      { name: 'charge_fee', type: '-', required: false, desc: 'Taxa' },
      { name: 'withdrawal', type: '-', required: false, desc: 'Saque' },
      { name: 'refund', type: '+', required: false, desc: 'Estorno' },
    ]} />
  </div>
); }

function WebhooksSection({ lang, setLang }: { lang: string; setLang: (l: string) => void }) { return (
  <div>
    <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 4 }}>Webhooks</h1>
    <P>Receba notificações em tempo real. <strong>TIMEOUT DE 5 SEGUNDOS.</strong></P>
    <div style={{ padding: 16, borderRadius: 12, background: 'hsl(142 76% 36% / 0.06)', border: '1px solid hsl(142 76% 36% / 0.15)', margin: '16px 0', fontSize: 13 }}>
      <p style={{ fontWeight: 700, color: 'hsl(142 76% 36%)', marginBottom: 6 }}>Webhook Automático</p>
      <p style={{ color: 'hsl(var(--muted-foreground))' }}>Ao criar cobrança via API, passe <code>webhook_url</code> — a FlowinPay cria o webhook automaticamente.</p>
    </div>
    <Endpoint method="POST" path="/api/v1/webhooks" description="Registrar" />
    <Endpoint method="GET" path="/api/v1/webhooks" description="Listar" />
    <Endpoint method="DELETE" path="/api/v1/webhooks/{id}" description="Remover" />
    <Endpoint method="POST" path="/api/v1/webhooks/{id}/test" description="Testar" />
    <H2>Eventos</H2>
    <ParamTable params={[
      { name: 'charge.created', type: 'event', required: false, desc: 'Cobrança criada' },
      { name: 'charge.completed', type: 'event', required: false, desc: 'Cobrança paga' },
      { name: 'charge.expired', type: 'event', required: false, desc: 'Cobrança expirada' },
      { name: 'charge.cancelled', type: 'event', required: false, desc: 'Cobrança cancelada' },
      { name: 'withdrawal.completed', type: 'event', required: false, desc: 'Saque processado' },
      { name: 'dispute.opened', type: 'event', required: false, desc: 'Contestação aberta' },
    ]} />
    <H2>Payload</H2>
    <CodeBlock lang="json">{`{
  "event": "charge.completed",
  "charge": {
    "id": 42,
    "correlation_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "value": 50.00,
    "status": "paid",
    "paid_at": "2026-06-05T14:30:00Z"
  },
  "timestamp": "2026-06-05T14:30:00Z"
}`}</CodeBlock>
    <H2>Verificar Assinatura</H2>
    <LangSelector lang={lang} setLang={setLang} />
    <MultiCode lang={lang} examples={{
      curl: `EXPECTED=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "whsec_seu_secret" | cut -d' ' -f2)`,
      php: `$secret = 'whsec_seu_secret';
$signature = $_SERVER['HTTP_X_FLOWINPAY_SIGNATURE'] ?? '';
$expected = hash_hmac('sha256', file_get_contents('php://input'), $secret);
if (!hash_equals($expected, $signature)) { http_response_code(401); exit('Inválida'); }`,
      node: `const crypto = require('crypto');
const expected = crypto.createHmac('sha256', secret).update(req.body).digest('hex');
if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected)))
    return res.status(401).send('Invalid');`,
      python: `import hmac, hashlib
expected = hmac.new(SECRET.encode(), payload, hashlib.sha256).hexdigest()
if not hmac.compare_digest(signature, expected): return 'Invalid', 401`,
      java: `String expected = hmacSha256(payload, SECRET);
if (!MessageDigest.isEqual(expected.getBytes(), sig.getBytes()))
    return ResponseEntity.status(401).build();`,
      go: `mac := hmac.New(sha256.New, []byte(secret))
mac.Write(body)
expected := hex.EncodeToString(mac.Sum(nil))
if !hmac.Equal([]byte(sig), []byte(expected)) { w.WriteHeader(401); return }`,
      csharp: `var expected = HmacSha256(payload, SECRET);
if (!CryptographicOperations.FixedTimeEquals(Encoding.UTF8.GetBytes(sig), Encoding.UTF8.GetBytes(expected)))
    return Unauthorized();`,
      ruby: `expected = OpenSSL::HMAC.hexdigest('sha256', SECRET, payload)
halt 401 unless Rack::Utils.secure_compare(sig, expected)`,
    }} />
    <H2>Retry</H2>
    <P>Falha: <strong>imediato → 5s → 30s → 2min → 15min</strong> (5 tentativas).</P>
  </div>
); }

function Errors() { return (
  <div>
    <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 4 }}>Erros</h1>
    <CodeBlock lang="json">{`{ "message": "Erro", "errors": { "campo": ["Mensagem"] } }`}</CodeBlock>
    <ParamTable params={[
      { name: '200', type: 'OK', required: false, desc: 'Sucesso' },
      { name: '401', type: 'Unauthorized', required: false, desc: 'Token inválido' },
      { name: '422', type: 'Validation', required: false, desc: 'Erro de validação' },
      { name: '429', type: 'Rate Limit', required: false, desc: 'Muitas requisições' },
      { name: '500', type: 'Server Error', required: false, desc: 'Erro interno' },
    ]} />
  </div>
); }

// ─── Main App ───────────────────────────────────────────────────────────────

export default function Docs() {
  const [active, setActive] = useState('intro');
  const [lang, setLang] = useState('curl');

  const renderSection = () => {
    switch (active) {
      case 'intro': return <Intro lang={lang} setLang={setLang} />;
      case 'auth': return <Auth lang={lang} setLang={setLang} />;
      case 'charges': return <Charges lang={lang} setLang={setLang} />;
      case 'balance': return <Balance lang={lang} setLang={setLang} />;
      case 'withdrawals': return <Withdrawals lang={lang} setLang={setLang} />;
      case 'transactions': return <Transactions />;
      case 'webhooks': return <WebhooksSection lang={lang} setLang={setLang} />;
      case 'errors': return <Errors />;
      default: return <P>Seção não encontrada.</P>;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'hsl(var(--background))' }}>
      <aside style={{ width: 260, flexShrink: 0, borderRight: '1px solid hsl(var(--border))', padding: '24px 0', position: 'sticky', top: 0, height: '100vh', overflowY: 'auto', background: 'hsl(var(--card))' }}>
        <div style={{ padding: '0 20px', marginBottom: 28, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg, hsl(142 76% 36%), hsl(160 84% 39%))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Code size={15} color="#fff" />
          </div>
          <span style={{ fontSize: 16, fontWeight: 800 }}>FlowinPay API</span>
        </div>
        <nav>
          {SECTIONS.map(s => {
            const Icon = s.icon;
            const isActive = active === s.id;
            return (
              <button key={s.id} onClick={() => setActive(s.id)} style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 20px',
                background: isActive ? 'hsl(142 76% 36% / 0.08)' : 'transparent',
                border: 'none', cursor: 'pointer', textAlign: 'left',
                borderRight: isActive ? '2px solid hsl(142 76% 36%)' : '2px solid transparent',
                color: isActive ? 'hsl(142 76% 36%)' : 'hsl(var(--muted-foreground))',
                fontSize: 13, fontWeight: isActive ? 700 : 500, transition: 'all 0.15s',
              }}>
                <Icon size={16} />
                {s.label}
              </button>
            );
          })}
        </nav>
      </aside>
      <main style={{ flex: 1, padding: '40px 56px', maxWidth: 860 }}>
        {renderSection()}
      </main>
    </div>
  );
}
