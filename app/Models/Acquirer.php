<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Acquirer extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'api_key',
        'api_secret',
        'environment',
        'base_url',
        'is_active',
        'config',
        'logo_url',
        'color',
        'fee_percent',
        'fee_fixed',
        'description',
    ];

    protected $hidden = [
        'api_key',
        'api_secret',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'config' => 'array',
        ];
    }

    public function charges()
    {
        return $this->hasMany(Charge::class);
    }

    public function withdrawals()
    {
        return $this->hasMany(Withdrawal::class);
    }

    public function webhookLogs()
    {
        return $this->hasMany(WebhookLog::class);
    }

    public function users()
    {
        return $this->hasMany(User::class, 'default_acquirer_id');
    }

    public function isActive(): bool
    {
        return $this->is_active;
    }
}
