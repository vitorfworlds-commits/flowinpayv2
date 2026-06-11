<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WebhookConfig extends Model
{
    protected $fillable = [
        'user_id', 'url', 'secret', 'events', 'is_active',
        'description', 'last_triggered_at', 'failure_count',
    ];

    protected $casts = [
        'events' => 'array',
        'is_active' => 'boolean',
        'last_triggered_at' => 'datetime',
    ];

    protected $hidden = ['secret'];

    protected $appends = ['secret_preview'];

    public function getSecretPreviewAttribute(): ?string
    {
        if (!$this->secret) return null;
        return substr($this->secret, 0, 10) . '••••••••';
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
