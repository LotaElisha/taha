<?php

namespace App\Http\Controllers\Api\Admin;

use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;

/**
 * AdminStatsController — aggregated platform metrics for the admin overview.
 * Gated to Admin|SuperAdmin|FinancialAuditor in routes/api.php.
 */
class AdminStatsController extends Controller
{
    public function overview(Request $request): JsonResponse
    {
        $range = $request->query('range', '30d'); // 7d | 30d | all

        $since = match ($range) {
            '7d'  => now()->subDays(7),
            'all' => null,
            default => now()->subDays(30),
        };

        // ── Revenue & orders ──────────────────────────────────────────────
        $ordersQ = Order::query();
        if ($since) $ordersQ->where('created_at', '>=', $since);

        $totals = (clone $ordersQ)->selectRaw('
            COUNT(*)            AS total_orders,
            COALESCE(SUM(total),0) AS total_revenue,
            COALESCE(AVG(total),0) AS avg_order_value
        ')->first();

        // ── Users ────────────────────────────────────────────────────────
        $totalUsers    = User::count();
        $totalFarmers  = User::where('role', 'Farmer')->count();
        $totalVendors  = User::whereIn('role', ['Agrodealer', 'Agrovet'])->count();
        $pendingKyc    = User::where('kyc_status', 'Pending')->count();

        // ── Products ─────────────────────────────────────────────────────
        $totalProducts   = Product::count();
        $lowStockCount   = Product::where('stock', '<', 10)->where('stock', '>', 0)->count();
        $outOfStockCount = Product::where('stock', 0)->count();

        // ── Sales over time (daily buckets for the chart) ─────────────
        $salesByDay = (clone $ordersQ)
            ->selectRaw("DATE(created_at) AS day, COUNT(*) AS orders, COALESCE(SUM(total),0) AS revenue")
            ->groupBy('day')
            ->orderBy('day')
            ->get()
            ->map(fn($r) => [
                'date'    => $r->day,
                'orders'  => (int) $r->orders,
                'revenue' => (float) $r->revenue,
            ]);

        // ── Top products by units sold ────────────────────────────────
        $topProducts = DB::table('order_items AS oi')
            ->join('orders AS o', 'o.id', '=', 'oi.order_id')
            ->when($since, fn($q) => $q->where('o.created_at', '>=', $since))
            ->selectRaw('oi.product_name, SUM(oi.quantity) AS units, SUM(oi.line_total) AS revenue')
            ->groupBy('oi.product_name')
            ->orderByDesc('units')
            ->limit(8)
            ->get();

        // ── Top vendors by revenue ────────────────────────────────────
        $topVendors = DB::table('order_items AS oi')
            ->join('orders AS o', 'o.id', '=', 'oi.order_id')
            ->join('users AS v', 'v.id', '=', 'oi.vendor_id')
            ->when($since, fn($q) => $q->where('o.created_at', '>=', $since))
            ->selectRaw('v.name AS vendor_name, SUM(oi.line_total) AS revenue, COUNT(DISTINCT o.id) AS orders')
            ->groupBy('v.id', 'v.name')
            ->orderByDesc('revenue')
            ->limit(8)
            ->get();

        // ── Orders by status ─────────────────────────────────────────
        $byStatus = (clone $ordersQ)
            ->selectRaw('status, COUNT(*) AS cnt')
            ->groupBy('status')
            ->pluck('cnt', 'status');

        // ── Revenue by payment method ─────────────────────────────────
        $byPayment = (clone $ordersQ)
            ->selectRaw('payment_method_id, COUNT(*) AS cnt, COALESCE(SUM(total),0) AS revenue')
            ->groupBy('payment_method_id')
            ->get()
            ->map(fn($r) => [
                'method'  => $r->payment_method_id,
                'orders'  => (int) $r->cnt,
                'revenue' => (float) $r->revenue,
            ]);

        return response()->json([
            'range'         => $range,
            'total_orders'  => (int)   $totals->total_orders,
            'total_revenue' => (float) $totals->total_revenue,
            'avg_order_value' => (float) $totals->avg_order_value,
            'total_users'   => $totalUsers,
            'total_farmers' => $totalFarmers,
            'total_vendors' => $totalVendors,
            'pending_kyc'   => $pendingKyc,
            'total_products'    => $totalProducts,
            'low_stock_count'   => $lowStockCount,
            'out_of_stock_count'=> $outOfStockCount,
            'sales_by_day'  => $salesByDay,
            'top_products'  => $topProducts,
            'top_vendors'   => $topVendors,
            'orders_by_status'  => $byStatus,
            'revenue_by_payment'=> $byPayment,
        ]);
    }

    /** Paginated orders list for the admin orders tab. */
    public function orders(Request $request): JsonResponse
    {
        $orders = Order::with(['user:id,name,phone', 'items'])
            ->when($request->query('status'), fn($q, $s) => $q->where('status', $s))
            ->latest()
            ->paginate(25);

        return response()->json($orders);
    }

    /** Paginated users list. */
    public function users(Request $request): JsonResponse
    {
        $users = User::query()
            ->when($request->query('role'), function ($q, $r) {
                if ($r === 'Vendor') {
                    return $q->whereIn('role', ['Agrodealer', 'Agrovet']);
                }
                if ($r === 'Staff') {
                    return $q->whereIn('role', ['Admin', 'SuperAdmin', 'KYCOfficer', 'CatalogManager', 'SupportAgent', 'FinancialAuditor']);
                }
                return $q->where('role', $r);
            })
            ->when($request->query('kyc'),  fn($q, $k) => $q->where('kyc_status', $k))
            ->when($request->query('q'),    fn($q, $s) => $q->where(fn($sub) =>
                $sub->where('name', 'ilike', "%{$s}%")
                    ->orWhere('email', 'ilike', "%{$s}%")
                    ->orWhere('phone', 'ilike', "%{$s}%")
            ))
            ->latest()
            ->paginate(30);

        return response()->json($users);
    }

    /** Paginated products list. */
    public function products(Request $request): JsonResponse
    {
        $products = Product::with('vendor:id,name')
            ->when($request->query('category'), fn($q, $c) => $q->where('category', $c))
            ->when($request->query('q'),        fn($q, $s) => $q->where('name', 'ilike', "%{$s}%"))
            ->latest()
            ->paginate(30);

        return response()->json($products);
    }

    /** Paginated audit logs. */
    public function auditLogs(Request $request): JsonResponse
    {
        $logs = DB::table('activity_log AS al')
            ->leftJoin('users AS u', 'u.id', '=', 'al.causer_id')
            ->select('al.*', 'u.name AS causer_name', 'u.role AS causer_role')
            ->orderBy('al.id', 'desc')
            ->paginate(40);

        return response()->json($logs);
    }
}
