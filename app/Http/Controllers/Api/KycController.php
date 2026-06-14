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
    private const ALLOWED_TYPES = ['rg_frente', 'rg_verso', 'selfie'];
    private const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'application/pdf'];
    private const MAX_SIZE = 5 * 1024 * 1024; // 5MB

    public function index(Request $request): JsonResponse
    {
        $documents = $request->user()
            ->kycDocuments()
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['documents' => $documents]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'document_type' => 'required|string|in:' . implode(',', self::ALLOWED_TYPES),
            'file' => 'required|file|max:' . (self::MAX_SIZE / 1024),
        ]);

        $file = $request->file('file');
        $mime = $file->getMimeType();

        if (!in_array($mime, self::ALLOWED_MIMES)) {
            return response()->json([
                'message' => 'Tipo de arquivo não permitido. Envie JPG, PNG ou PDF.',
            ], 422);
        }

        $user = $request->user();

        // Verificar se já tem documento pendente do mesmo tipo
        $existing = KycDocument::where('user_id', $user->id)
            ->where('document_type', $validated['document_type'])
            ->where('status', 'pending')
            ->first();

        if ($existing) {
            return response()->json([
                'message' => 'Você já enviou um documento deste tipo que está em análise.',
            ], 422);
        }

        $path = $file->store("kyc/{$user->id}", 'local');

        $document = KycDocument::create([
            'user_id' => $user->id,
            'document_type' => $validated['document_type'],
            'file_path' => $path,
            'original_name' => $file->getClientOriginalName(),
            'mime_type' => $mime,
            'file_size' => $file->getSize(),
            'status' => 'pending',
        ]);

        Log::info('KYC document uploaded', [
            'user_id' => $user->id,
            'document_type' => $validated['document_type'],
            'document_id' => $document->id,
        ]);

        return response()->json([
            'message' => 'Documento enviado com sucesso. Entraremos em contato após a análise.',
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
                'message' => 'Não é possível remover um documento já analisado.',
            ], 422);
        }

        Storage::disk('local')->delete($document->file_path);
        $document->delete();

        return response()->json(['message' => 'Documento removido com sucesso.']);
    }
}
