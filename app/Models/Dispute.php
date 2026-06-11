<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Dispute extends Model
{
    protected $fillable = [
        'user_id', 'charge_id', 'external_id', 'type', 'status',
        'amount', 'currency', 'reason', 'description', 'evidence',
        'resolution', 'acquirer', 'due_at', 'resolved_at',
        'auto_defense', 'evidence_sent_at', 'dossier_html',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'due_at' => 'datetime',
        'resolved_at' => 'datetime',
        'evidence' => 'json',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function charge(): BelongsTo
    {
        return $this->belongsTo(Charge::class);
    }

    public function evidences()
    {
        return $this->hasMany(DisputeEvidence::class);
    }

    // Scopes
    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    public function scopeByType($query, string $type)
    {
        return $query->where('type', $type);
    }

    public function scopeDateRange($query, ?string $start, ?string $end)
    {
        if ($start) $query->where('created_at', '>=', $start);
        if ($end) $query->where('created_at', '<=', $end . ' 23:59:59');
        return $query;
    }
}
