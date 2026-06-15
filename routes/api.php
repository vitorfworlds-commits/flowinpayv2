<?php

use App\Http\Controllers\Api\ApiKeyController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ChargeController;
use App\Http\Controllers\Api\FeeConfigController;
use App\Http\Controllers\Api\HealthController;
use App\Http\Controllers\Api\TransactionController;
use App\Http\Controllers\Api\WithdrawalController;
use App\Http\Controllers\Api\WebhookController;
use App\Http\Controllers\Api\DisputeController;
use App\Http\Controllers\Api\AcquirerController;
use App\Http\Controllers\Api\WebhookConfigController;
use App\Http\Controllers\Api\PublicChargeController;
use App\Http\Controllers\Api\KycController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Middleware\AdminMiddleware;
use Illuminate\Support\Facades\Route;

// ========== PÚBLICO ==========
Route::get('/health', HealthController::class);

// Pagamento público — sem autenticação
Route::get('/public/charge/{correlationId}', [PublicChargeController::class, 'show'])->middleware('throttle:30,1');

// VAPID public key — precisa ser público pra push subscription
Route::get('/notifications/vapid-key', [NotificationController::class, 'vapidPublicKey']);

// Rotas públicas — rate limit mais restritivo
Route::middleware('throttle:10,1')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:3,1');
    Route::post('/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:5,1');
});

// Webhooks — rate limit pra evitar flood
Route::post('/webhook/{acquirer}', [WebhookController::class, 'handle'])->middleware('throttle:100,1');

// ========== AUTENTICADA (Sanctum — Painel) ==========
Route::middleware(['auth:sanctum', 'throttle:120,1'])->group(function () {
    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::put('/me', [AuthController::class, 'updateProfile']);

    // Dashboard
    Route::get('/summary', [TransactionController::class, 'summary']);

    // Balance
    Route::get('/balance', [TransactionController::class, 'balance']);

    // Transactions (extrato)
    Route::get('/transactions', [TransactionController::class, 'index']);
    Route::get('/transactions/{id}', [TransactionController::class, 'show']);
    Route::get('/transactions/export/csv', [TransactionController::class, 'export']);

    // Charges (cobranças) — rate mais restritivo pra criar
    Route::get('/charges', [ChargeController::class, 'index']);
    Route::get('/charges/stats', [ChargeController::class, 'stats']);
    Route::get('/charges/{id}', [ChargeController::class, 'show']);

    // Withdrawals (saques) — list/view sempre acessível
    Route::get('/withdrawals', [WithdrawalController::class, 'index']);
    Route::get('/withdrawals/{id}', [WithdrawalController::class, 'show']);

    // Rotas que PRECISAM de KYC aprovado
    Route::middleware('kyc')->group(function () {
        Route::post('/charges', [ChargeController::class, 'store'])->middleware('throttle:30,1');
        Route::post('/charges/{id}/cancel', [ChargeController::class, 'cancel'])->middleware('throttle:10,1');
        Route::post('/withdrawals', [WithdrawalController::class, 'store'])->middleware('throttle:60,1');
        Route::post('/withdrawals/{id}/cancel', [WithdrawalController::class, 'cancel'])->middleware('throttle:60,1');
    });

    // Fee current (qualquer usuário autenticado pode ver a taxa vigente)
    Route::get('/fees/current', [FeeConfigController::class, 'current']);

    // Fee Config (admin only)
    Route::middleware(AdminMiddleware::class)->group(function () {
        Route::get('/fees', [FeeConfigController::class, 'index']);
        Route::post('/fees', [FeeConfigController::class, 'store']);
        Route::get('/fees/{id}', [FeeConfigController::class, 'show']);
        Route::put('/fees/{id}', [FeeConfigController::class, 'update']);
    });

    // Admin Panel (admin only)
    Route::middleware(AdminMiddleware::class)->prefix('admin')->group(function () {
        Route::get('/dashboard', [AdminController::class, 'dashboard']);
        Route::get('/dashboard/chart', [AdminController::class, 'revenueChart']);
        Route::get('/users', [AdminController::class, 'users']);
        Route::get('/users/{id}', [AdminController::class, 'userDetail']);
        Route::post('/users/{id}/block', [AdminController::class, 'blockUser']);
        Route::post('/users/{id}/unblock', [AdminController::class, 'unblockUser']);
        Route::post('/users/{id}/adjust-balance', [AdminController::class, 'adjustBalance']);
        Route::get('/users/{id}/charges', [AdminController::class, 'userCharges']);
        Route::get('/users/{id}/transactions', [AdminController::class, 'userTransactions']);
        Route::get('/users/{id}/withdrawals', [AdminController::class, 'userWithdrawals']);
        Route::get('/audit-logs', [AdminController::class, 'auditLogs']);
    });

    // Acquirers (adquirentes)
    Route::get('/acquirers', [AcquirerController::class, 'index']);
    Route::post('/acquirers/{id}/set-default', [AcquirerController::class, 'setDefault']);
    Route::get('/acquirers/{id}/stats', [AcquirerController::class, 'stats']);

    // Disputas (contestações)
    Route::get('/disputes', [DisputeController::class, 'index']);
    Route::get('/disputes/stats', [DisputeController::class, 'stats']);
    Route::get('/disputes/{id}', [DisputeController::class, 'show']);
    Route::post('/disputes/{id}/cancel', [DisputeController::class, 'cancel']);
    Route::post('/disputes/{id}/defend', [DisputeController::class, 'defend']);
    Route::get('/disputes/{id}/dossier-preview', [DisputeController::class, 'previewDossier']);

    // API Keys (gerenciar próprias keys)
    Route::get('/api-keys', [ApiKeyController::class, 'index']);

    // Webhook Configs
    Route::get('/webhooks', [WebhookConfigController::class, 'index']);
    Route::post('/webhooks', [WebhookConfigController::class, 'store']);
    Route::get('/webhooks/{id}', [WebhookConfigController::class, 'show']);
    Route::put('/webhooks/{id}', [WebhookConfigController::class, 'update']);
    Route::delete('/webhooks/{id}', [WebhookConfigController::class, 'destroy']);
    Route::post('/webhooks/{id}/toggle', [WebhookConfigController::class, 'toggle']);
    Route::post('/webhooks/{id}/regenerate-secret', [WebhookConfigController::class, 'regenerateSecret'])->middleware('throttle:60,1');
    Route::post('/webhooks/{id}/test', [WebhookConfigController::class, 'test']);
    Route::post('/api-keys', [ApiKeyController::class, 'store']);
    Route::get('/api-keys/{id}', [ApiKeyController::class, 'show']);
    Route::put('/api-keys/{id}', [ApiKeyController::class, 'update']);
    Route::patch('/api-keys/{id}/toggle', [ApiKeyController::class, 'toggle']);
    Route::delete('/api-keys/{id}', [ApiKeyController::class, 'destroy']);
    Route::post('/api-keys/{id}/regenerate', [ApiKeyController::class, 'regenerate'])->middleware('throttle:60,1');

    // KYC
    Route::get('/kyc', [KycController::class, 'index']);
    Route::post('/kyc', [KycController::class, 'store']);
    Route::get('/kyc/{document}', [KycController::class, 'show']);
    Route::delete('/kyc/{document}', [KycController::class, 'destroy']);

    // Push Notifications (vapid-key é pública, registrada acima)
    Route::get('/notifications/status', [NotificationController::class, 'status']);
    Route::post('/notifications/subscribe', [NotificationController::class, 'subscribe']);
    Route::post('/notifications/unsubscribe', [NotificationController::class, 'unsubscribe']);
});

