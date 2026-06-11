<?php

namespace App\Services;

use App\Models\Acquirer;
use App\Services\Acquirers\AcquirerInterface;
use App\Services\Acquirers\OpenPixService;

class AcquirerFactory
{
    public static function make(Acquirer $acquirer): AcquirerInterface
    {
        return match ($acquirer->slug) {
            'openpix' => new OpenPixService($acquirer),
            'woovi' => new OpenPixService($acquirer), // Woovi uses same API as OpenPix
            default => throw new \InvalidArgumentException("Adquirente não suportada: {$acquirer->slug}"),
        };
    }
}
