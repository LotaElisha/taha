import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Order, Product, Agrodealer, Agrovet } from "../../types";
import { Button } from "../../components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { cn, formatTZS } from "../../lib/utils";

interface DealerTodayProps {
  orders: Order[];
  products: Product[];
  onOpenPos: () => void;
}

type Range = "today" | "week" | "month";

/**
 * DealerToday — `/dealer` route per DESIGN_SPEC §9.4.1.
 * Dark revenue hero card + range tabs + KPI cards + attention cards + quick actions.
 */
export function DealerToday({ orders, products, onOpenPos }: DealerTodayProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const dealer = user as Agrodealer | Agrovet | null;
  const [range, setRange] = React.useState<Range>("today");

  const ordersInRange = React.useMemo(
    () => filterByRange(orders, range, dealer?.id),
    [orders, range, dealer?.id]
  );
  const revenue = React.useMemo(
    () => ordersInRange.reduce((sum, o) => sum + o.total, 0),
    [ordersInRange]
  );
  const pendingCount = orders.filter(
    (o) => isMine(o, dealer?.id) && o.status === "Processing"
  ).length;
  const lowStock = products
    .filter((p) => p.vendor.id === dealer?.id && p.stock > 0 && p.stock < 10)
    .slice(0, 3);
  const customerCount = new Set(ordersInRange.map((o) => o.userId)).size;

  // Derive a sparkline series for the dark hero: 9 buckets, normalized.
  const spark = React.useMemo(() => buildSpark(ordersInRange), [ordersInRange]);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-4">
      {/* Greeting */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-700 text-base font-semibold text-white">
          {(dealer?.name ?? "?")
            .split(" ")
            .map((p) => p[0])
            .join("")
            .slice(0, 2)
            .toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted">Habari,</p>
          <p className="truncate text-lg font-semibold text-fg">
            {dealer?.name || "Dealer"}
          </p>
        </div>
      </div>

      {/* Dark revenue hero */}
      <section className="rounded-lg bg-brand-900 p-4 text-brand-50">
        <p className="text-xs opacity-70">
          Revenue {range === "today" ? "today" : `this ${range}`}
        </p>
        <p className="mt-0.5 text-2xl font-semibold tabular">{formatTZS(revenue)}</p>
        <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium">
          <TrendUpIcon /> {ordersInRange.length} orders
        </span>
        <Sparkline values={spark} className="mt-2 h-10 w-full" />
      </section>

      {/* Range tabs */}
      <Tabs value={range} onValueChange={(v) => setRange(v as Range)} className="mt-4">
        <TabsList className="w-full">
          <TabsTrigger value="today" className="flex-1">Today</TabsTrigger>
          <TabsTrigger value="week" className="flex-1">Week</TabsTrigger>
          <TabsTrigger value="month" className="flex-1">Month</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* KPI row */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <StatCard label="Orders" value={ordersInRange.length} icon={<CartIcon />} />
        <StatCard label="Customers" value={customerCount} icon={<UsersIcon />} />
      </div>

      {/* Attention */}
      <section className="mt-6">
        <h2 className="mb-2 text-sm font-medium text-fg">Needs your attention</h2>
        <div className="flex flex-col gap-2">
          <AttentionCard
            icon={<ClockIcon />}
            tone="warning"
            title={`${pendingCount} orders to confirm`}
            body={pendingCount > 0 ? "Confirm them before customers cancel." : "You're caught up. Nice."}
            onClick={() => navigate("/dealer/orders")}
          />
          {lowStock.length > 0 ? (
            <AttentionCard
              icon={<AlertIcon />}
              tone="danger"
              title={`${lowStock.length} products low in stock`}
              body={lowStock.map((p) => p.name).join(" · ")}
              onClick={() => navigate("/dealer/products")}
            />
          ) : null}
        </div>
      </section>

      {/* Quick actions */}
      <section className="mt-6">
        <h2 className="mb-2 text-sm font-medium text-fg">Quick actions</h2>
        <div className="grid grid-cols-3 gap-2">
          <QuickButton icon={<PlusIcon />} label="Add product" onClick={() => navigate("/dealer/products?new=1")} />
          <QuickButton icon={<RegisterIcon />} label="Open POS" onClick={onOpenPos} />
          <QuickButton icon={<TruckIcon />} label="Logistics" onClick={() => navigate("/dealer/orders")} />
        </div>
      </section>
    </div>
  );
}

/* --------------------------- Subcomponents -------------------------------- */
function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-md bg-surface-2 p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted">
        <span aria-hidden>{icon}</span>
        {label}
      </div>
      <div className="mt-1 text-xl font-semibold tabular text-fg">{value}</div>
    </div>
  );
}

