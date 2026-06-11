<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class ApiKey extends Model
{
    use SoftDeletes;

    // Plaintext secret — only populated during creation, before hashing
    public ?string $plain_secret = null;

    protected $fillable = [
        'user_id',
        'name',
        'key_prefix',
        'key_hash',
        'secret',
        'status',
        'permissions',
        'allowed_ips',
        'last_used_at',
        'last_used_ip',
    ];

    protected $hidden = [
        'key_hash',
        'secret',
    ];

    protected function casts(): array
    {
        return [
            'secret' => 'hashed',
            'permissions' => 'array',
            'allowed_ips' => 'array',
            'last_used_at' => 'datetime',
        ];
    }

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function ($apiKey) {
            if (empty($apiKey->secret)) {
                $plainSecret = 'fps_' . Str::random(64);
                $apiKey->plain_secret = $plainSecret;
                $apiKey->secret = $plainSecret;
            }
        });
    }

    /**
     * Gera uma nova API key e retorna os componentes.
     * @return array{plain: string, prefix: string, hash: string}
     */
    public static function generateKey(): array
    {
        $plain = 'fpk_' . Str::random(32);
        $prefix = substr($plain, 0, 12); // fpk_ + 8 chars visíveis
        $hash = hash('sha256', $plain);

        return [
            'plain' => $plain,
            'prefix' => $prefix,
            'hash' => $hash,
        ];
    }

    /**
     * Busca API key ativa pelo prefixo.
     */
    public static function findByPrefix(string $prefix): ?self
    {
        return static::where('key_prefix', $prefix)
            ->where('status', 'active')
            ->first();
    }

    /**
     * Verifica se a key plaintext corresponde ao hash armazenado.
     */
    public function isValidKey(string $plainKey): bool
    {
        return hash_equals($this->key_hash, hash('sha256', $plainKey));
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function isRevoked(): bool
    {
        return $this->status === 'revoked';
    }

    public function hasPermission(string $permission): bool
    {
        if (empty($this->permissions)) {
            return false;
        }

        return in_array($permission, $this->permissions) || in_array('*', $this->permissions);
    }

    public function isIpAllowed(string $ip): bool
    {
        if (empty($this->allowed_ips)) {
            return true; // sem IPs definidos = qualquer IP
        }

        return in_array($ip, $this->allowed_ips);
    }

    public function recordUsage(string $ip): void
    {
        $this->update([
            'last_used_at' => now(),
            'last_used_ip' => $ip,
        ]);
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }
}
