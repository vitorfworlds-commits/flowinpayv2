<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FeeConfig extends Model
{
    protected $table = 'fee_config';

    protected $fillable = [
        'percentual',
        'fixed_value',
        'withdrawal_fee',
        'minimum_charge',
        'maximum_charge',
        'minimum_withdrawal',
        'maximum_withdrawal',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'percentual' => 'decimal:2',
            'fixed_value' => 'decimal:2',
            'withdrawal_fee' => 'decimal:2',
            'minimum_charge' => 'decimal:2',
            'maximum_charge' => 'decimal:2',
            'minimum_withdrawal' => 'decimal:2',
            'maximum_withdrawal' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    public static function getActive(): self
    {
        return static::where('is_active', true)->firstOrCreate([], [
            'percentual' => 2.00,
            'fixed_value' => 1.00,
            'withdrawal_fee' => 3.49,
            'minimum_charge' => 2.00,
            'maximum_charge' => 150.00,
            'minimum_withdrawal' => 5.00,
            'maximum_withdrawal' => 1000.00,
        ]);
    }

    public function calculateFee(float $value): float
    {
        $percent = ($value * $this->percentual) / 100;
        return round($percent + $this->fixed_value, 2);
    }

    public function calculateWithdrawalFee(float $value): float
    {
        return $this->withdrawal_fee;
    }
}
