<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Charge extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'user_id',
        'acquirer_id',
        'correlation_id',
        'acquirer_correlation_id',
        'value',
        'fee_value',
        'fee_percent',
        'webhook_url',
        'webhook_secret',
        'status',
        'pix_key',
        'end_to_end_id',
        'br_code',
        'payment_link_url',
        'qr_code_image',
        'paid_at',
        'expires_at',
        'description',
        'additional_info',
        'acquirer_response',
        'webhook_url',
        'webhook_secret',
    ];

    protected $hidden = [
        'webhook_secret',
        'acquirer_response',
    ];

    protected function casts(): array
    {
        return [
            'value' => 'decimal:2',
            'fee_value' => 'decimal:2',
            'fee_percent' => 'decimal:2',
            'additional_info' => 'array',
            'paid_at' => 'datetime',
            'expires_at' => 'datetime',
            'end_to_end_id' => 'string',
        ];
    }

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function ($charge) {
            if (empty($charge->correlation_id)) {
                $charge->correlation_id = (string) Str::uuid();
            }
        });
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function acquirer()
    {
        return $this->belongsTo(Acquirer::class);
    }

    public function isPaid(): bool
    {
        return $this->status === 'paid';
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function isExpired(): bool
    {
        return $this->status === 'expired';
    }
}
