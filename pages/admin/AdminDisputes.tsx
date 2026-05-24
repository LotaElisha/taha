import * as React from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import { EmptyState } from "../../components/feedback/EmptyState";
import { Skeleton } from "../../components/feedback/Skeleton";
import { toast } from "../../components/ui/sonner";
import { apiFetch } from "../../lib/apiClient";
import { useAuth } from "../../context/AuthContext";
import { cn, formatRelativeDate, formatTZS } from "../../lib/utils";

/**
 * AdminDisputes — `/admin/disputes`. Split-view list + decision pane.
 *
 *   • Filter pills mirror the Dispute.status enum + an "active" default
 *     (Open + UnderReview).
 *   • Approve opens a small inline form with amount (defaults to order total)
 *     and a required note. The server pre-picks the provider from the order's
 *     payment method, but admins can override (rare; debug aid).
 *   • Reject requires a note — that note is customer-visible.
 *   • Only Admin / SuperAdmin see the action buttons. SupportAgent can read
 *     the queue but the API will 403 on approve/reject — we hide the buttons
 *     so the failure isn't surprising.
 */

type DisputeStatus = "Open" | "UnderReview" | "Approved" | "Rejected" | "Resolved";
type Filter = DisputeStatus | "active" | "All";

interface BackendDispute {
  id: number;
  order_id: number;
  reason: string;
  description: string | null;
  status: DisputeStatus;
  resolution_note: string | null;
  decided_at: string | null;
  created_at: string;
  opened_by: { id: number; name: string; phone: string | null; role: string } | null;
  decided_by?: { id: number; name: string } | null;
  order?: {
    id: number;
    user_id: number;
    total: string;
    currency: string;
    status: string;
    payment_method_id: string | null;
    payment_reference: string | null;
    paid_at: string | null;
  };
  refund?: {
    id: number;
    status: string;
    amount: string;
    provider: string;
    refunded_at: string | null;
  } | null;
}

interface Paginated<T> {
  data: T[];
  total: number;
}

const REASON_LABELS: Record<string, string> = {
  damaged: "Damaged",
  wrong_items: "Wrong items",
  missing_items: "Missing items",
  quality: "Quality",
  no_show: "No delivery",
  other: "Other",
};

