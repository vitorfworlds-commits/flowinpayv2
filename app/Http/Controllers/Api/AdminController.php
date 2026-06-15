<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Charge;
use App\Models\Transaction;
use App\Models\User;
use App\Models\Withdrawal;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminController extends Controller
{
    public function dashboard(): JsonResponse
    {
        $now = now();

        $totalUsers = User::count();
        $activeUsers = User::where('status', 'active')->count();
        $newToday = User::whereDate('created_at', $now->toDateString())->count();
        $newWeek = User::whereBetween('created_at', [$now->copy()->startOfWeek(), $now->copy()->endOfWeek()])->count();
        $newMonth = User::whereMonth('created_at', $now->month)->whereYear('created_at', $now->year)->count();

        $totalRevenue = (float) Charge::where('status', 'paid')->sum('value');
        $totalFees = abs((float) Charge::where('status', 'paid')->sum('fee_value'));
        $totalNet = round($totalRevenue - $totalFees, 2);

        $chargesActive = Charge::whereIn('status', ['active', 'pending'])->count();
        $chargesPaid = Charge::where('status', 'paid')->count();
        $chargesExpired = Charge::where('status', 'expired')->count();

        $withdrawalsPending = Withdrawal::where('status', 'pending')->count();
        $withdrawalsProcessed = Withdrawal::where('status', 'completed')->count();

        $denom = $chargesPaid + $chargesActive;
        $conversionRate = $denom > 0 ? round(($chargesPaid / $denom) * 100, 1) : 0;

        return response()->json([
            'dashboard' => [
                'users' => [
                    'total' => $totalUsers,
                    'active' => $activeUsers,
                    'new_today' => $newToday,
                    'new_week' => $newWeek,
                    'new_month' => $newMonth,
                ],
                'revenue' => [
                    'total' => round($totalRevenue, 2),
                    'fees' => round($totalFees, 2),
                    'net' => $totalNet,
                ],
                'charges' => [
                    'active' => $chargesActive,
                    'paid' => $chargesPaid,
                    'expired' => $chargesExpired,
                ],
                'withdrawals' => [
                    'pending' => $withdrawalsPending,
                    'processed' => $withdrawalsProcessed,
                ],
                'conversion_rate' => $conversionRate,
            ],
        ]);
    }

    public function revenueChart(Request $request): JsonResponse
    {
        $days = (int) $request->input('days', 30);
        $startDate = now()->subDays($days)->startOfDay();

        $data = Charge::where('status', 'paid')
            ->where('created_at', '>=', $startDate)
            ->selectRaw('DATE(created_at) as date, SUM(value) as total')
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->pluck('total', 'date');

        $chart = [];
        for ($i = $days - 1; $i >= 0; $i--) {
            $date = now()->subDays($i)->toDateString();
            $chart[] = [
                'date' => $date,
                'label' => now()->subDays($i)->format('d/m'),
                'value' => round((float) ($data[$date] ?? 0), 2),
            ];
        }

        return response()->json(['chart' => $chart]);
    }

    public function users(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search' => 'nullable|string|max:100',
            'role' => 'nullable|string|in:admin,user',
            'status' => 'nullable|string|in:active,inactive,pending,blocked',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'per_page' => 'nullable|integer|min:1|max:100',
            'sort_by' => 'nullable|string|in:created_at,name,email,balance',
            'sort_dir' => 'nullable|string|in:asc,desc',
        ]);

        $query = User::withCount(['charges', 'withdrawals', 'transactions'])
            ->orderBy($validated['sort_by'] ?? 'created_at', $validated['sort_dir'] ?? 'desc');

        if (!empty($validated['search'])) {
            $search = '%' . addcslashes($validated['search'], '%_') . '%';
            $query->where(function ($q) use ($search) {
                $q->where('name', 'LIKE', $search)
                    ->orWhere('email', 'LIKE', $search)
                    ->orWhere('tax_id', 'LIKE', $search);
            });
        }

        if (!empty($validated['role'])) {
            $query->where('role', $validated['role']);
        }

        if (!empty($validated['status'])) {
            $query->where('status', $validated['status']);
        }

        if (!empty($validated['start_date'])) {
            $query->whereDate('created_at', '>=', $validated['start_date']);
        }
        if (!empty($validated['end_date'])) {
            $query->whereDate('created_at', '<=', $validated['end_date']);
        }

        $perPage = (int) ($validated['per_page'] ?? 15);

        return response()->json($query->paginate($perPage));
    }

    public function userDetail(string $id): JsonResponse
    {
        $user = User::withCount(['charges', 'withdrawals', 'transactions', 'apiKeys'])
            ->with(['kycDocuments' => fn ($q) => $q->latest()->limit(1)])
            ->findOrFail($id);

        return response()->json(['user' => $user]);
    }

    public function blockUser(Request $request, string $id): JsonResponse
    {
        $user = User::findOrFail($id);

        if ($user->role === 'admin') {
            return response()->json(['message' => 'Não é possível bloquear um administrador'], 422);
        }

        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'Não é possível bloquear sua própria conta'], 422);
        }

        if ($user->status === 'blocked') {
            return response()->json(['message' => 'Usuário já está bloqueado'], 422);
        }

        $oldStatus = $user->status;
        $user->update(['status' => 'blocked']);

        AuditLog::log('user_blocked', $user, ['status' => $oldStatus], ['status' => 'blocked']);

        return response()->json([
            'user' => $user->fresh(),
            'message' => 'Usuário bloqueado com sucesso',
        ]);
    }

    public function unblockUser(Request $request, string $id): JsonResponse
    {
        $user = User::findOrFail($id);

        if ($user->status !== 'blocked') {
            return response()->json(['message' => 'Usuário não está bloqueado'], 422);
        }

        $user->update(['status' => 'active']);

        AuditLog::log('user_unblocked', $user, ['status' => 'blocked'], ['status' => 'active']);

        $user->tokens()->delete();

        return response()->json([
            'user' => $user->fresh(),
            'message' => 'Usuário desbloqueado com sucesso',
        ]);
    }

    public function adjustBalance(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|not_in:0',
            'reason' => 'required|string|max:500',
        ]);

        $amount = (float) $validated['amount'];
        $reason = $validated['reason'];

        try {
            $result = DB::transaction(function () use ($id, $amount, $reason) {
                $user = User::lockForUpdate()->findOrFail($id);
                $balanceBefore = (float) $user->balance;
                $newBalance = round($balanceBefore + $amount, 2);

                if ($newBalance < 0) {
                    throw new \InvalidArgumentException('Saldo resultante não pode ser negativo');
                }

                $user->forceFill(['balance' => $newBalance])->save();

                $transaction = Transaction::create([
                    'user_id' => $user->id,
                    'type' => 'adjustment',
                    'amount' => $amount,
                    'balance_before' => $balanceBefore,
                    'balance_after' => $newBalance,
                    'reference_type' => User::class,
                    'reference_id' => $user->id,
                    'description' => "Ajuste administrativo: {$reason}",
                ]);

                AuditLog::log('balance_adjusted', $user,
                    ['balance' => $balanceBefore],
                    ['balance' => $newBalance, 'amount' => $amount, 'reason' => $reason]
                );

                return ['user' => $user->fresh(), 'transaction' => $transaction];
            });

            return response()->json([
                'user' => $result['user'],
                'transaction' => $result['transaction'],
                'message' => 'Saldo ajustado com sucesso',
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function userCharges(Request $request, string $id): JsonResponse
    {
        $user = User::findOrFail($id);
        $query = $user->charges()->with('acquirer')->orderBy('created_at', 'desc');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('search')) {
            $s = '%' . $request->search . '%';
            $query->where(fn ($q) => $q->where('description', 'like', $s)->orWhere('correlation_id', 'like', $s));
        }

        return response()->json($query->paginate(15));
    }

    public function userTransactions(Request $request, string $id): JsonResponse
    {
        $user = User::findOrFail($id);
        $query = $user->transactions()->orderBy('created_at', 'desc');

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        return response()->json($query->paginate(15));
    }

    public function userWithdrawals(Request $request, string $id): JsonResponse
    {
        $user = User::findOrFail($id);
        $query = $user->withdrawals()->with('acquirer')->orderBy('created_at', 'desc');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        return response()->json($query->paginate(15));
    }

    public function auditLogs(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'action' => 'nullable|string|max:50',
            'user_id' => 'nullable|integer|exists:users,id',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'per_page' => 'nullable|integer|min:1|max:100',
        ]);

        $query = AuditLog::with('user:id,name,email')->orderBy('created_at', 'desc');

        if (!empty($validated['action'])) {
            $query->where('action', $validated['action']);
        }
        if (!empty($validated['user_id'])) {
            $query->where('user_id', $validated['user_id']);
        }
        if (!empty($validated['start_date'])) {
            $query->whereDate('created_at', '>=', $validated['start_date']);
        }
        if (!empty($validated['end_date'])) {
            $query->whereDate('created_at', '<=', $validated['end_date']);
        }

        return response()->json($query->paginate($validated['per_page'] ?? 20));
    }
}
