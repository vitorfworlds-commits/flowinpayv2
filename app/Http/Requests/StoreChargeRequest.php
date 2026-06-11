<?php

namespace App\Http\Requests;

use App\Models\FeeConfig;
use Illuminate\Foundation\Http\FormRequest;

class StoreChargeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $fee = FeeConfig::getActive();

        return [
            'value' => [
                'required',
                'numeric',
                'min:' . $fee->minimum_charge,
                'max:' . $fee->maximum_charge,
            ],
            'description' => 'nullable|string|max:255',
            'acquirer_id' => 'required|exists:acquirers,id',
            'customer_name' => 'nullable|string|max:255',
            'customer_email' => 'nullable|email|max:255',
            'customer_tax_id' => 'nullable|string|max:20',
            'customer_phone' => 'nullable|string|max:20',
            'webhook_url' => ['nullable', 'url', 'max:500', function ($attribute, $value, $fail) {
                $host = parse_url($value, PHP_URL_HOST);
                if ($host && !filter_var(gethostbyname($host), FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                    $fail('URL não pode apontar para IP privado ou reservado.');
                }
            }],
            'callbackUrl' => ['nullable', 'url', 'max:500', function ($attribute, $value, $fail) {
                $host = parse_url($value, PHP_URL_HOST);
                if ($host && !filter_var(gethostbyname($host), FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                    $fail('URL não pode apontar para IP privado ou reservado.');
                }
            }],
        ];
    }

    public function messages(): array
    {
        $fee = FeeConfig::getActive();

        return [
            'value.required' => 'O valor da cobrança é obrigatório.',
            'value.numeric' => 'O valor deve ser um número.',
            'value.min' => 'O valor mínimo é R$ ' . number_format($fee->minimum_charge, 2, ',', '.'),
            'value.max' => 'O valor máximo é R$ ' . number_format($fee->maximum_charge, 2, ',', '.'),
            'acquirer_id.required' => 'Selecione uma adquirente.',
            'acquirer_id.exists' => 'Adquirente inválida.',
            'customer_email.email' => 'E-mail do cliente inválido.',
        ];
    }
}
