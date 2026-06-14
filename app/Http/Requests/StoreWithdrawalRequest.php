<?php

namespace App\Http\Requests;

use App\Models\FeeConfig;
use Illuminate\Foundation\Http\FormRequest;

class StoreWithdrawalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $fee = FeeConfig::getActive();

        return [
            'value' => 'required|numeric|min:' . $fee->minimum_withdrawal . '|max:' . $fee->maximum_withdrawal,
            'pix_key' => 'required|string|max:255',
            'pix_key_type' => 'required|in:cpf,cnpj,email,phone,random',
            'acquirer_id' => 'nullable|exists:acquirers,id',
            'description' => 'nullable|string|max:255',
        ];
    }

    public function messages(): array
    {
        $fee = FeeConfig::getActive();

        return [
            'value.required' => 'O valor do saque é obrigatório.',
            'value.numeric' => 'O valor deve ser um número.',
            'value.min' => 'O valor mínimo do saque é R$ ' . number_format($fee->minimum_withdrawal, 2, ',', '.') . '.',
            'value.max' => 'O valor máximo do saque é R$ ' . number_format($fee->maximum_withdrawal, 2, ',', '.') . '.',
            'pix_key.required' => 'A chave Pix é obrigatória.',
            'pix_key.max' => 'A chave Pix não pode ter mais de 255 caracteres.',
            'pix_key_type.required' => 'O tipo da chave Pix é obrigatório.',
            'pix_key_type.in' => 'Tipo de chave Pix inválido. Opções: cpf, cnpj, email, phone, random.',
            'acquirer_id.required' => 'Selecione uma adquirente.',
            'acquirer_id.exists' => 'Adquirente inválida.',
        ];
    }
}
