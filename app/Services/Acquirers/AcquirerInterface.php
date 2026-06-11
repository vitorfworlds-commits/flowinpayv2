<?php

namespace App\Services\Acquirers;

use App\Models\Charge;

interface AcquirerInterface
{
    public function createCharge(Charge $charge, ?array $customer = null): array;
    public function getCharge(string $correlationId): array;
    public function getBalance(): array;
}