export function AdminDisputes() {
  const { user } = useAuth();
  const canDecide = user?.role === "Admin" || user?.role === "SuperAdmin";

  const [filter, setFilter] = React.useState<Filter>("active");
  const [data, setData] = React.useState<Paginated<BackendDispute> | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [version, setVersion] = React.useState(0);

  const [selectedId, setSelectedId] = React.useState<number | null>(null);
  const selected = data?.data.find((d) => d.id === selectedId) ?? null;

  React.useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    const qs =
      filter === "active" || filter === "All"
        ? filter === "All"
          ? "?status=All"
          : ""
        : `?status=${encodeURIComponent(filter)}`;
    apiFetch<Paginated<BackendDispute>>(`/api/v1/admin/disputes${qs}`)
      .then((res) => {
        if (cancelled) return;
        setData(res);
        if (!res.data.find((d) => d.id === selectedId)) {
          setSelectedId(res.data[0]?.id ?? null);
        }
      })
      .catch((e) =>
        toast.error(e instanceof Error ? e.message : "Failed to load disputes")
      )
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filter, version]);

  return (
    <div className="grid h-full min-h-[calc(100dvh-3.5rem)] grid-cols-1 md:grid-cols-[360px_1fr]">
      {/* List */}
      <aside className="flex min-h-0 flex-col border-b border-border md:border-b-0 md:border-r">
        <div className="border-b border-border px-3 py-2">
          <div className="mb-2 flex items-center gap-2">
            <h1 className="text-base font-semibold text-fg">Disputes</h1>
            {data ? <Badge variant="default">{data.total}</Badge> : null}
          </div>
          <div className="flex gap-1 overflow-x-auto">
            {(["active", "Open", "UnderReview", "Approved", "Rejected", "Resolved", "All"] as Filter[]).map((f) => (
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
                {f === "active" ? "Active" : f === "UnderReview" ? "Under review" : f}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading && !data ? (
            <div className="flex flex-col gap-2 p-3">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          ) : !data || data.data.length === 0 ? (
            <EmptyState
              className="py-16"
              title="No disputes here"
              body="Disputes opened from the customer surface will appear in this queue."
            />
          ) : (
            <ul>
              {data.data.map((d) => {
                const active = d.id === selectedId;
                return (
                  <li key={d.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(d.id)}
                      className={cn(
                        "flex w-full flex-col gap-1 border-b border-border px-3 py-2 text-left transition-colors",
                        active ? "bg-brand-50 dark:bg-brand-900/40" : "hover:bg-surface-2"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium text-fg">
                          {d.opened_by?.name ?? `User #${d.order?.user_id ?? "?"}`}
                        </p>
                        <DisputeStatusBadge status={d.status} />
                      </div>
                      <p className="text-xs text-muted">
                        Order #{d.order_id} · {REASON_LABELS[d.reason] ?? d.reason}
                      </p>
                      <p className="text-[11px] text-muted">
                        Opened {formatRelativeDate(d.created_at)}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>

      {/* Decision pane */}
      <section className="min-w-0 px-4 py-4">
        {!selected ? (
          <EmptyState
            className="py-16"
            title="Pick a dispute"
            body="Select one from the queue to triage."
          />
        ) : (
          <DisputeDetail
            dispute={selected}
            canDecide={canDecide}
            onChanged={() => setVersion((v) => v + 1)}
          />
        )}
      </section>
    </div>
  );
}

function DisputeDetail({
  dispute,
  canDecide,
  onChanged,
}: {
  dispute: BackendDispute;
  canDecide: boolean;
  onChanged: () => void;
}) {
  const orderTotal = Number(dispute.order?.total ?? 0);
  const [amount, setAmount] = React.useState<string>(orderTotal.toString());
  const [note, setNote] = React.useState("");
  const [mode, setMode] = React.useState<"none" | "approve" | "reject">("none");
  const [isWorking, setIsWorking] = React.useState(false);

  React.useEffect(() => {
    // Reset the form when switching disputes.
    setAmount(orderTotal.toString());
    setNote("");
    setMode("none");
  }, [dispute.id, orderTotal]);

  const isActionable = dispute.status === "Open" || dispute.status === "UnderReview";

  const submit = async () => {
    if (mode === "none") return;
    if (note.trim().length < 3) {
      toast.error("Note must be at least 3 characters.");
      return;
    }
    if (mode === "approve") {
      const a = Number(amount);
      if (!a || a <= 0 || a > orderTotal) {
        toast.error(`Amount must be between 1 and ${orderTotal}.`);
        return;
      }
    }
    setIsWorking(true);
    try {
      const url =
        mode === "approve"
          ? `/api/v1/admin/disputes/${dispute.id}/approve`
          : `/api/v1/admin/disputes/${dispute.id}/reject`;
      const body =
        mode === "approve"
          ? { amount: Number(amount), note: note.trim() }
          : { note: note.trim() };
      await apiFetch(url, { method: "POST", body });
      toast.success(mode === "approve" ? "Dispute approved." : "Dispute rejected.");
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <header className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-semibold text-fg">
            Dispute #{dispute.id}
          </h2>
          <p className="truncate text-sm text-muted">
            Order #{dispute.order_id} · {REASON_LABELS[dispute.reason] ?? dispute.reason}
          </p>
        </div>
        <DisputeStatusBadge status={dispute.status} />
      </header>

      <section className="mt-4 grid gap-2 rounded-md border border-border bg-surface p-3 text-sm">
        <Row label="Customer">
          {dispute.opened_by?.name ?? `User #${dispute.order?.user_id ?? "?"}`}
          {dispute.opened_by?.phone ? ` · ${dispute.opened_by.phone}` : null}
        </Row>
        <Row label="Order total">
          {dispute.order ? formatTZS(Number(dispute.order.total)) : "—"}
        </Row>
        <Row label="Paid via">
          {dispute.order?.payment_method_id ?? "—"}
          {dispute.order?.payment_reference
            ? ` (${dispute.order.payment_reference})`
            : null}
        </Row>
        <Row label="Opened">{formatRelativeDate(dispute.created_at)}</Row>
        {dispute.description ? (
          <Row label="What happened">
            <span className="whitespace-pre-line">{dispute.description}</span>
          </Row>
        ) : null}
        {dispute.resolution_note ? (
          <Row label="Resolution note">{dispute.resolution_note}</Row>
        ) : null}
        {dispute.refund ? (
          <Row label="Refund">
            #{dispute.refund.id} · {dispute.refund.status} · TZS{" "}
            {Number(dispute.refund.amount).toLocaleString()} · via{" "}
            {dispute.refund.provider}
          </Row>
        ) : null}
      </section>

      {canDecide && isActionable ? (
        <section className="mt-4 rounded-md border border-border bg-surface p-3">
          {mode === "none" ? (
            <div className="flex gap-2">
              <Button type="button" onClick={() => setMode("approve")}>
                Approve refund
              </Button>
              <Button
                type="button"
                variant="outline"
                className="border-danger/40 text-danger hover:bg-danger/10"
                onClick={() => setMode("reject")}
              >
                Reject
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-fg">
                  {mode === "approve" ? "Approve refund" : "Reject dispute"}
                </p>
                <button
                  type="button"
                  onClick={() => setMode("none")}
                  className="ml-auto text-xs text-muted hover:text-fg"
                >
                  Cancel
                </button>
              </div>
              {mode === "approve" ? (
                <div>
                  <Label htmlFor="amount" className="text-xs uppercase text-muted">
                    Refund amount (max {formatTZS(orderTotal)})
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={orderTotal}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="mt-1"
                  />
                </div>
              ) : null}
              <div>
                <Label htmlFor="note" className="text-xs uppercase text-muted">
                  Note (required, customer-visible)
                </Label>
                <textarea
                  id="note"
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={
                    mode === "approve"
                      ? "Customer photo evidence is clear; refunding the spoiled bag only."
                      : "Photos show packaging intact at delivery time. Closing without refund."
                  }
                  className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg outline-none focus-visible:border-brand-600 focus-visible:ring-2 focus-visible:ring-ring/40"
                />
              </div>
              <Button
                type="button"
                onClick={submit}
                disabled={isWorking}
                className={mode === "reject" ? "bg-danger text-white hover:bg-danger/90" : ""}
              >
                {isWorking
                  ? "Submitting…"
                  : mode === "approve"
                    ? "Approve & queue refund"
                    : "Reject dispute"}
              </Button>
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-2">
      <span className="text-xs uppercase tracking-wide text-muted">{label}</span>
      <span className="text-fg">{children}</span>
    </div>
  );
}

function DisputeStatusBadge({ status }: { status: DisputeStatus }) {
  const variant = (
    {
      Open: "warning",
      UnderReview: "info",
      Approved: "info",
      Resolved: "success",
      Rejected: "default",
    } as const
  )[status];
  const label = status === "UnderReview" ? "Under review" : status;
  return <Badge variant={variant}>{label}</Badge>;
}
