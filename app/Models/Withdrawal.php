<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Withdrawal extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'user_id',
        'acquirer_id',
        'value',
        'fee_value',
        'net_value',
        'pix_key',
        'pix_key_type',
        'status',
        'acquirer_response',
        'transaction_id',
        'processed_at',
        'description',
    ];

    protected function casts(): array
    {
        return [
            'value' => 'decimal:2',
            'fee_value' => 'decimal:2',
            'net_value' => 'decimal:2',
            'processed_at' => 'datetime',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function acquirer()
    {
        return $this->belongsTo(Acquirer::class);
    }
}
