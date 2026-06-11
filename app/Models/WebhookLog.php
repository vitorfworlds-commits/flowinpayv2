<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WebhookLog extends Model
{
    protected $fillable = [
        'acquirer_id',
        'event_type',
        'correlation_id',
        'payload',
        'status',
        'error_message',
        'ip_address',
        'signature',
    ];

    protected function casts(): array
    {
        return [
            'payload' => 'array',
        ];
    }

    public function acquirer()
    {
        return $this->belongsTo(Acquirer::class);
    }
}
