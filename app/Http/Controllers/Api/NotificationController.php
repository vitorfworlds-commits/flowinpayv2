<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\PushNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function __construct(
        private PushNotificationService $pushService
    ) {}

    public function vapidPublicKey(): JsonResponse
    {
        $key = $this->pushService->getPublicKey();

        if (!$key) {
            return response()->json(['message' => 'Push notifications não configuradas'], 503);
        }

        return response()->json(['public_key' => $key]);
    }

    public function subscribe(Request $request): JsonResponse
    {
        $request->validate([
            'endpoint' => 'required|url',
            'keys.p256dh' => 'required|string',
            'keys.auth' => 'required|string',
        ]);

        $this->pushService->subscribe($user = $request->user(), $request->all());

        return response()->json(['message' => 'Inscrito em notificações push']);
    }

    public function unsubscribe(Request $request): JsonResponse
    {
        $request->validate([
            'endpoint' => 'required|url',
        ]);

        $this->pushService->unsubscribe($request->user(), $request->endpoint);

        return response()->json(['message' => 'Inscrição removida']);
    }

    public function status(Request $request): JsonResponse
    {
        $isSubscribed = $request->user()
            ->pushSubscriptions()
            ->exists();

        return response()->json([
            'subscribed' => $isSubscribed,
            'configured' => $this->pushService->isConfigured(),
        ]);
    }
}
