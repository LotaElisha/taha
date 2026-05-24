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

type PayoutStatus =
  | "Pending"
  | "Processing"
  | "Paid"
  | "Failed"
  | "Cancelled";

interface Payout {
  id: number;
  recipient_id: number;
  amount: string;
  currency: string;
  payable_type: string;
  payable_id: number;
  status: PayoutStatus;
  provider: string;
  provider_reference: string | null;
  failure_reason: string | null;
  attempts: number;
  queued_at: string | null;
  paid_at: string | null;
  created_at: string;
  recipient?: {
    id: number;
    name: string;
    phone: string | null;
    role: string;
  };
}

interface Paginated<T> {
  data: T[];
  total: number;
}

type Filter = PayoutStatus | "All";

/**
 * AdminPayouts — `/admin/payouts`. Operator surface for the payouts queue.
 *
 *   • Filter pills mirror the Payout.status enum.
 *   • Each row has Retry / Mark paid / Cancel actions, gated by the user's
 *     role on the server side. The UI surfaces the *visible* set of actions
 *     based on role; the server is the source of truth.
 *   • `Mark paid` requires a note (off-platform settlements). `Cancel`
 *     requires a note too. Both rendered through ConfirmDialog with a
 *     textarea instead of inline forms — keeps the table tidy.
 */
