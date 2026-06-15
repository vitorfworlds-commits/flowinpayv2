<?php

namespace App\Services;

use App\Models\PushSubscription;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use GuzzleHttp\Client;
use Minishlink\WebPush\WebPush;
use Minishlink\WebPush\Subscription;

class PushNotificationService
{
    private ?WebPush $webPush = null;

    public function __construct()
    {
        $publicKey = config('services.vapid.public_key');
        $privateKey = config('services.vapid.private_key');

        if ($publicKey && $privateKey) {
            $auth = [
                'VAPID' => [
                    'subject' => config('services.vapid.subject', 'mailto:contato@flowinpay.com.br'),
                    'publicKey' => $publicKey,
                    'privateKey' => $privateKey,
                ],
            ];
            // Force IPv4 — Apple push servers timeout on IPv6 from this VPS
            $httpClient = new Client([
                'curl' => [CURLOPT_IPRESOLVE => CURL_IPRESOLVE_V4],
            ]);
            $this->webPush = new WebPush($auth, [], $httpClient);
        }
    }

    public function isConfigured(): bool
    {
        return $this->webPush !== null;
    }

    public function getPublicKey(): ?string
    {
        return config('services.vapid.public_key');
    }

    public function subscribe(User $user, array $subscription): PushSubscription
    {
        return PushSubscription::updateOrCreate(
            ['endpoint' => $subscription['endpoint']],
            [
                'user_id' => $user->id,
                'endpoint' => $subscription['endpoint'],
                'public_key' => $subscription['keys']['p256dh'],
                'auth_token' => $subscription['keys']['auth'],
                'content_encoding' => $subscription['supportedContentEncodings'] ?? 'aesgcm',
            ]
        );
    }

    public function unsubscribe(User $user, string $endpoint): bool
    {
        return (bool) PushSubscription::where('user_id', $user->id)
            ->where('endpoint', $endpoint)
            ->delete();
    }

    public function sendToUser(User $user, string $title, string $body, string $url = '/dashboard'): void
    {
        if (!$this->isConfigured()) {
            return;
        }

        $subscriptions = PushSubscription::where('user_id', $user->id)->get();

        $payload = json_encode([
            'title' => $title,
            'body' => $body,
            'icon' => '/favicon.ico',
            'badge' => '/favicon.ico',
            'data' => ['url' => $url],
        ]);

        foreach ($subscriptions as $sub) {
            try {
                $subscription = Subscription::create([
                    'endpoint' => $sub->endpoint,
                    'publicKey' => $sub->public_key,
                    'authToken' => $sub->auth_token,
                    'contentEncoding' => $sub->content_encoding,
                ]);

                $report = $this->webPush->sendOneNotification($subscription, $payload);

                if (!$report->isSuccess()) {
                    Log::warning('Push notification failed', [
                        'user_id' => $user->id,
                        'endpoint' => $sub->endpoint,
                        'reason' => $report->getReason(),
                    ]);

                    // Remover subscription inválida (410 Gone)
                    if (str_contains($report->getReason() ?? '', '410')) {
                        $sub->delete();
                    }
                }
            } catch (\Exception $e) {
                Log::error('Push notification error', [
                    'user_id' => $user->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }
    }
}
