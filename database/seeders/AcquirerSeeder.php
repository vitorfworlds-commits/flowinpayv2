<?php

namespace Database\Seeders;

use App\Models\Acquirer;
use Illuminate\Database\Seeder;

class AcquirerSeeder extends Seeder
{
    public function run(): void
    {
        Acquirer::updateOrCreate(
            ['slug' => 'openpix'],
            [
                'name' => 'Woovi',
                'api_key' => env('OPENPIX_API_KEY', ''),
                'api_secret' => env('OPENPIX_WEBHOOK_SECRET', ''),
                'environment' => 'production',
                'base_url' => 'https://api.woovi.com',
                'is_active' => true,
                'logo_url' => 'https://developers.woovi.com/img/icons/woovi.svg',
                'color' => '#16a34a',
                'fee_percent' => 2.00,
                'fee_fixed' => 1.00,
                'description' => 'Gateway PIX — cobranças, saques, webhooks e defesa automática de disputas.',
                'config' => [
                    'webhook_url' => env('APP_URL') . '/api/webhook/openpix',
                    'supports_pix' => true,
                    'supports_boleto' => false,
                    'supports_card' => false,
                    'supports_disputes' => true,
                    'auto_defend_disputes' => true,
                ],
            ]
        );

        // Future acquirers can be added here:
        // Acquirer::updateOrCreate(['slug' => 'mercadopago'], [...]);
        // Acquirer::updateOrCreate(['slug' => 'pagseguro'], [...]);
    }
}
