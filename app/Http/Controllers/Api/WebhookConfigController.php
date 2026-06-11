<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\WebhookConfig;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class WebhookConfigController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return response()->json($request->user()->webhookConfigs()->get());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'url' => 'required|url|max:500',
            'events' => 'required|array|min:1',
            'events.*' => 'string',
            'description' => 'nullable|string|max:200',
        ]);

        // XSS protection: sanitize description
        if (isset($validated['description'])) {
            $validated['description'] = htmlspecialchars($validated['description'], ENT_QUOTES, 'UTF-8');
        }

        // SSRF protection: block private/reserved IPs
        $host = parse_url($validated['url'], PHP_URL_HOST);
        if ($host && $this->isPrivateIp($host)) {
            return response()->json([
                'message' => 'URL não pode apontar para IP privado ou reservado.',
            ], 422);
        }

        $validEvents = ['charge.created', 'charge.completed', 'charge.expired', 'charge.cancelled', 'charge.refunded', 'withdrawal.completed', 'withdrawal.failed', 'dispute.opened', 'dispute.accepted', 'dispute.rejected', 'dispute.cancelled'];
        if (array_diff($validated['events'], $validEvents)) {
            return response()->json(['message' => 'Eventos inválidos.'], 422);
        }

        $plainSecret = 'whsec_' . Str::random(32);

        $webhook = WebhookConfig::create([
            'user_id' => $request->user()->id,
            'url' => $validated['url'],
            'secret' => $plainSecret,
            'events' => $validated['events'],
            'description' => $validated['description'] ?? null,
            'is_active' => true,
        ]);

        return response()->json([
            'message' => 'Webhook criado com sucesso! Guarde o secret — não será exibido novamente.',
            'webhook' => array_merge($webhook->toArray(), ['secret' => $plainSecret]),
        ], 201);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $webhook = WebhookConfig::forUser($request->user()->id)->findOrFail($id);
        return response()->json($webhook);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $webhook = WebhookConfig::forUser($request->user()->id)->findOrFail($id);

        $validated = $request->validate([
            'url' => 'sometimes|url|max:500',
            'events' => 'sometimes|array|min:1',
            'events.*' => 'string',
            'description' => 'nullable|string|max:200',
            'is_active' => 'boolean',
        ]);

        // XSS protection: sanitize description
        if (isset($validated['description'])) {
            $validated['description'] = htmlspecialchars($validated['description'], ENT_QUOTES, 'UTF-8');
        }

        if (isset($validated['events'])) {
            $validEvents = ['charge.created', 'charge.completed', 'charge.expired', 'charge.cancelled', 'charge.refunded', 'withdrawal.completed', 'withdrawal.failed', 'dispute.opened', 'dispute.accepted', 'dispute.rejected', 'dispute.cancelled'];
            if (array_diff($validated['events'], $validEvents)) {
                return response()->json(['message' => 'Eventos inválidos.'], 422);
            }
        }

        // SSRF protection: block private/reserved IPs
        if (isset($validated['url'])) {
            $host = parse_url($validated['url'], PHP_URL_HOST);
            if ($host && $this->isPrivateIp($host)) {
                return response()->json([
                    'message' => 'URL não pode apontar para IP privado ou reservado.',
                ], 422);
            }
        }

        $webhook->update($validated);

        return response()->json([
            'message' => 'Webhook atualizado!',
            'webhook' => $webhook,
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $webhook = WebhookConfig::forUser($request->user()->id)->findOrFail($id);
        $webhook->delete();

        return response()->json(['message' => 'Webhook removido']);
    }

    public function test(Request $request, int $id): JsonResponse
    {
        $webhook = WebhookConfig::forUser($request->user()->id)->findOrFail($id);

        // SSRF protection: block private/reserved IPs
        $host = parse_url($webhook->url, PHP_URL_HOST);
        if ($host && $this->isPrivateIp($host)) {
            return response()->json([
                'success' => false,
                'message' => 'URL não pode apontar para IP privado ou reservado.',
            ], 422);
        }

        try {
            $response = \Illuminate\Support\Facades\Http::withOptions(['allow_redirects' => false])
                ->timeout(10)
                ->post($webhook->url, [
                    'event' => 'webhook.test',
                    'message' => 'Este é um teste de webhook da FlowinPay',
                    'timestamp' => now()->toIso8601String(),
                ]);

            $webhook->update(['last_triggered_at' => now()]);

            return response()->json([
                'success' => $response->successful(),
                'status_code' => $response->status(),
                'message' => $response->successful()
                    ? 'Webhook enviado com sucesso!'
                    : 'Webhook retornou status ' . $response->status(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erro ao testar webhook: não foi possível conectar ao endpoint.',
            ], 422);
        }
    }

    public function toggle(Request $request, int $id): JsonResponse
    {
        $webhook = WebhookConfig::forUser($request->user()->id)->findOrFail($id);
        $webhook->update(['is_active' => !$webhook->is_active]);

        return response()->json([
            'message' => $webhook->is_active ? 'Webhook ativado!' : 'Webhook desativado!',
            'webhook' => $webhook,
        ]);
    }

    public function regenerateSecret(Request $request, int $id): JsonResponse
    {
        $webhook = WebhookConfig::forUser($request->user()->id)->findOrFail($id);
        $plainSecret = 'whsec_' . Str::random(32);
        $webhook->update(['secret' => $plainSecret]);

        return response()->json([
            'message' => 'Secret regenerado! Guarde o novo secret — não será exibido novamente.',
            'webhook' => array_merge($webhook->toArray(), ['secret' => $plainSecret]),
        ]);
    }

    private function isPrivateIp(string $host): bool
    {
        $ip = gethostbyname($host);
        if ($ip === $host) return false; // DNS failed

        return !filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE);
    }
}
