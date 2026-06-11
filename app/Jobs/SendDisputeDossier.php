<?php

namespace App\Jobs;

use App\Models\Dispute;
use App\Services\DisputeEvidenceService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendDisputeDossier implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $timeout = 60;

    public function __construct(
        public int $disputeId,
    ) {}

    public function handle(DisputeEvidenceService $service): void
    {
        $dispute = Dispute::with('charge')->find($this->disputeId);

        if (!$dispute) {
            Log::warning('SendDisputeDossier: dispute not found', ['id' => $this->disputeId]);
            return;
        }

        if ($dispute->evidence_sent_at) {
            Log::info('SendDisputeDossier: already sent', ['id' => $this->disputeId]);
            return;
        }

        Log::info('SendDisputeDossier: starting', ['id' => $this->disputeId]);

        $success = $service->autoDefend($dispute);

        if ($success) {
            Log::info('SendDisputeDossier: success', ['id' => $this->disputeId]);
        } else {
            Log::error('SendDisputeDossier: failed', ['id' => $this->disputeId]);
        }
    }
}
