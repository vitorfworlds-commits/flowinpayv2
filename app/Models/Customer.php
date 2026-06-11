<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'email',
        'phone',
        'tax_id',
        'address',
    ];

    protected function casts(): array
    {
        return [
            'address' => 'array',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
