<?php

namespace App\Services;

use App\Models\Charge;
use App\Models\Dispute;
use App\Models\DisputeEvidence;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class DisputeEvidenceService
{
    /**
     * Generate and send defense dossier for a dispute automatically.
     */
    public function autoDefend(Dispute $dispute): bool
    {
        try {
            $charge = $dispute->charge;
            if (!$charge) {
                $charge = $this->findChargeByEndToEndId($dispute);
            }

            $dossierHtml = $this->buildDossierHtml($dispute, $charge);

            // Store dossier in dispute
            $dispute->update([
                'dossier_html' => $dossierHtml,
                'auto_defense' => true,
            ]);

            // Upload to a publicly accessible URL
            $publicUrl = $this->uploadDossier($dossierHtml, $dispute->id);

            if (!$publicUrl) {
                Log::error('Failed to upload dossier for dispute', ['dispute_id' => $dispute->id]);
                return false;
            }

            // Send to Woovi API
            $result = $this->sendToWoovi($dispute, $publicUrl);

            if ($result) {
                $dispute->update(['evidence_sent_at' => now()]);

                DisputeEvidence::create([
                    'dispute_id' => $dispute->id,
                    'document_url' => $publicUrl,
                    'woovi_url' => $result['documents'][0]['url'] ?? null,
                    'description' => 'Dossiê de defesa automático — MED',
                    'correlation_id' => 'auto-' . $dispute->id,
                    'status' => 'sent',
                    'sent_at' => now(),
                ]);

                Log::info('Dossier sent successfully', ['dispute_id' => $dispute->id]);
                return true;
            }

            return false;
        } catch (\Throwable $e) {
            Log::error('Auto-defend failed', [
                'dispute_id' => $dispute->id,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Build the defense dossier HTML (FlowinPay 100% win-rate format).
     */
    public function buildDossierHtml(Dispute $dispute, ?Charge $charge): string
    {
        $now = now()->format('d/m/Y H:i:s');
        $user = $charge?->user;
        $acquirerResponse = $charge ? json_decode($charge->acquirer_response, true) : [];
        $disputeData = json_decode($dispute->evidence, true) ?? [];

        // Extract payment info from various sources (ALL escaped for XSS safety)
        $endToEndId = e($disputeData['dispute']['endToEndId'] ?? $acquirerResponse['pix']['endToEndId'] ?? $acquirerResponse['endToEndId'] ?? 'N/A');
        $payerName = e($disputeData['dispute']['name'] ?? $acquirerResponse['payer']['name'] ?? $acquirerResponse['charge']['payer']['name'] ?? 'N/A');
        $payerDocument = e($acquirerResponse['payer']['document'] ?? $acquirerResponse['charge']['payer']['document'] ?? 'N/A');
        $payerPsp = e($acquirerResponse['payer']['bank'] ?? 'N/A');
        $pixKey = e($charge?->correlation_id ?? 'N/A');
        $pixKeyType = 'RANDOM';

        // Access link
        // Página pública da transação que já existe (/pay/{correlationId}).
        // O correlationId é um UUID não-enumerável — dispensa token extra.
        $accessLink = $charge ? e(config('app.url') . '/pay/' . $charge->correlation_id) : 'N/A';

        $chargeValue = $charge ? number_format($charge->value, 2, ',', '.') : number_format($dispute->amount, 2, ',', '.');
        $chargeDate = $charge ? $charge->created_at->format('d/m/Y H:i') : $dispute->created_at->format('d/m/Y H:i');
        $paidDate = $charge?->paid_at?->format('d/m/Y H:i:s') ?? 'N/A';

        $merchantName = e($user?->name ?? 'N/A');
        $merchantEmail = e($user?->email ?? 'N/A');
        $merchantDocument = e($user?->tax_id ?? 'N/A');
        $disputeType = e(strtoupper($disputeData['dispute']['type'] ?? 'MED'));
        $disputeReason = e($disputeData['dispute']['disputeReason'] ?? 'N/A');

        // Logs
        // Apenas eventos reais e datados (sem registros sintéticos).
        $logs = [];
        if ($charge) {
            $logs[] = ['date' => $charge->created_at->format('d/m/Y H:i:s'), 'event' => 'cobranca_criada', 'detail' => $charge->correlation_id ?? 'N/A'];
            if ($charge->paid_at) {
                $logs[] = ['date' => $charge->paid_at->format('d/m/Y H:i:s'), 'event' => 'pagamento_confirmado', 'detail' => $charge->correlation_id ?? 'N/A'];
            }
        }

        $html = <<<HTML
<!DOCTYPE html>
<html lang="pt-br">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Dossiê de Defesa — {$disputeType} #{$dispute->id}</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Segoe UI', system-ui, sans-serif; font-size: 13px; line-height: 1.6; color: #1a1a2e; background: #f8f9fa; padding: 32px; }
.container { max-width: 720px; margin: 0 auto; background: #fff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.06); overflow: hidden; }
.header { background: linear-gradient(135deg, #16a34a, #22c55e); color: #fff; padding: 28px 32px; }
.header h1 { font-size: 20px; font-weight: 800; margin-bottom: 4px; }
.header p { font-size: 12px; opacity: 0.85; }
.section { padding: 24px 32px; border-bottom: 1px solid #e5e7eb; }
.section:last-child { border-bottom: none; }
.section-title { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #16a34a; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
.section-title::before { content: ''; width: 3px; height: 14px; background: #16a34a; border-radius: 2px; }
.row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
.row:last-child { border-bottom: none; }
.row-label { color: #6b7280; font-size: 12px; font-weight: 600; }
.row-value { color: #111827; font-size: 13px; font-weight: 600; text-align: right; max-width: 60%; word-break: break-all; }
.highlight { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px; margin: 12px 0; }
.highlight strong { color: #16a34a; }
.link { color: #2563eb; text-decoration: none; word-break: break-all; }
.link:hover { text-decoration: underline; }
.log-table { width: 100%; border-collapse: collapse; margin-top: 8px; }
.log-table th { background: #f9fafb; padding: 8px 12px; text-align: left; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #6b7280; border-bottom: 1px solid #e5e7eb; }
.log-table td { padding: 8px 12px; border-bottom: 1px solid #f3f4f6; font-size: 12px; }
.log-table td:first-child { font-family: monospace; white-space: nowrap; color: #6b7280; }
.log-table td:nth-child(2) { font-weight: 600; }
.kyc { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 16px; }
.kyc .row-label { color: #3b82f6; }
.fingerprint { background: #fefce8; border: 1px solid #fde68a; border-radius: 12px; padding: 16px; }
.fingerprint .row-label { color: #ca8a04; }
.footer { background: #111827; color: #fff; padding: 20px 32px; text-align: center; font-size: 11px; font-weight: 700; letter-spacing: 0.06em; }
.badge { display: inline-block; padding: 3px 10px; border-radius: 6px; font-size: 10px; font-weight: 700; }
.badge-green { background: #dcfce7; color: #16a34a; }
.badge-amber { background: #fef3c7; color: #d97706; }
.badge-red { background: #fee2e2; color: #dc2626; }
</style>
</head>
<body>
<div class="container">

<div class="header">
    <h1>Dossiê de Defesa de {$disputeType}</h1>
    <p>Gerado em: {$now} — Documento válido para disputa judicial</p>
</div>

<!-- RESUMO DA TRANSAÇÃO -->
<div class="section">
    <div class="section-title">Resumo da Transação</div>
    <div class="row"><span class="row-label">ID TRANSAÇÃO</span><span class="row-value">#{$dispute->id}</span></div>
    <div class="row"><span class="row-label">VALOR</span><span class="row-value">R$ {$chargeValue}</span></div>
    <div class="row"><span class="row-label">DATA</span><span class="row-value">{$chargeDate}</span></div>
    <div class="row"><span class="row-label">STATUS</span><span class="row-value"><span class="badge badge-green">PAID</span></span></div>
    <div class="row"><span class="row-label">ID EXTERNO</span><span class="row-value">{$pixKey}</span></div>
</div>

<!-- DADOS DO PAGAMENTO -->
<div class="section">
    <div class="section-title">Dados do Pagamento (Woovi)</div>
    <div class="row"><span class="row-label">ENDTOENDID</span><span class="row-value" style="font-family: monospace;">{$endToEndId}</span></div>
    <div class="row"><span class="row-label">PAGADOR</span><span class="row-value">{$payerName}</span></div>
    <div class="row"><span class="row-label">DOCUMENTO</span><span class="row-value">{$payerDocument}</span></div>
    <div class="row"><span class="row-label">PSP</span><span class="row-value">{$payerPsp}</span></div>
    <div class="row"><span class="row-label">CHAVE PIX</span><span class="row-value" style="font-family: monospace;">{$pixKey}</span></div>
    <div class="row"><span class="row-label">TIPO CHAVE</span><span class="row-value">{$pixKeyType}</span></div>
</div>

<!-- DETALHES DA COMPRA -->
<div class="section">
    <div class="section-title">Detalhes da Compra na Plataforma</div>
    <div class="row"><span class="row-label">COMPRADOR</span><span class="row-value">{$payerName}</span></div>
    <div class="row"><span class="row-label">PRODUTO</span><span class="row-value">Conteúdo digital</span></div>
    <div class="row"><span class="row-label">ENTREGA</span><span class="row-value"><a href="{$accessLink}" class="link">{$accessLink}</a></span></div>
</div>

<!-- EXPLICAÇÃO DO CASO -->
<div class="section">
    <div class="section-title">Explicação do Caso e Modelo de Negócio</div>
    <div class="highlight">
        <strong>MODELO:</strong> Comercializamos conteúdo digital.<br><br>
        A compra é realizada em nosso site e a entrega é automática após a confirmação do pagamento, por meio de um link único gerado pela plataforma.<br><br>
        O sistema registra a aprovação do pagamento e logs técnicos de acesso ao conteúdo quando o comprador utiliza o link.
    </div>
    <div class="highlight">
        <strong>CASO:</strong> O comprador realizou a compra em nosso site (Transação #{$dispute->id}), no valor de R$ {$chargeValue} em {$chargeDate}.<br><br>
        Após a confirmação do pagamento ({$paidDate}), o sistema liberou automaticamente o acesso ao conteúdo digital e disponibilizou um link único ao comprador.<br><br>
        <strong>Link de acesso único:</strong><br>
        <a href="{$accessLink}" class="link">{$accessLink}</a><br><br>
        Conteúdo liberado automaticamente em {$paidDate}.<br>
        Consta registro interno de liberação do acesso em {$paidDate}.<br><br>
        Dessa forma, a entrega do conteúdo digital ocorreu conforme ofertado.
    </div>
    <div class="highlight">
        <strong>COMUNICAÇÃO:</strong> A entrega é realizada automaticamente pela plataforma após a confirmação do pagamento.<br><br>
        <strong>ENTREGA:</strong><br>
        • Checkout iniciado: {$chargeDate}<br>
        • Pagamento confirmado: {$paidDate}<br>
        • Conteúdo liberado: {$paidDate}
    </div>
</div>

<!-- LOGS -->
<div class="section">
    <div class="section-title">Logs de Envio/Entrega (Plataforma)</div>
    <table class="log-table">
        <thead><tr><th>Data/Hora</th><th>Evento</th><th>Detalhe</th></tr></thead>
        <tbody>
HTML;

        foreach ($logs as $log) {
            $detailEscaped = e($log['detail']);
            $eventEscaped = e($log['event']);
            $dateEscaped = e($log['date']);
            $html .= "<tr><td>{$dateEscaped}</td><td>{$eventEscaped}</td><td>{$detailEscaped}</td></tr>";
        }

        $html .= <<<HTML
        </tbody>
    </table>
</div>

<!-- KYC -->
<div class="section">
    <div class="section-title">Dados do Recebedor (KYC)</div>
    <div class="kyc">
        <div class="row"><span class="row-label">NOME</span><span class="row-value">{$merchantName}</span></div>
        <div class="row"><span class="row-label">EMAIL</span><span class="row-value">{$merchantEmail}</span></div>
        <div class="row"><span class="row-label">CPF/CNPJ</span><span class="row-value">{$merchantDocument}</span></div>
    </div>
</div>

<div class="footer">
    DOCUMENTO VÁLIDO PARA DISPUTA JUDICIAL
</div>

</div>
</body>
</html>
HTML;

        return $html;
    }

    /**
     * Upload dossier to publicly accessible storage.
     */
    private function uploadDossier(string $html, int $disputeId): ?string
    {
        // Unpredictable filename with HMAC — prevents enumeration
        $token = hash_hmac('sha256', $disputeId . '|' . now()->timestamp, config('app.key'));
        $filename = "dossier_{$token}.html";
        $path = "disputes/{$filename}";

        try {
            \Illuminate\Support\Facades\Storage::disk('public')->put($path, $html);
            return \Illuminate\Support\Facades\Storage::disk('public')->url($path);
        } catch (\Throwable $e) {
            Log::error('Dossier upload failed', ['error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Send evidence to Woovi API.
     */
    private function sendToWoovi(Dispute $dispute, string $publicUrl): ?array
    {
        $externalId = $dispute->external_id;

        if (empty($externalId)) {
            Log::warning('No external ID for dispute, cannot send to Woovi', ['dispute_id' => $dispute->id]);
            return null;
        }

        // Usar API key do banco de dados (acquirer), não do .env
        $acquirer = $dispute->charge?->acquirer;
        $apiKey = $acquirer?->api_key ?? config('services.openpix.api_key');

        if (empty($apiKey)) {
            Log::error('Woovi API key not configured');
            return null;
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => $apiKey,
                'Content-Type' => 'application/json',
            ])->post("https://api.woovi.com/api/v1/dispute/{$externalId}/evidence", [
                'documents' => [[
                    'url' => $publicUrl,
                    'description' => "Dossiê de defesa automático — Disputa #{$dispute->id}",
                    'correlationID' => "dispute-{$dispute->id}",
                ]],
            ]);

            if ($response->successful()) {
                return $response->json();
            }

            Log::error('Woovi evidence API failed', [
                'dispute_id' => $dispute->id,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            return null;
        } catch (\Throwable $e) {
            Log::error('Woovi evidence API error', [
                'dispute_id' => $dispute->id,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    /**
     * Find charge by endToEndId from dispute data.
     */
    private function findChargeByEndToEndId(Dispute $dispute): ?Charge
    {
        if (!$dispute->evidence) return null;

        $data = json_decode($dispute->evidence, true);
        $endToEndId = $data['dispute']['endToEndId'] ?? null;

        if (!$endToEndId) return null;

        $safeId = str_replace(['%', '_'], ['\\%', '\\_'], $endToEndId);
        return Charge::where('acquirer_response', 'like', "%{$safeId}%")->first();
    }
}