function AttentionCard({
  icon,
  tone,
  title,
  body,
  onClick,
}: {
  icon: React.ReactNode;
  tone: "warning" | "danger";
  title: string;
  body: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 rounded-md border border-border bg-surface p-3 text-left transition-colors hover:bg-surface-2"
    >
      <span
        aria-hidden
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-md",
          tone === "warning" && "bg-harvest-100 text-harvest-700",
          tone === "danger" && "bg-danger/15 text-danger"
        )}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-fg">{title}</p>
        <p className="truncate text-xs text-muted">{body}</p>
      </div>
      <ChevronRightIcon />
    </button>
  );
}

function QuickButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 rounded-md border border-border bg-surface p-2 text-fg transition-colors hover:bg-surface-2"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
        {icon}
      </span>
      <span className="text-[11px] font-medium">{label}</span>
    </button>
  );
}

function Sparkline({
  values,
  className,
}: {
  values: number[];
  className?: string;
}) {
  if (values.length === 0) return null;
  const max = Math.max(...values, 1);
  const w = 280;
  const h = 40;
  const step = w / (values.length - 1 || 1);
  const points = values
    .map((v, i) => `${i * step},${h - (v / max) * h}`)
    .join(" ");
  const fillPoints = `${points} ${w},${h} 0,${h}`;
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className={className}
      aria-hidden
    >
      <polyline fill="rgba(134,239,172,0.18)" stroke="none" points={fillPoints} />
      <polyline fill="none" stroke="#86efac" strokeWidth={2} points={points} />
    </svg>
  );
}

/* ----------------------------- helpers ----------------------------------- */
function isMine(o: Order, vendorId: string | undefined): boolean {
  if (!vendorId) return false;
  return o.items.some((i) => i.product.vendor.id === vendorId);
}

function filterByRange(orders: Order[], range: Range, vendorId?: string): Order[] {
  if (!vendorId) return [];
  const now = new Date();
  const start = new Date(now);
  if (range === "today") start.setHours(0, 0, 0, 0);
  else if (range === "week") start.setDate(now.getDate() - 7);
  else start.setMonth(now.getMonth() - 1);
  return orders.filter(
    (o) => isMine(o, vendorId) && new Date(o.date) >= start
  );
}

function buildSpark(orders: Order[]): number[] {
  if (orders.length === 0) return [0, 1, 0.6, 1.4, 0.8, 1.2, 0.9, 1.5, 1.1];
  const buckets = new Array(9).fill(0);
  const sorted = [...orders].sort((a, b) => +new Date(a.date) - +new Date(b.date));
  const first = +new Date(sorted[0].date);
  const last = +new Date(sorted[sorted.length - 1].date);
  const span = Math.max(last - first, 1);
  for (const o of sorted) {
    const idx = Math.min(8, Math.floor(((+new Date(o.date) - first) / span) * 9));
    buckets[idx] += o.total;
  }
  return buckets;
}

/* --------------------------------- icons --------------------------------- */
function TrendUpIcon() { return (<svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M22 7 13 16l-4-4-7 7" /><path d="M16 7h6v6" /></svg>); }
function CartIcon() { return (<svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.6a2 2 0 0 0 2-1.6L23 6H6" /></svg>); }
function UsersIcon() { return (<svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>); }
function ClockIcon() { return (<svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>); }
function AlertIcon() { return (<svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="m21 16-9-14L3 16h18Z" /><path d="M12 9v3M12 16h.01" /></svg>); }
function ChevronRightIcon() { return (<svg viewBox="0 0 24 24" className="h-4 w-4 text-muted" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="m9 18 6-6-6-6" /></svg>); }
function PlusIcon() { return (<svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 5v14M5 12h14" /></svg>); }
function RegisterIcon() { return (<svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="3" y="3" width="18" height="14" rx="2" /><path d="M3 17v4h18v-4M7 8h10M7 12h6" /></svg>); }
function TruckIcon() { return (<svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M14 18V6h7l3 5v7h-3" /><path d="M14 18H3V6h11Z" /><circle cx="7" cy="18" r="2" /><circle cx="18" cy="18" r="2" /></svg>); }
