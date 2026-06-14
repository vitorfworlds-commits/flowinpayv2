<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'name',
        'email',
        'default_acquirer_id',
        'pix_key',
        'subaccount_pix_key',
        'subaccount_id',
        'tax_id',
        'phone',
        'password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'balance' => 'decimal:2',
            'balance_blocked' => 'decimal:2',
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

    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }

    public function customers()
    {
        return $this->hasMany(Customer::class);
    }

    public function apiKeys()
    {
        return $this->hasMany(ApiKey::class);
    }

    public function webhookConfigs()
    {
        return $this->hasMany(WebhookConfig::class);
    }

    public function kycDocuments()
    {
        return $this->hasMany(KycDocument::class);
    }

    public function defaultAcquirer()
    {
        return $this->belongsTo(Acquirer::class, 'default_acquirer_id');
    }
}
