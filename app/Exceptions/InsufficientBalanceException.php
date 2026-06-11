<?php

namespace App\Exceptions;

class InsufficientBalanceException extends \Exception
{
    public float $currentBalance;
    public float $requested;

    public function __construct(float $currentBalance, float $requested)
    {
        $this->currentBalance = $currentBalance;
        $this->requested = $requested;
        parent::__construct("Saldo insuficiente: disponível R$ {$currentBalance}, solicitado R$ {$requested}");
    }
}
