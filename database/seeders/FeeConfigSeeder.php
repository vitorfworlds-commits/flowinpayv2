<?php

namespace Database\Seeders;

use App\Models\FeeConfig;
use Illuminate\Database\Seeder;

class FeeConfigSeeder extends Seeder
{
    public function run(): void
    {
        FeeConfig::create([
            'percentual' => 2.00,
            'fixed_value' => 1.00,
            'withdrawal_fee' => 3.49,
            'minimum_charge' => 2.00,
            'maximum_charge' => 150.00,
            'is_active' => true,
        ]);
    }
}
