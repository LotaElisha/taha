import * as React from "react";
import { Badge } from "../../components/ui/badge";
import { Skeleton } from "../../components/feedback/Skeleton";
import { EmptyState } from "../../components/feedback/EmptyState";
import { PriceTag } from "../../components/feedback/PriceTag";
import { toast } from "../../components/ui/sonner";
import { apiFetch } from "../../lib/apiClient";
import { cn, formatRelativeDate } from "../../lib/utils";

interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  price: string;
  line_total: string;
}

interface Order {
  id: number;
  user_id: number;
  total: string;
  currency: string;
  status: "Pending" | "Processing" | "Shipped" | "Delivered" | "Completed" | "Cancelled";
  payment_method_id: string;
  delivery_option_id: string;
  delivery_cost: string;
  created_at: string;
  user?: {
    id: number;
    name: string;
    phone: string;
  };
  items?: OrderItem[];
}

interface Paginated<T> {
  data: T[];
  total: number;
  current_page: number;
  last_page: number;
}

type OrderStatus = "All" | "Pending" | "Processing" | "Shipped" | "Delivered" | "Completed" | "Cancelled";

export function AdminOrders() {
  const [statusFilter, setStatusFilter] = React.useState<OrderStatus>("All");
  const [data, setData] = React.useState<Paginated<Order> | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [page, setPage] = React.useState(1);

  React.useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    let queryParams = [`page=${page}`];
    if (statusFilter !== "All") {
      queryParams.push(`status=${statusFilter}`);
    }

    const qs = queryParams.length > 0 ? `?${queryParams.join("&")}` : "";

    apiFetch<Paginated<Order>>(`/api/v1/admin/orders${qs}`)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((e) => {
        toast.error(e instanceof Error ? e.message : "Failed to load orders");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [statusFilter, page]);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-4 space-y-4">
      <header className="flex items-baseline justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-fg">Platform Orders</h1>
          <p className="text-sm text-muted">
            Track transactions, delivery options, and payment channels across all regions.
          </p>
        </div>
        {data ? <Badge variant="default">{data.total} orders</Badge> : null}
      </header>

      {/* Filter and search bar */}
      <div className="flex flex-wrap gap-1.5 bg-surface p-2 rounded-lg border border-border">
        {(["All", "Pending", "Processing", "Shipped", "Delivered", "Completed", "Cancelled"] as OrderStatus[]).map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => {
              setStatusFilter(st);
              setPage(1);
            }}
            className={cn(
              "shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-all",
              st === statusFilter
                ? "bg-brand-900 text-white"
                : "border border-border bg-surface text-muted hover:text-fg"
            )}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Orders list */}
      <section>
        {isLoading && !data ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        ) : !data || data.data.length === 0 ? (
          <EmptyState
            className="py-16"
            title={`No ${statusFilter === "All" ? "" : statusFilter.toLowerCase()} orders`}
            body="Orders submitted by farmers will be listed here."
          />
        ) : (
          <div className="space-y-2">
            {data.data.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}

            {/* Pagination Controls */}
            {data.last_page > 1 && (
              <div className="flex items-center justify-between border border-border rounded-lg bg-surface px-4 py-3 mt-4">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="rounded border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-muted hover:text-fg disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-xs text-muted">
                  Page {page} of {data.last_page}
                </span>
                <button
                  disabled={page >= data.last_page}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-muted hover:text-fg disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function OrderCard({ order }: { order: Order }) {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <div className="rounded-lg border border-border bg-surface p-4 hover:border-brand-500/30 transition-all space-y-3">
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-fg">Order #{order.id}</span>
            <Badge
              variant={
                order.status === "Completed" || order.status === "Delivered"
                  ? "success"
                  : order.status === "Processing" || order.status === "Shipped"
                    ? "info"
                    : order.status === "Pending"
                      ? "warning"
                      : "danger"
              }
            >
              {order.status}
            </Badge>
          </div>
          <p className="text-xs text-muted">
            Placed by <span className="font-semibold text-fg">{order.user?.name || `Farmer #${order.user_id}`}</span> · {order.user?.phone || "No phone"}
          </p>
        </div>

        <div className="text-right space-y-0.5">
          <PriceTag value={Number(order.total)} size="sm" />
          <p className="text-[10px] text-muted uppercase">
            Paid via {order.payment_method_id}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border pt-2 text-xs text-muted">
        <div className="flex items-center gap-3">
          <span>Delivery: <strong className="text-fg font-medium">{order.delivery_option_id}</strong> (+{order.delivery_cost} TZS)</span>
          <span>·</span>
          <span>{formatRelativeDate(order.created_at)}</span>
        </div>

        {order.items && order.items.length > 0 && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1"
          >
            {expanded ? "Hide Items" : `Show Items (${order.items.length})`}
          </button>
        )}
      </div>

      {expanded && order.items && (
        <div className="rounded border border-border bg-surface-2 p-3 mt-2 animate-fade-in space-y-2">
          <h4 className="text-xs font-bold text-fg uppercase tracking-wider mb-2">Order Line Items</h4>
          <div className="space-y-1">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between items-center text-xs border-b border-border/50 pb-1.5 last:border-b-0 last:pb-0">
                <div className="truncate flex-1 pr-4">
                  <span className="font-medium text-fg">{item.product_name}</span>
                  <span className="text-[10px] text-muted ml-2">x {item.quantity} units</span>
                </div>
                <div className="text-right font-semibold text-fg">
                  {Number(item.line_total).toLocaleString()} TZS
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
