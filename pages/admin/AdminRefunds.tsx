import * as React from "react";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { EmptyState } from "../../components/feedback/EmptyState";
import { PriceTag } from "../../components/feedback/PriceTag";
import { Skeleton } from "../../components/feedback/Skeleton";
import { ConfirmDialog } from "../../components/feedback/ConfirmDialog";
import { toast } from "../../components/ui/sonner";
import { apiFetch } from "../../lib/apiClient";
import { cn, formatRelativeDate } from "../../lib/utils";
import { useAuth } from "../../context/AuthContext";

type RefundStatus = "Pending" | "Processing" | "Refunded" | "Failed" | "Cancelled";

interface Refund {
  id: number;
  dispute_id: number | null;
  order_id: number;
  recipient_id: number;
  amount: string;
  currency: string;
  status: RefundStatus;
  provider: string; // mpesa_reversal | selcom_refund | manual
  provider_reference: string | null;
  failure_reason: string | null;
  attempts: number;
  queued_at: string | null;
  refunded_at: string | null;
  created_at: string;
  recipient?: {
    id: number;
    name: string;
    phone: string | null;
    role: string;
  };
  order?: { id: number; total: string; currency: string; payment_method_id: string | null };
  dispute?: { id: number; reason: string; status: string } | null;
}

interface Paginated<T> {
  data: T[];
  total: number;
}

type Filter = RefundStatus | "All";

/**
 * AdminRefunds — `/admin/refunds`. Mirrors AdminPayouts but for outgoing
 * customer refunds.
 *
 *   • Retry available to Admin + FinancialAuditor.
 *   • Mark refunded / Cancel restricted to Admin / SuperAdmin (server-side gate;
 *     UI hides the buttons for non-admins so failures don't surprise).
 *   • Manual-provider rows are always Marked refunded by hand — the operator
 *     settles cash/bank wires off-platform.
 */
export function AdminRefunds() {
  const { user } = useAuth();
  const isAdmin = user?.role === "Admin" || user?.role === "SuperAdmin";

  const [filter, setFilter] = React.useState<Filter>("Failed");
  const [data, setData] = React.useState<Paginated<Refund> | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [version, setVersion] = React.useState(0);

  const [dialog, setDialog] = React.useState<
    | { kind: "mark-refunded"; refund: Refund }
    | { kind: "cancel"; refund: Refund }
    | null
  >(null);
  const [note, setNote] = React.useState("");

  React.useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    const qs = filter === "All" ? "" : `?status=${encodeURIComponent(filter)}`;
    apiFetch<Paginated<Refund>>(`/api/v1/admin/refunds${qs}`)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((e) =>
        toast.error(e instanceof Error ? e.message : "Failed to load refunds")
      )
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filter, version]);

  const retry = async (r: Refund) => {
    try {
      await apiFetch(`/api/v1/admin/refunds/${r.id}/retry`, { method: "POST" });
      toast.success("Retry queued.");
      setVersion((v) => v + 1);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Retry failed");
    }
  };

  const submitDialogAction = async () => {
    if (!dialog) return;
    if (note.trim().length < 3) {
      toast.error("Note must be at least 3 characters.");
      return;
    }
    const url =
      dialog.kind === "mark-refunded"
        ? `/api/v1/admin/refunds/${dialog.refund.id}/mark-refunded`
        : `/api/v1/admin/refunds/${dialog.refund.id}/cancel`;
    try {
      await apiFetch(url, { method: "POST", body: { note: note.trim() } });
      toast.success(
        dialog.kind === "mark-refunded" ? "Marked as refunded." : "Refund cancelled."
      );
      setDialog(null);
      setNote("");
      setVersion((v) => v + 1);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-4">
      <header className="flex items-baseline justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-fg">Refunds</h1>
          <p className="text-sm text-muted">
            Customer refunds queue. Failed refunds can be retried; off-platform
            settlements use Mark refunded.
          </p>
        </div>
        {data ? <Badge variant="default">{data.total} total</Badge> : null}
      </header>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {(["Failed", "Pending", "Processing", "Refunded", "Cancelled", "All"] as Filter[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1 text-xs font-medium",
              f === filter
                ? "bg-brand-900 text-white"
                : "border border-border bg-surface text-muted hover:text-fg"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <section className="mt-4">
        {isLoading && !data ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        ) : !data || data.data.length === 0 ? (
          <EmptyState
            className="py-16"
            title={`No ${filter === "All" ? "" : filter.toLowerCase()} refunds`}
            body="Refunds approved from disputes will appear here."
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {data.data.map((r) => (
              <RefundRow
                key={r.id}
                refund={r}
                isAdmin={isAdmin}
                onRetry={() => retry(r)}
                onMarkRefunded={() => {
                  setDialog({ kind: "mark-refunded", refund: r });
                  setNote("");
                }}
                onCancel={() => {
                  setDialog({ kind: "cancel", refund: r });
                  setNote("");
                }}
              />
            ))}
          </ul>
        )}
      </section>

      <ConfirmDialog
        open={dialog !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDialog(null);
            setNote("");
          }
        }}
        title={
          dialog?.kind === "mark-refunded"
            ? `Mark refund #${dialog.refund.id} as refunded`
            : dialog?.kind === "cancel"
              ? `Cancel refund #${dialog.refund.id}`
              : ""
        }
        description={
          dialog?.kind === "mark-refunded"
            ? "Record an off-platform settlement. The note is logged for audit."
            : "The customer will not receive this refund via the rails. The note is logged for audit."
        }
        destructive={dialog?.kind === "cancel"}
        confirmLabel={dialog?.kind === "mark-refunded" ? "Mark refunded" : "Cancel refund"}
        cancelLabel="Back"
        onConfirm={submitDialogAction}
      />
      {dialog ? (
        <div className="fixed inset-x-4 bottom-32 z-[60] mx-auto max-w-lg rounded-md border border-border bg-surface p-3 shadow-lg">
          <label className="text-xs font-medium text-fg">Note (required)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder={
              dialog.kind === "mark-refunded"
                ? "Cash returned at Arusha desk on 15 May; receipt #4421"
                : "Customer accepted store credit instead"
            }
            className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg outline-none focus-visible:border-brand-600 focus-visible:ring-2 focus-visible:ring-ring/40"
          />
        </div>
      ) : null}
    </div>
  );
}