// ========== API EXTERNA (autenticada via X-Api-Key) ==========
Route::middleware(['apikey', 'throttle:60,1'])->prefix('v1')->group(function () {
    // Cobranças
    Route::post('/charges', [ChargeController::class, 'store'])->middleware('apikey:charge:create');
    Route::get('/charges', [ChargeController::class, 'index'])->middleware('apikey:charge:read');
    Route::get('/charges/{id}', [ChargeController::class, 'show'])->middleware('apikey:charge:read');
    Route::post('/charges/{id}/cancel', [ChargeController::class, 'cancel'])->middleware('apikey:charge:cancel');

    // Saques
    Route::post('/withdrawals', [WithdrawalController::class, 'store'])->middleware('apikey:withdrawal:create');
    Route::get('/withdrawals', [WithdrawalController::class, 'index'])->middleware('apikey:withdrawal:read');

    // Saldo
    Route::get('/balance', [TransactionController::class, 'balance'])->middleware('apikey:balance:read');

    // Extrato
    Route::get('/transactions', [TransactionController::class, 'index'])->middleware('apikey:balance:read');
    Route::get('/transactions/{id}', [TransactionController::class, 'show'])->middleware('apikey:balance:read');

    // Taxas
    Route::get('/fees/current', [FeeConfigController::class, 'current']);

    // Dashboard
    Route::get('/summary', [TransactionController::class, 'summary'])->middleware('apikey:balance:read');

    // Webhooks — para plataformas como NyvVips criarem webhooks automaticamente
    Route::get('/webhooks', [WebhookConfigController::class, 'index']);
    Route::post('/webhooks', [WebhookConfigController::class, 'store']);
    Route::delete('/webhooks/{id}', [WebhookConfigController::class, 'destroy']);
});
