import * as React from "react";
import {
  Routes,
  Route,
  useLocation,
  useNavigate,
  Navigate,
} from "react-router-dom";
import {
  Product,
  Order,
  Agrodealer,
  Agrovet,
  PaymentGatewayConfig,
  LogisticsBooking,
  Tool,
  ToolBooking,
} from "../../types";
import { AppShell, AppBar } from "../../components/app-shell";
import { OfflineBanner } from "../../components/feedback/OfflineBanner";
import { Badge } from "../../components/ui/badge";
import { useUser } from "../../context/UserContext";
import { useAuth } from "../../context/AuthContext";
import { AdminKycQueue } from "./AdminKycQueue";
import { AdminPayouts } from "./AdminPayouts";
import { AdminDisputes } from "./AdminDisputes";
import { AdminRefunds } from "./AdminRefunds";
import { AdminUsers } from "./AdminUsers";
import { AdminCatalog } from "./AdminCatalog";
import { AdminOrders } from "./AdminOrders";
import { AdminAuditLog } from "./AdminAuditLog";
import { cn, formatTZS } from "../../lib/utils";
import { apiFetch } from "../../lib/apiClient";

interface AdminSurfaceProps {
  products: Product[];
  setProducts: (next: Product[] | ((prev: Product[]) => Product[])) => void;
  orders: Order[];
  setOrders: (next: Order[] | ((prev: Order[]) => Order[])) => void;
  vendors: (Agrodealer | Agrovet)[];
  paymentGateways: PaymentGatewayConfig[];
  setPaymentGateways: (gateways: PaymentGatewayConfig[]) => void;
  logisticsBookings: LogisticsBooking[];
  setLogisticsBookings: (
    next: LogisticsBooking[] | ((prev: LogisticsBooking[]) => LogisticsBooking[])
  ) => void;
  tools: Tool[];
  setTools: (next: Tool[] | ((prev: Tool[]) => Tool[])) => void;
  toolBookings: ToolBooking[];
}

interface NavLinkSpec {
  to: string;
  label: string;
  icon: React.ReactNode;
}

/**
 * AdminSurface — `/admin/*`. Sidebar-first because admin work is desk work.
 * Mobile collapses the sidebar to a top sheet.
 */