export function AdminPayouts() {
  const { user } = useAuth();
  const isAdmin = user?.role === "Admin" || user?.role === "SuperAdmin";

  const [filter, setFilter] = React.useState<Filter>("Failed");
  const [data, setData] = React.useState<Paginated<Payout> | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [version, setVersion] = React.useState(0);

  // Action dialog state — used by mark-paid + cancel which need a note.
  const [dialog, setDialog] = React.useState<
    | { kind: "mark-paid"; payout: Payout }
    | { kind: "cancel"; payout: Payout }
    | null
  >(null);
  const [note, setNote] = React.useState("");

  React.useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    const qs = filter === "All" ? "" : `?status=${encodeURIComponent(filter)}`;
    apiFetch<Paginated<Payout>>(`/api/v1/admin/payouts${qs}`)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((e) =>
        toast.error(e instanceof Error ? e.message : "Failed to load payouts")
      )
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filter, version]);

  const retry = async (p: Payout) => {
    try {
      await apiFetch(`/api/v1/admin/payouts/${p.id}/retry`, { method: "POST" });
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
      dialog.kind === "mark-paid"
        ? `/api/v1/admin/payouts/${dialog.payout.id}/mark-paid`
        : `/api/v1/admin/payouts/${dialog.payout.id}/cancel`;
    try {
      await apiFetch(url, { method: "POST", body: { note: note.trim() } });
      toast.success(
        dialog.kind === "mark-paid" ? "Marked as paid." : "Payout cancelled."
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
          <h1 className="text-xl font-semibold text-fg">Payouts</h1>
          <p className="text-sm text-muted">
            Provider and tool-owner disbursements. Failed payouts can be
            retried; off-platform settlements use Mark paid.
          </p>
        </div>
        {data ? (
          <Badge variant="default">{data.total} total</Badge>
        ) : null}
      </header>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {(["Failed", "Pending", "Processing", "Paid", "Cancelled", "All"] as Filter[]).map((f) => (
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
            title={`No ${filter === "All" ? "" : filter.toLowerCase()} payouts`}
            body="Activity from delivered bookings will appear here."
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {data.data.map((p) => (
              <PayoutRow
                key={p.id}
                payout={p}
                isAdmin={isAdmin}
                onRetry={() => retry(p)}
                onMarkPaid={() => {
                  setDialog({ kind: "mark-paid", payout: p });
                  setNote("");
                }}
                onCancel={() => {
                  setDialog({ kind: "cancel", payout: p });
                  setNote("");
                }}
              />
            ))}
          </ul>
        )}
      </section>

      {/* Note dialog — shared between mark-paid and cancel */}
      <ConfirmDialog
        open={dialog !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDialog(null);
            setNote("");
          }
        }}
        title={
          dialog?.kind === "mark-paid"
            ? `Mark payout #${dialog.payout.id} as paid`
            : dialog?.kind === "cancel"
              ? `Cancel payout #${dialog.payout.id}`
              : ""
        }
        description={
          dialog?.kind === "mark-paid"
            ? "Record an off-platform settlement. The note is logged for audit."
            : "The provider will not be paid. The note is logged for audit."
        }
        destructive={dialog?.kind === "cancel"}
        confirmLabel={dialog?.kind === "mark-paid" ? "Mark paid" : "Cancel payout"}
        cancelLabel="Back"
        onConfirm={submitDialogAction}
      />
      {/* We render the note input as a child of the dialog — Confirm dialog
          accepts a description but not children, so the textarea lives in a
          portal we control. Simplest workable thing: a tiny inline form
          above the dialog when it's open. */}
      {dialog ? (
        <div className="fixed inset-x-4 bottom-32 z-[60] mx-auto max-w-lg rounded-md border border-border bg-surface p-3 shadow-lg">
          <label className="text-xs font-medium text-fg">Note (required)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder={
              dialog.kind === "mark-paid"
                ? "Wired via CRDB ref #ABC123 on 14 May"
                : "Duplicate booking — fare already paid manually"
            }
            className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg outline-none focus-visible:border-brand-600 focus-visible:ring-2 focus-visible:ring-ring/40"
          />
        </div>
      ) : null}
    </div>
  );
}

function PayoutRow({
  payout,
  isAdmin,
  onRetry,
  onMarkPaid,
  onCancel,
}: {
  payout: Payout;
  isAdmin: boolean;
  onRetry: () => void;
  onMarkPaid: () => void;
  onCancel: () => void;
}) {
  const canRetry =
    payout.status === "Failed" || payout.status === "Pending";
  const canMarkPaid =
    isAdmin && (payout.status === "Pending" || payout.status === "Failed" || payout.status === "Processing");
  const canCancel =
    isAdmin && payout.status !== "Paid" && payout.status !== "Cancelled";

  const recipientInitials = (payout.recipient?.name ?? "?")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <li className="rounded-md border border-border bg-surface p-3">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-xs font-medium text-white">
          {recipientInitials}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-fg">
            {payout.recipient?.name ?? `User #${payout.recipient_id}`}
          </p>
          <p className="truncate text-xs text-muted">
            {payout.recipient?.role ?? ""} · {payout.recipient?.phone ?? "no phone"}
          </p>
        </div>
        <PriceTag value={Number(payout.amount)} size="sm" />
        <StatusBadge status={payout.status} />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
        <span>
          {payable(payout)} #{payout.payable_id}
        </span>
        <span>·</span>
        <span>{payout.provider}</span>
        {payout.attempts > 0 ? (
          <>
            <span>·</span>
            <span>
              {payout.attempts} attempt{payout.attempts === 1 ? "" : "s"}
            </span>
          </>
        ) : null}
        <span>·</span>
        <span>{formatRelativeDate(payout.created_at)}</span>
      </div>
      {payout.failure_reason ? (
        <p className="mt-2 rounded-md bg-danger/10 px-2 py-1 text-xs text-danger">
          {payout.failure_reason}
        </p>
      ) : null}
      {(canRetry || canMarkPaid || canCancel) ? (
        <div className="mt-2 flex gap-2">
          {canRetry ? (
            <Button size="sm" variant="primary" onClick={onRetry}>
              Retry
            </Button>
          ) : null}
          {canMarkPaid ? (
            <Button size="sm" variant="outline" onClick={onMarkPaid}>
              Mark paid
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

function StatusBadge({ status }: { status: PayoutStatus }) {
  const variant = (
    {
      Pending: "warning",
      Processing: "info",
      Paid: "success",
      Failed: "danger",
      Cancelled: "default",
    } as const
  )[status];
  return <Badge variant={variant}>{status}</Badge>;
}

function payable(p: Payout): string {
  if (p.payable_type.endsWith("LogisticsBooking")) return "Logistics";
  if (p.payable_type.endsWith("ToolBooking")) return "Tool";
  return p.payable_type;
}
