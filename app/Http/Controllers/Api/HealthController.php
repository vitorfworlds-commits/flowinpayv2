<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Acquirer;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class HealthController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $checks = [];

        // Database
        try {
            DB::select('SELECT 1');
            $checks['database'] = 'ok';
        } catch (\Exception $e) {
            $checks['database'] = 'error: connection failed';
        }

        // Acquirers
        $activeAcquirers = Acquirer::where('is_active', true)->count();
        $checks['acquirers'] = $activeAcquirers > 0 ? "ok ({$activeAcquirers} active)" : 'warning: no active acquirers';

        $status = in_array('error', array_map(function ($v) {
            return str_starts_with($v, 'error') ? 'error' : $v;
        }, $checks)) ? 503 : 200;

        return response()->json([
            'status' => $status === 200 ? 'healthy' : 'unhealthy',
            'version' => '1.0.0',
            'timestamp' => now()->toIso8601String(),
            'checks' => $checks,
        ], $status);
    }
}
