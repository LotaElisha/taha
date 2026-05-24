import * as React from "react";
import { Badge } from "../../components/ui/badge";
import { Skeleton } from "../../components/feedback/Skeleton";
import { EmptyState } from "../../components/feedback/EmptyState";
import { toast } from "../../components/ui/sonner";
import { apiFetch } from "../../lib/apiClient";
import { cn, formatRelativeDate } from "../../lib/utils";

interface AuditLog {
  id: number;
  log_name: string;
  description: string;
  subject_type: string | null;
  subject_id: number | null;
  causer_type: string | null;
  causer_id: number | null;
  properties: string; // JSON string of attributes
  batch_uuid: string | null;
  event: string | null;
  created_at: string;
  causer_name?: string | null;
  causer_role?: string | null;
}

interface Paginated<T> {
  data: T[];
  total: number;
  current_page: number;
  last_page: number;
}

export function AdminAuditLog() {
  const [data, setData] = React.useState<Paginated<AuditLog> | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [page, setPage] = React.useState(1);

  React.useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    apiFetch<Paginated<AuditLog>>(`/api/v1/admin/audit-logs?page=${page}`)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((e) => {
        toast.error(e instanceof Error ? e.message : "Failed to load audit logs");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page]);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-4 space-y-4">
      <header className="flex items-baseline justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-fg">System Audit Log</h1>
          <p className="text-sm text-muted">
            Cryptographically trace actions, administrative operations, and database state transitions.
          </p>
        </div>
        {data ? <Badge variant="default">{data.total} records</Badge> : null}
      </header>

      {/* Logs section */}
      <section>
        {isLoading && !data ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        ) : !data || data.data.length === 0 ? (
          <EmptyState
            className="py-16"
            title="Audit log is empty"
            body="No administrative activities have been logged yet."
          />
        ) : (
          <div className="space-y-2">
            {data.data.map((log) => (
              <AuditRow key={log.id} log={log} />
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

function AuditRow({ log }: { log: AuditLog }) {
  const [expanded, setExpanded] = React.useState(false);

  // Try to parse the properties JSON
  let propertiesObj: Record<string, any> = {};
  try {
    if (typeof log.properties === "object") {
      propertiesObj = log.properties;
    } else if (typeof log.properties === "string") {
      propertiesObj = JSON.parse(log.properties);
    }
  } catch (e) {
    // Fail silently
  }

  const hasProperties = Object.keys(propertiesObj).length > 0;

  const eventBadgeVariant = (ev: string | null) => {
    if (ev === "created") return "success";
    if (ev === "updated") return "info";
    if (ev === "deleted") return "danger";
    return "default";
  };

  const cleanSubjectType = (st: string | null) => {
    if (!st) return "";
    return st.replace("App\\Models\\", "");
  };

  return (
    <div className="rounded-lg border border-border bg-surface p-3 hover:border-brand-500/20 transition-all space-y-2">
      <div className="flex items-start justify-between flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={eventBadgeVariant(log.event)}>{log.event || "event"}</Badge>
          <span className="font-semibold text-fg">
            {cleanSubjectType(log.subject_type)} #{log.subject_id}
          </span>
          <span className="text-muted">by</span>
          <span className="font-medium text-fg">
            {log.causer_name || "System Automated"}
          </span>
          {log.causer_role && (
            <Badge variant="default" className="text-[9px] uppercase font-semibold">
              {log.causer_role}
            </Badge>
          )}
        </div>
        <span className="text-muted tabular">{formatRelativeDate(log.created_at)}</span>
      </div>

      <div className="flex items-center justify-between text-xs text-muted">
        <p className="leading-snug italic">
          {log.description || "Database table transition recorded."}
        </p>

        {hasProperties && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1"
          >
            {expanded ? "Hide Details" : "View Details"}
          </button>
        )}
      </div>

      {expanded && hasProperties && (
        <div className="rounded border border-border bg-surface-2 p-3 mt-2 animate-fade-in text-xs font-mono overflow-x-auto max-w-full max-h-48 text-fg">
          <pre>{JSON.stringify(propertiesObj, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
