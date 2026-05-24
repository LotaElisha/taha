import * as React from "react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Skeleton } from "../feedback/Skeleton";
import { ReportIssueDrawer } from "./ReportIssueDrawer";
import { apiFetch } from "../../lib/apiClient";
import { formatRelativeDate } from "../../lib/utils";

/**
 * MyDisputesPanel — surface for the customer's order-disputes:
 *
 *   1. Renders a card per active dispute (Open / UnderReview / Approved /
 *      Resolved / Rejected) with the resolution note when present.
 *   2. Renders a card per recent disputable order with a "Report an issue"
 *      button. The button opens ReportIssueDrawer.
 *
 * Mounted on `/farmer/orders` above OrderHistory.
 */

type DisputeStatus = "Open" | "UnderReview" | "Approved" | "Rejected" | "Resolved";

interface BackendDispute {
  id: number;
  order_id: number;
  reason: string;
  description: string | null;
  status: DisputeStatus;
  resolution_note: string | null;
  created_at: string;
  decided_at: string | null;
  order?: { id: number; total: string; currency: string; status: string };
  refund?: { id: number; amount: string; status: string } | null;
}

interface BackendOrder {
  id: number;
  total: string;
  currency: string;
  status: string;
  disputable_until: string | null;
  dispute_status: string | null;
  paid_at: string | null;
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

export function MyDisputesPanel() {
  const [disputes, setDisputes] = React.useState<BackendDispute[] | null>(null);
  const [orders, setOrders] = React.useState<BackendOrder[] | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [reportOrderId, setReportOrderId] = React.useState<number | null>(null);
  const [version, setVersion] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    Promise.all([
      apiFetch<Paginated<BackendDispute>>("/api/v1/disputes/mine").catch(
        () => ({ data: [], total: 0 }) as Paginated<BackendDispute>
      ),
      apiFetch<Paginated<BackendOrder>>("/api/v1/orders/mine").catch(
        () => ({ data: [], total: 0 }) as Paginated<BackendOrder>
      ),
    ])
      .then(([d, o]) => {
        if (cancelled) return;
        setDisputes(d.data);
        setOrders(o.data);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [version]);

  // Disputable = Delivered/Completed + within window + no active dispute attached.
  const disputableOrders = React.useMemo(() => {
    if (!orders) return [];
    const activeForOrder = new Map(
      (disputes ?? [])
        .filter((d) => ["Open", "UnderReview", "Approved"].includes(d.status))
        .map((d) => [d.order_id, d])
    );
    return orders.filter((o) => {
      if (!["Delivered", "Completed"].includes(o.status)) return false;
      if (o.disputable_until && new Date(o.disputable_until) < new Date()) return false;
      if (activeForOrder.has(o.id)) return false;
      return true;
    });
  }, [orders, disputes]);

  if (isLoading && !disputes && !orders) {
    return (
      <div className="mb-4 flex flex-col gap-2">
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
      </div>
    );
  }

  const hasAnything = (disputes && disputes.length > 0) || disputableOrders.length > 0;
  if (!hasAnything) return null;

  return (
    <section className="mb-4 flex flex-col gap-3">
      {disputes && disputes.length > 0 ? (
        <div>
          <h2 className="mb-2 text-sm font-medium text-fg">Your issues</h2>
          <ul className="flex flex-col gap-2">
            {disputes.map((d) => (
              <DisputeRow key={d.id} dispute={d} />
            ))}
          </ul>
        </div>
      ) : null}

      {disputableOrders.length > 0 ? (
        <div>
          <h2 className="mb-2 text-sm font-medium text-fg">
            Something wrong with a delivery?
          </h2>
          <ul className="flex flex-col gap-2">
            {disputableOrders.map((o) => (
              <li
                key={o.id}
                className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface p-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-fg">Order #{o.id}</p>
                  <p className="text-xs text-muted">
                    Delivered. You can report until{" "}
                    {o.disputable_until
                      ? new Date(o.disputable_until).toLocaleDateString()
                      : "the end of the window"}
                    .
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setReportOrderId(o.id)}
                >
                  Report
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {reportOrderId !== null ? (
        <ReportIssueDrawer
          orderId={reportOrderId}
          open={reportOrderId !== null}
          onOpenChange={(open) => {
            if (!open) setReportOrderId(null);
          }}
          onSubmitted={() => setVersion((v) => v + 1)}
        />
      ) : null}
    </section>
  );
}

function DisputeRow({ dispute }: { dispute: BackendDispute }) {
  return (
    <li className="rounded-md border border-border bg-surface p-3">
      <div className="flex items-center gap-2">
        <p className="flex-1 truncate text-sm font-medium text-fg">
          Order #{dispute.order_id} · {REASON_LABELS[dispute.reason] ?? dispute.reason}
        </p>
        <DisputeStatusBadge status={dispute.status} />
      </div>
      {dispute.description ? (
        <p className="mt-1 text-xs text-muted">{dispute.description}</p>
      ) : null}
      <p className="mt-1 text-[11px] text-muted">
        Opened {formatRelativeDate(dispute.created_at)}
        {dispute.decided_at
          ? ` · decided ${formatRelativeDate(dispute.decided_at)}`
          : ""}
      </p>
      {dispute.resolution_note ? (
        <p className="mt-2 rounded-md bg-surface-2 px-2 py-1 text-xs text-fg">
          <strong>Note from our team:</strong> {dispute.resolution_note}
        </p>
      ) : null}
      {dispute.refund ? (
        <p className="mt-1 text-[11px] text-muted">
          Refund {dispute.refund.status} · TZS{" "}
          {Number(dispute.refund.amount).toLocaleString()}
        </p>
      ) : null}
    </li>
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
