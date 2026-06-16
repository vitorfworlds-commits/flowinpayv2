<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class TransactionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => 'nullable|string|in:charge_received,charge_fee,withdrawal,withdrawal_fee,refund,adjustment',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'min_amount' => 'nullable|numeric|min:0',
            'max_amount' => 'nullable|numeric|min:0',
            'search' => 'nullable|string|max:100',
            'per_page' => 'nullable|integer|min:1|max:200',
        ]);

        $query = $request->user()->transactions();

        if (!empty($validated['type'])) {
            $query->where('type', $validated['type']);
        }

        if (!empty($validated['start_date'])) {
            $query->where('created_at', '>=', $validated['start_date']);
        }

        if (!empty($validated['end_date'])) {
            $query->where('created_at', '<=', $validated['end_date'] . ' 23:59:59');
        }

        if (isset($validated['min_amount'])) {
            $query->where('amount', '>=', $validated['min_amount']);
        }

        if (isset($validated['max_amount'])) {
            $query->where('amount', '<=', $validated['max_amount']);
        }

        if (!empty($validated['search'])) {
            $search = str_replace(['%', '_'], ['\\%', '\\_'], $validated['search']);
            $query->where(function ($q) use ($search) {
                $q->where('description', 'LIKE', "%{$search}%")
                  ->orWhere('type', 'LIKE', "%{$search}%");
            });
        }

        $perPage = (int) ($validated['per_page'] ?? 15);
        $transactions = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json($transactions);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $transaction = $request->user()
            ->transactions()
            ->findOrFail($id);

        return response()->json([
            'transaction' => $transaction,
        ]);
    }

    public function balance(Request $request): JsonResponse
    {
        $user = $request->user();

        $balance = (float) $user->balance;
        $blocked = (float) $user->balance_blocked;

        return response()->json([
            'balance' => [
                'available' => round($balance - $blocked, 2),
                'blocked' => $blocked,
                'total' => $balance,
            ],
        ]);
    }

    public function summary(Request $request): JsonResponse
    {
        $user = $request->user();
        $now = now();

        // Hoje
        $todayReceived = $user->transactions()
            ->where('type', 'charge_received')
            ->whereDate('created_at', $now->toDateString())
            ->sum('amount');

        $todayFees = $user->transactions()
            ->where('type', 'charge_fee')
            ->whereDate('created_at', $now->toDateString())
            ->sum('amount');

        $todayWithdrawals = $user->transactions()
            ->where('type', 'withdrawal')
            ->whereDate('created_at', $now->toDateString())
            ->sum('amount');

        // Semana
        $weekReceived = $user->transactions()
            ->where('type', 'charge_received')
            ->whereBetween('created_at', [$now->copy()->startOfWeek(), $now->copy()->endOfWeek()])
            ->sum('amount');

        // Mês
        $monthReceived = $user->transactions()
            ->where('type', 'charge_received')
            ->whereMonth('created_at', $now->month)
            ->whereYear('created_at', $now->year)
            ->sum('amount');

        $monthFees = $user->transactions()
            ->where('type', 'charge_fee')
            ->whereMonth('created_at', $now->month)
            ->whereYear('created_at', $now->year)
            ->sum('amount');

        // Contadores
        $totalCharges = $user->charges()->count();
        $paidCharges = $user->charges()->where('status', 'paid')->count();
        $pendingCharges = $user->charges()->where('status', 'active')->count();
        $totalWithdrawals = $user->withdrawals()->count();

        // Taxa de conversão = paid / (paid + pending) * 100
        $denominator = $paidCharges + $pendingCharges;
        $conversionRate = $denominator > 0 ? round(($paidCharges / $denominator) * 100, 1) : 0;

        return response()->json([
            'summary' => [
                'today' => [
                    'received' => round((float) $todayReceived, 2),
                    'fees' => round(abs((float) $todayFees), 2),
                    'net' => round((float) $todayReceived + (float) $todayFees, 2),
                    'withdrawals' => round(abs((float) $todayWithdrawals), 2),
                ],
                'week' => [
                    'received' => round((float) $weekReceived, 2),
                ],
                'month' => [
                    'received' => round((float) $monthReceived, 2),
                    'fees' => round(abs((float) $monthFees), 2),
                    'net' => round((float) $monthReceived + (float) $monthFees, 2),
                ],
                'counts' => [
                    'total_charges' => $totalCharges,
                    'paid_charges' => $paidCharges,
                    'pending_charges' => $pendingCharges,
                    'total_withdrawals' => $totalWithdrawals,
                    'conversion_rate' => $conversionRate,
                ],
            ],
        ]);
    }

    public function export(Request $request): StreamedResponse
    {
        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'type' => 'nullable|string|in:charge_received,charge_fee,withdrawal,withdrawal_fee,refund,adjustment',
        ]);

        $query = $request->user()->transactions()
            ->whereBetween('created_at', [
                $request->start_date . ' 00:00:00',
                $request->end_date . ' 23:59:59',
            ]);

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        $transactions = $query->orderBy('created_at', 'desc')->limit(10000)->get();

        $typeLabels = [
            'charge_received' => 'Pagamento Recebido',
            'charge_fee' => 'Taxa Cobrança',
            'withdrawal' => 'Saque',
            'withdrawal_fee' => 'Taxa Saque',
            'refund' => 'Reembolso',
            'adjustment' => 'Ajuste',
        ];

        $filename = "extrato_{$request->start_date}_{$request->end_date}.csv";

        // Neutraliza CSV/formula injection: células que começam com = + - @ (ou TAB/CR)
        // são prefixadas com aspa simples pra o Excel/Sheets não interpretar como fórmula.
        $csvSafe = function (?string $value): string {
            $value = (string) $value;
            if ($value !== '' && in_array($value[0], ['=', '+', '-', '@', "\t", "\r"], true)) {
                return "'" . $value;
            }
            return $value;
        };

        return response()->stream(function () use ($transactions, $typeLabels, $csvSafe) {
            $handle = fopen('php://output', 'w');

            // BOM pra Excel abrir corretamente com UTF-8
            fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF));

            // Header
            fputcsv($handle, ['Data', 'Tipo', 'Descrição', 'Valor', 'Saldo Anterior', 'Saldo Posterior'], ';');

            foreach ($transactions as $t) {
                fputcsv($handle, [
                    $t->created_at->format('d/m/Y H:i:s'),
                    $csvSafe($typeLabels[$t->type] ?? $t->type),
                    $csvSafe($t->description ?? ''),
                    number_format($t->amount, 2, ',', '.'),
                    number_format($t->balance_before, 2, ',', '.'),
                    number_format($t->balance_after, 2, ',', '.'),
                ], ';');
            }

            fclose($handle);
        }, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }
}
