<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FeeConfig;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FeeConfigController extends Controller
{
    public function index(): JsonResponse
    {
        $fees = FeeConfig::orderBy('created_at', 'desc')->get();

        return response()->json([
            'fees' => $fees,
        ]);
    }

    public function show(string $id): JsonResponse
    {
        $fee = FeeConfig::findOrFail($id);

        return response()->json([
            'fee' => $fee,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'percentual' => 'required|numeric|min:0|max:100',
            'fixed_value' => 'required|numeric|min:0',
            'withdrawal_fee' => 'required|numeric|min:0',
            'minimum_charge' => 'required|numeric|min:0',
            'maximum_charge' => 'required|numeric|min:0|gte:minimum_charge',
            'minimum_withdrawal' => 'required|numeric|min:0',
            'maximum_withdrawal' => 'required|numeric|min:0|gte:minimum_withdrawal',
            'is_active' => 'boolean',
        ]);

        // Se ativar esta config, desativar as outras
        if ($validated['is_active'] ?? false) {
            FeeConfig::where('is_active', true)->update(['is_active' => false]);
        }

        $fee = FeeConfig::create($validated);

        return response()->json([
            'fee' => $fee,
            'message' => 'Configuração de taxas criada com sucesso',
        ], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $fee = FeeConfig::findOrFail($id);

        $validated = $request->validate([
            'percentual' => 'sometimes|numeric|min:0|max:100',
            'fixed_value' => 'sometimes|numeric|min:0',
            'withdrawal_fee' => 'sometimes|numeric|min:0',
            'minimum_charge' => 'sometimes|numeric|min:0',
            'maximum_charge' => 'sometimes|numeric|min:0',
            'is_active' => 'boolean',
        ]);

        // Cross-field: maximum_charge must be >= minimum_charge
        $effectiveMin = $validated['minimum_charge'] ?? $fee->minimum_charge;
        $effectiveMax = $validated['maximum_charge'] ?? $fee->maximum_charge;
        if ($effectiveMax < $effectiveMin) {
            return response()->json([
                'message' => 'O valor máximo da cobrança deve ser maior ou igual ao mínimo.',
            ], 422);
        }

        // Se ativar esta config, desativar as outras
        if (isset($validated['is_active']) && $validated['is_active']) {
            FeeConfig::where('is_active', true)->where('id', '!=', $id)->update(['is_active' => false]);
        }

        $fee->update($validated);

        return response()->json([
            'fee' => $fee->fresh(),
            'message' => 'Configuração de taxas atualizada com sucesso',
        ]);
    }

    public function current(): JsonResponse
    {
        $fee = FeeConfig::getActive();

        return response()->json([
            'fee' => $fee,
        ]);
    }
}