function RefundRow({
  refund,
  isAdmin,
  onRetry,
  onMarkRefunded,
  onCancel,
}: {
  refund: Refund;
  isAdmin: boolean;
  onRetry: () => void;
  onMarkRefunded: () => void;
  onCancel: () => void;
}) {
  // Manual rows can't be retried via the rails — operator just marks them.
  const canRetry =
    refund.provider !== "manual" &&
    (refund.status === "Failed" || refund.status === "Pending");
  const canMarkRefunded =
    isAdmin &&
    (refund.status === "Pending" ||
      refund.status === "Failed" ||
      refund.status === "Processing");
  const canCancel =
    isAdmin && refund.status !== "Refunded" && refund.status !== "Cancelled";

  const initials = (refund.recipient?.name ?? "?")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <li className="rounded-md border border-border bg-surface p-3">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-xs font-medium text-white">
          {initials}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-fg">
            {refund.recipient?.name ?? `User #${refund.recipient_id}`}
          </p>
          <p className="truncate text-xs text-muted">
            {refund.recipient?.role ?? ""} · {refund.recipient?.phone ?? "no phone"}
          </p>
        </div>
        <PriceTag value={Number(refund.amount)} size="sm" />
        <StatusBadge status={refund.status} />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
        <span>Order #{refund.order_id}</span>
        <span>·</span>
        <span>{refund.provider}</span>
        {refund.dispute_id ? (
          <>
            <span>·</span>
            <span>Dispute #{refund.dispute_id}</span>
          </>
        ) : null}
        {refund.attempts > 0 ? (
          <>
            <span>·</span>
            <span>
              {refund.attempts} attempt{refund.attempts === 1 ? "" : "s"}
            </span>
          </>
        ) : null}
        <span>·</span>
        <span>{formatRelativeDate(refund.created_at)}</span>
      </div>
      {refund.failure_reason ? (
        <p className="mt-2 rounded-md bg-danger/10 px-2 py-1 text-xs text-danger">
          {refund.failure_reason}
        </p>
      ) : null}
      {canRetry || canMarkRefunded || canCancel ? (
        <div className="mt-2 flex gap-2">
          {canRetry ? (
            <Button size="sm" variant="primary" onClick={onRetry}>
              Retry
            </Button>
          ) : null}
          {canMarkRefunded ? (
            <Button size="sm" variant="outline" onClick={onMarkRefunded}>
              Mark refunded
            </Button>
          ) : null}
          {canCancel ? (
            <Button
              size="sm"
              variant="outline"
              onClick={onCancel}
              className="border-danger/40 text-danger hover:bg-danger/10"
            >
              Cancel
            </Button>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

function StatusBadge({ status }: { status: RefundStatus }) {
  const variant = (
    {
      Pending: "warning",
      Processing: "info",
      Refunded: "success",
      Failed: "danger",
      Cancelled: "default",
    } as const
  )[status];
  return <Badge variant={variant}>{status}</Badge>;
}
