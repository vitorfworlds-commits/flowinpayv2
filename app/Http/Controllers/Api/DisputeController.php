<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Dispute;
use App\Services\DisputeEvidenceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Models\AuditLog;

class DisputeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'nullable|string|in:open,under_review,accepted,rejected,cancelled',
            'type' => 'nullable|string|in:med,chargeback',
            'date_start' => 'nullable|date',
            'date_end' => 'nullable|date|after_or_equal:date_start',
            'search' => 'nullable|string|max:100',
        ]);

        $query = Dispute::forUser($request->user()->id)
            ->with('charge');

        if (!empty($validated['status'])) {
            $query->byStatus($validated['status']);
        }

        if (!empty($validated['type'])) {
            $query->byType($validated['type']);
        }

        if (!empty($validated['date_start']) || !empty($validated['date_end'])) {
            $query->dateRange($validated['date_start'] ?? null, $validated['date_end'] ?? null);
        }

        if (!empty($validated['search'])) {
            $search = str_replace(['%', '_'], ['\\%', '\\_'], $validated['search']);
            $query->where(function ($q) use ($search) {
                $q->where('reason', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('external_id', 'like', "%{$search}%");
            });
        }

        $disputes = $query->orderBy('created_at', 'desc')->paginate(15);

        return response()->json($disputes);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $dispute = Dispute::forUser($request->user()->id)
            ->with('charge')
            ->findOrFail($id);

        return response()->json($dispute);
    }

    public function stats(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        $stats = Dispute::forUser($userId)
            ->selectRaw("
                count(*) as total,
                coalesce(sum(case when status = 'open' then 1 else 0 end), 0) as open_count,
                coalesce(sum(case when status = 'under_review' then 1 else 0 end), 0) as review_count,
                coalesce(sum(case when status in ('accepted', 'resolved') then 1 else 0 end), 0) as resolved_count,
                coalesce(sum(case when status = 'rejected' then 1 else 0 end), 0) as rejected_count,
                coalesce(sum(amount), 0) as total_amount,
                coalesce(sum(case when status in ('open', 'under_review') then amount else 0 end), 0) as pending_amount
            ")
            ->first();

        return response()->json($stats);
    }

    public function cancel(Request $request, int $id): JsonResponse
    {
        $dispute = Dispute::forUser($request->user()->id)
            ->where('status', 'open')
            ->findOrFail($id);

        $dispute->update(['status' => 'cancelled']);

        AuditLog::log('dispute_cancelled', $dispute, null, [
            'user_id' => $request->user()->id,
        ]);

        return response()->json([
            'message' => 'Contestação cancelada',
            'dispute' => $dispute,
        ]);
    }

    /**
     * Generate and send defense dossier for a dispute.
     */
    public function defend(Request $request, int $id): JsonResponse
    {
        $dispute = Dispute::forUser($request->user()->id)
            ->with('charge')
            ->findOrFail($id);

        if (!in_array($dispute->status, ['open', 'under_review'])) {
            return response()->json([
                'message' => 'Não é possível enviar defesa para esta contestação (status: ' . $dispute->status . ')',
            ], 422);
        }

        // Idempotência: não reenviar se já enviado
        if ($dispute->evidence_sent_at) {
            return response()->json([
                'message' => 'Dossiê já enviado anteriormente em ' . $dispute->evidence_sent_at->format('d/m/Y H:i'),
                'dispute' => $dispute->load('evidences'),
            ]);
        }

        $service = app(DisputeEvidenceService::class);
        $success = $service->autoDefend($dispute);

        if ($success) {
            $dispute->refresh();
            return response()->json([
                'message' => 'Dossiê de defesa enviado com sucesso!',
                'dispute' => $dispute->load('evidences'),
            ]);
        }

        return response()->json([
            'message' => 'Erro ao enviar dossiê de defesa. Tente novamente.',
        ], 500);
    }

    /**
     * Preview the defense dossier HTML for a dispute.
     */
    public function previewDossier(Request $request, int $id): JsonResponse
    {
        $dispute = Dispute::forUser($request->user()->id)
            ->with('charge')
            ->findOrFail($id);

        $service = app(DisputeEvidenceService::class);
        $html = $service->buildDossierHtml($dispute, $dispute->charge);

        return response()->json([
            'html' => $html,
            'dispute_id' => $dispute->id,
        ]);
    }
}