export function AdminSurface(p: AdminSurfaceProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { users } = useUser();
  const { logout } = useAuth();

  const pendingKyc = users.filter((u) => u.kycStatus === "Pending").length;

  // Three badge counters polled together — failed payouts, failed refunds,
  // active disputes. One interval, one Promise.allSettled so a 403 on a
  // route the operator's role can't see (e.g. SupportAgent on payouts)
  // doesn't take down the others.
  const [failedPayouts, setFailedPayouts] = React.useState<number>(0);
  const [failedRefunds, setFailedRefunds] = React.useState<number>(0);
  const [openDisputes, setOpenDisputes] = React.useState<number>(0);
  React.useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      const results = await Promise.allSettled([
        apiFetch<{ total: number }>("/api/v1/admin/payouts?status=Failed"),
        apiFetch<{ total: number }>("/api/v1/admin/refunds?status=Failed"),
        apiFetch<{ total: number }>("/api/v1/admin/disputes"),
      ]);
      if (cancelled) return;
      if (results[0].status === "fulfilled") setFailedPayouts(results[0].value.total ?? 0);
      if (results[1].status === "fulfilled") setFailedRefunds(results[1].value.total ?? 0);
      if (results[2].status === "fulfilled") setOpenDisputes(results[2].value.total ?? 0);
    };
    tick();
    const t = setInterval(tick, 30_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  const links: NavLinkSpec[] = [
    { to: "/admin", label: "Overview", icon: <DashIcon /> },
    { to: "/admin/kyc", label: "KYC queue", icon: <ShieldIcon /> },
    { to: "/admin/disputes", label: "Disputes", icon: <FlagIcon /> },
    { to: "/admin/refunds", label: "Refunds", icon: <RotateIcon /> },
    { to: "/admin/payouts", label: "Payouts", icon: <CashIcon /> },
    { to: "/admin/users", label: "Users", icon: <UsersIcon /> },
    { to: "/admin/catalog", label: "Catalog", icon: <BoxIcon /> },
    { to: "/admin/orders", label: "Orders", icon: <ListIcon /> },
    { to: "/admin/audit", label: "Audit log", icon: <FileIcon /> },
  ];

  return (
    <AppShell
      appBar={
        <AppBar
          leading={
            <button
              type="button"
              onClick={() => navigate("/admin")}
              className="flex items-center gap-2 px-1"
              aria-label="Admin"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-900 text-white">
                <ShieldIcon />
              </span>
              <span className="text-base font-semibold text-fg">Mkulima Admin</span>
            </button>
          }
          trailing={
            <button
              type="button"
              onClick={logout}
              className="text-xs font-medium text-muted hover:text-fg"
            >
              Sign out
            </button>
          }
        />
      }
      sidebar={
        <nav className="flex h-full flex-col gap-1 p-3">
          {links.map((l) => {
            const active =
              location.pathname === l.to ||
              (l.to !== "/admin" && location.pathname.startsWith(l.to));
            return (
              <button
                key={l.to}
                type="button"
                onClick={() => navigate(l.to)}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium transition-colors",
                  active
                    ? "bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200"
                    : "text-muted hover:bg-surface-2 hover:text-fg"
                )}
              >
                {l.icon}
                <span className="flex-1">{l.label}</span>
                {l.to === "/admin/kyc" && pendingKyc > 0 ? (
                  <Badge variant="warning">{pendingKyc}</Badge>
                ) : null}
                {l.to === "/admin/disputes" && openDisputes > 0 ? (
                  <Badge variant="warning">{openDisputes}</Badge>
                ) : null}
                {l.to === "/admin/refunds" && failedRefunds > 0 ? (
                  <Badge variant="danger">{failedRefunds}</Badge>
                ) : null}
                {l.to === "/admin/payouts" && failedPayouts > 0 ? (
                  <Badge variant="danger">{failedPayouts}</Badge>
                ) : null}
              </button>
            );
          })}
        </nav>
      }
    >
      <OfflineBanner />
      <Routes>
        <Route index element={<Navigate to="/admin" replace />} />
        <Route
          path="admin"
          element={
            <AdminOverview
              orders={p.orders}
              products={p.products}
              vendors={p.vendors}
              pendingKyc={pendingKyc}
            />
          }
        />
        <Route path="admin/kyc" element={<AdminKycQueue />} />
        <Route path="admin/payouts" element={<AdminPayouts />} />
        <Route path="admin/disputes" element={<AdminDisputes />} />
        <Route path="admin/refunds" element={<AdminRefunds />} />
        <Route path="admin/users" element={<AdminUsers />} />
        <Route path="admin/catalog" element={<AdminCatalog />} />
        <Route path="admin/orders" element={<AdminOrders />} />
        <Route path="admin/audit" element={<AdminAuditLog />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </AppShell>
  );
}

/* ----------------------------- Admin overview ----------------------------- */
interface AdminStats {
  range: string;
  total_orders: number;
  total_revenue: number;
  avg_order_value: number;
  total_users: number;
  total_farmers: number;
  total_vendors: number;
  pending_kyc: number;
  total_products: number;
  low_stock_count: number;
  out_of_stock_count: number;
  sales_by_day: { date: string; orders: number; revenue: number }[];
  top_products: { product_name: string; units: number; revenue: number }[];
  top_vendors: { vendor_name: string; revenue: number; orders: number }[];
  orders_by_status: Record<string, number>;
  revenue_by_payment: { method: string; orders: number; revenue: number }[];
}

