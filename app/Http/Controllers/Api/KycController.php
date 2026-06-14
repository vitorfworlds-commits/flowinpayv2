<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\KycDocument;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class KycController extends Controller
{
    private const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'application/pdf'];
    private const MAX_SIZE = 5 * 1024 * 1024; // 5MB

    public function index(Request $request): JsonResponse
    {
        $document = $request->user()
            ->kycDocuments()
            ->latest()
            ->first();

        return response()->json(['document' => $document]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'rg_frente' => 'required|file|max:' . (self::MAX_SIZE / 1024),
            'rg_verso' => 'required|file|max:' . (self::MAX_SIZE / 1024),
            'selfie' => 'required|file|max:' . (self::MAX_SIZE / 1024),
        ]);

        $user = $request->user();

        // Verificar se já tem submission pendente
        $existing = KycDocument::where('user_id', $user->id)
            ->where('status', 'pending')
            ->first();

        if ($existing) {
            return response()->json([
                'message' => 'Você já enviou documentos que estão em análise.',
            ], 422);
        }

        // Validar MIME types
        foreach (['rg_frente', 'rg_verso', 'selfie'] as $field) {
            $file = $request->file($field);
            if (!in_array($file->getMimeType(), self::ALLOWED_MIMES)) {
                return response()->json([
                    'message' => ucfirst(str_replace('_', ' ', $field)) . ': tipo não permitido. Envie JPG, PNG ou PDF.',
                ], 422);
            }
        }

        $userId = $user->id;
        $data = ['user_id' => $userId, 'status' => 'pending'];

        foreach (['rg_frente', 'rg_verso', 'selfie'] as $field) {
            $file = $request->file($field);
            $path = $file->store("kyc/{$userId}", 'local');
            $data["{$field}_path"] = $path;
            $data["{$field}_name"] = $file->getClientOriginalName();
        }

        $document = KycDocument::create($data);

        Log::info('KYC documents uploaded', [
            'user_id' => $userId,
            'document_id' => $document->id,
        ]);

        return response()->json([
            'message' => 'Documentos enviados com sucesso. Entraremos em contato após a análise.',
            'document' => $document,
        ], 201);
    }

    public function show(Request $request, KycDocument $document): JsonResponse
    {
        if ($document->user_id !== $request->user()->id && $request->user()->role !== 'admin') {
            return response()->json(['message' => 'Não autorizado'], 403);
        }

        return response()->json(['document' => $document]);
    }

    public function destroy(Request $request, KycDocument $document): JsonResponse
    {
        if ($document->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Não autorizado'], 403);
        }

        if (!$document->isPending()) {
            return response()->json([
                'message' => 'Não é possível remover documentos já analisados.',
            ], 422);
        }

        // Deletar arquivos do storage
        foreach (['rg_frente_path', 'rg_verso_path', 'selfie_path'] as $field) {
            if ($document->$field) {
                Storage::disk('local')->delete($document->$field);
            }
        }

        $document->delete();

        return response()->json(['message' => 'Documentos removidos com sucesso.']);
    }
}