function AdminOverview({
  pendingKyc,
}: {
  orders: Order[];
  products: Product[];
  vendors: (Agrodealer | Agrovet)[];
  pendingKyc: number;
}) {
  const [stats, setStats] = React.useState<AdminStats | null>(null);
  const [range, setRange] = React.useState<"7d" | "30d" | "all">("30d");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    apiFetch<AdminStats>(`/api/v1/admin/stats?range=${range}`)
      .then((data) => { if (!cancelled) { setStats(data); setLoading(false); } })
      .catch((e) => { if (!cancelled) { setError(e.message || "Failed to load stats."); setLoading(false); } });
    return () => { cancelled = true; };
  }, [range]);

  const kpiEffectivePendingKyc = stats?.pending_kyc ?? pendingKyc;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-fg">Platform Overview</h1>
          <p className="text-sm text-muted">Live metrics from the database.</p>
        </div>
        <div className="flex gap-1.5">
          {(["7d","30d","all"] as const).map((r) => (
            <button key={r} type="button" onClick={() => setRange(r)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-semibold transition-colors",
                range === r
                  ? "bg-brand-600 text-white"
                  : "bg-surface-2 text-muted hover:bg-border hover:text-fg"
              )}>
              {r === "7d" ? "Last 7 Days" : r === "30d" ? "Last 30 Days" : "All Time"}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-danger/10 border border-danger/20 px-4 py-3 text-sm text-danger flex items-center gap-2">
          <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
          {error}
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total Revenue" value={loading ? "—" : formatTZS(stats!.total_revenue)} sub="TZS" icon="💰" trend={null} loading={loading} />
        <StatCard label="Total Orders" value={loading ? "—" : stats!.total_orders.toLocaleString()} sub="orders" icon="📦" trend={null} loading={loading} />
        <StatCard label="Avg Order Value" value={loading ? "—" : formatTZS(stats!.avg_order_value)} sub="per order" icon="📊" trend={null} loading={loading} />
        <StatCard label="Total Users" value={loading ? "—" : stats!.total_users.toLocaleString()} sub={loading ? "" : `${stats!.total_farmers} farmers · ${stats!.total_vendors} vendors`} icon="👥" trend={null} loading={loading} />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Products" value={loading ? "—" : stats!.total_products.toLocaleString()} sub="listed" icon="🌱" trend={null} loading={loading} />
        <StatCard label="Low Stock" value={loading ? "—" : stats!.low_stock_count.toLocaleString()} sub="< 10 units" icon="⚠️" trend={null} loading={loading} accent="warning" />
        <StatCard label="Out of Stock" value={loading ? "—" : stats!.out_of_stock_count.toLocaleString()} sub="products" icon="🚫" trend={null} loading={loading} accent="danger" />
        <StatCard label="KYC Pending" value={loading ? "—" : kpiEffectivePendingKyc.toLocaleString()} sub="reviews due" icon="🛡️" trend={null} loading={loading} accent={kpiEffectivePendingKyc > 0 ? "warning" : undefined} />
      </div>

      {/* Sales trend */}
      <div className="rounded-lg border border-border bg-surface p-4">
        <h2 className="text-sm font-semibold text-fg mb-4">Revenue Over Time</h2>
        {loading ? (
          <div className="h-32 animate-pulse rounded-md bg-surface-2" />
        ) : !stats || stats.sales_by_day.length === 0 ? (
          <p className="text-sm text-muted text-center py-8">No sales data for this period.</p>
        ) : (
          <MiniBarChart data={stats.sales_by_day} />
        )}
      </div>

      {/* Top products + top vendors side by side */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-surface p-4">
          <h2 className="text-sm font-semibold text-fg mb-3">Top Products (Units Sold)</h2>
          {loading ? (
            <div className="space-y-2">{[...Array(5)].map((_,i) => <div key={i} className="h-6 animate-pulse rounded bg-surface-2" />)}</div>
          ) : (stats?.top_products.length ?? 0) === 0 ? (
            <p className="text-sm text-muted">No data available.</p>
          ) : (
            <ol className="space-y-2">
              {stats!.top_products.map((p, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-100 text-brand-700 text-[10px] font-bold flex-shrink-0">{i + 1}</span>
                  <span className="flex-1 truncate text-fg">{p.product_name}</span>
                  <span className="tabular text-muted font-medium">{p.units.toLocaleString()} u</span>
                  <span className="tabular text-xs text-muted">{formatTZS(p.revenue)}</span>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="rounded-lg border border-border bg-surface p-4">
          <h2 className="text-sm font-semibold text-fg mb-3">Top Vendors (Revenue)</h2>
          {loading ? (
            <div className="space-y-2">{[...Array(5)].map((_,i) => <div key={i} className="h-6 animate-pulse rounded bg-surface-2" />)}</div>
          ) : (stats?.top_vendors.length ?? 0) === 0 ? (
            <p className="text-sm text-muted">No data available.</p>
          ) : (
            <ol className="space-y-2">
              {stats!.top_vendors.map((v, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-harvest-100 text-harvest-700 text-[10px] font-bold flex-shrink-0">{i + 1}</span>
                  <span className="flex-1 truncate text-fg">{v.vendor_name}</span>
                  <span className="tabular text-xs text-muted">{v.orders} orders</span>
                  <span className="tabular text-muted font-medium">{formatTZS(v.revenue)}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      {/* Orders by status */}
      {!loading && stats && Object.keys(stats.orders_by_status).length > 0 && (
        <div className="rounded-lg border border-border bg-surface p-4">
          <h2 className="text-sm font-semibold text-fg mb-3">Orders by Status</h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.orders_by_status).map(([status, cnt]) => (
              <div key={status} className="flex items-center gap-2 rounded-md bg-surface-2 px-3 py-2">
                <span className={cn("h-2 w-2 rounded-full", statusColor(status))} />
                <span className="text-xs font-medium text-fg">{status}</span>
                <span className="tabular text-xs text-muted">{cnt}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function statusColor(s: string) {
  return s === "Completed" ? "bg-success" :
    s === "Delivered" ? "bg-brand-500" :
    s === "Shipped" ? "bg-info" :
    s === "Processing" ? "bg-warning" :
    s === "Cancelled" ? "bg-danger" : "bg-border";
}

function StatCard({ label, value, sub, icon, loading, accent }: {
  label: string; value: string; sub: string | null; icon: string;
  trend: null; loading: boolean; accent?: "warning" | "danger";
}) {
  return (
    <div className={cn(
      "rounded-lg border bg-surface p-4 space-y-1",
      accent === "warning" ? "border-warning/30 bg-warning/5" :
      accent === "danger" ? "border-danger/30 bg-danger/5" : "border-border"
    )}>
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted">{label}</p>
        <span className="text-base leading-none">{icon}</span>
      </div>
      {loading ? (
        <div className="h-7 w-24 animate-pulse rounded bg-surface-2" />
      ) : (
        <p className="text-2xl font-bold tabular text-fg leading-none">{value}</p>
      )}
      {sub && <p className="text-[11px] text-muted truncate">{sub}</p>}
    </div>
  );
}

/** Tiny inline SVG bar chart — no external library needed. */
function MiniBarChart({ data }: { data: { date: string; revenue: number }[] }) {
  const max = Math.max(...data.map((d) => d.revenue), 1);
  return (
    <div className="relative h-32 flex items-end gap-px">
      {data.map((d, i) => {
        const pct = (d.revenue / max) * 100;
        return (
          <div key={i} className="group relative flex-1 flex flex-col justify-end" title={`${d.date}: ${formatTZS(d.revenue)}`}>
            <div
              className="w-full rounded-t bg-brand-500/70 group-hover:bg-brand-500 transition-all"
              style={{ height: `${Math.max(pct, 2)}%` }}
            />
            {/* Tooltip */}
            <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block z-10 whitespace-nowrap rounded bg-fg px-2 py-1 text-[10px] text-bg shadow">
              {d.date}<br />{formatTZS(d.revenue)}
            </div>
          </div>
        );
      })}
      {/* Y axis labels */}
      <div className="absolute left-0 top-0 text-[9px] text-muted">{formatTZS(max)}</div>
      <div className="absolute left-0 bottom-0 text-[9px] text-muted">0</div>
    </div>
  );
}

/* --------------------------------- icons --------------------------------- */
function DashIcon() { return (<svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" /></svg>); }
function ShieldIcon() { return (<svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></svg>); }
function UsersIcon() { return (<svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>); }
function BoxIcon() { return (<svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /></svg>); }
function ListIcon() { return (<svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M8 6h13M8 12h13M8 18h13" /></svg>); }
function CashIcon() { return (<svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /></svg>); }
function FileIcon() { return (<svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><polyline points="14 2 14 8 20 8" /></svg>); }
function FlagIcon() { return (<svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M4 22V4" /><path d="M4 4h13l-2 4 2 4H4" /></svg>); }
function RotateIcon() { return (<svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M3 12a9 9 0 0 1 15-6.7L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" /><path d="M3 21v-5h5" /></svg>); }
