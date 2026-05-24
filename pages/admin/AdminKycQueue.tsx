import * as React from "react";
import { User } from "../../types";
import { useUser } from "../../context/UserContext";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { EmptyState } from "../../components/feedback/EmptyState";
import { toast } from "../../components/ui/sonner";
import { cn, formatRelativeDate } from "../../lib/utils";

type Filter = "pending" | "flagged" | "resubmit" | "approved";

/**
 * AdminKycQueue — `/admin/kyc` per DESIGN_SPEC §9.7 and the Admin KYC mockup.
 * Split-view: queue list left, decision pane right. Auto-check stubs.
 */
export function AdminKycQueue() {
  const { users, updateUser } = useUser();
  const [filter, setFilter] = React.useState<Filter>("pending");
  const [search, setSearch] = React.useState("");

  const queue = React.useMemo(
    () => users.filter((u) => isInQueue(u, filter)),
    [users, filter]
  );

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return queue;
    return queue.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        (u.nin ?? "").toLowerCase().includes(q) ||
        (u.phone ?? "").includes(q)
    );
  }, [queue, search]);

  const [selectedId, setSelectedId] = React.useState<string | null>(
    filtered[0]?.id ?? null
  );
  React.useEffect(() => {
    if (!filtered.find((u) => u.id === selectedId)) {
      setSelectedId(filtered[0]?.id ?? null);
    }
  }, [filtered, selectedId]);

  const selected = filtered.find((u) => u.id === selectedId) ?? null;

  const decide = (verdict: "Verified" | "Pending" | "Rejected") => {
    if (!selected) return;
    updateUser({ ...selected, kycStatus: verdict });
    toast(
      verdict === "Verified"
        ? "Approved."
        : verdict === "Rejected"
          ? "Rejected."
          : "Redo requested."
    );
  };

  return (
    <div className="grid h-full min-h-[calc(100dvh-3.5rem)] grid-cols-1 md:grid-cols-[320px_1fr]">
      {/* Queue list */}
      <aside className="flex min-h-0 flex-col border-b border-border md:border-b-0 md:border-r">
        <div className="border-b border-border px-3 py-2">
          <div className="mb-2 flex items-center gap-2">
            <h1 className="text-base font-semibold text-fg">KYC review</h1>
            <Badge variant="warning">{queue.length} {filter}</Badge>
          </div>
          <div className="flex gap-1 overflow-x-auto">
            <FilterPill
              active={filter === "pending"}
              onClick={() => setFilter("pending")}
            >
              Pending
            </FilterPill>
            <FilterPill
              active={filter === "flagged"}
              onClick={() => setFilter("flagged")}
            >
              Flagged
            </FilterPill>
            <FilterPill
              active={filter === "resubmit"}
              onClick={() => setFilter("resubmit")}
            >
              Resubmits
            </FilterPill>
            <FilterPill
              active={filter === "approved"}
              onClick={() => setFilter("approved")}
            >
              Approved
            </FilterPill>
          </div>
        </div>
        <div className="border-b border-border px-3 py-2">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, NIN, or phone…"
            className="h-9 w-full rounded-md border border-border bg-surface-2 px-2 text-xs text-fg outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-ring/40"
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <EmptyState
              className="py-10 text-xs"
              title="Empty queue"
              body="Nothing to review here."
            />
          ) : (
            filtered.map((u) => (
              <QueueRow
                key={u.id}
                user={u}
                selected={u.id === selectedId}
                onClick={() => setSelectedId(u.id)}
              />
            ))
          )}
        </div>
      </aside>

      {/* Detail pane */}
      <section className="overflow-y-auto px-4 py-4">
        {!selected ? (
          <EmptyState
            className="py-20"
            title="Select an applicant"
            body="Pick someone from the queue to review their documents."
          />
        ) : (
          <ApplicantDetail user={selected} onDecide={decide} />
        )}
      </section>
    </div>
  );
}

function FilterPill({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full px-3 py-1 text-xs font-medium",
        active
          ? "bg-brand-900 text-white"
          : "border border-border bg-surface text-muted"
      )}
    >
      {children}
    </button>
  );
}

function QueueRow({
  user,
  selected,
  onClick,
}: {
  user: User;
  selected: boolean;
  onClick: () => void;
}) {
  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 border-b border-border px-3 py-2 text-left",
        selected
          ? "border-l-[3px] border-l-brand-600 bg-brand-50/60 dark:bg-brand-900/40"
          : "hover:bg-surface-2"
      )}
    >
      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-medium text-white">
        {initials || "?"}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-medium text-fg">
          {user.name || "Unnamed"}
        </span>
        <span className="block truncate text-[10px] text-muted">
          {user.role} ·{" "}
          {user.kycSubmissionDate
            ? formatRelativeDate(user.kycSubmissionDate)
            : "just now"}
        </span>
      </span>
      <StatusBadge status={user.kycStatus} />
    </button>
  );
}

function StatusBadge({ status }: { status?: User["kycStatus"] }) {
  if (status === "Pending") return <Badge variant="warning">New</Badge>;
  if (status === "Rejected") return <Badge variant="danger">Flagged</Badge>;
  if (status === "Verified") return <Badge variant="success">Done</Badge>;
  return <Badge variant="default">—</Badge>;
}

/* ----------------------------- Detail pane ------------------------------ */
function ApplicantDetail({
  user,
  onDecide,
}: {
  user: User;
  onDecide: (v: "Verified" | "Pending" | "Rejected") => void;
}) {
  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-border pb-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 text-base font-semibold text-white">
          {initials || "?"}
        </span>
        <div>
          <h2 className="text-lg font-semibold text-fg">
            {user.name || "Unnamed applicant"}
          </h2>
          <p className="mt-0.5 text-xs text-muted">
            <Badge variant="outline" className="mr-2">{user.role}</Badge>
            {user.phone ?? "no phone"} ·{" "}
            {user.kycSubmissionDate
              ? formatRelativeDate(user.kycSubmissionDate)
              : "just submitted"}
          </p>
        </div>
      </header>

      {/* NIN row */}
      <div className="flex items-center justify-between rounded-md bg-surface-2 px-3 py-2">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted">
            National ID number
          </p>
          <p className="mt-0.5 text-sm font-medium tabular text-fg">
            {user.nin || "Not provided"}
          </p>
        </div>
        <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
          <CheckIcon /> Matches NIDA
        </span>
      </div>

      {/* Document thumbnails */}
      <div className="grid grid-cols-3 gap-2">
        <DocCard label="Front" url={user.idFrontUrl} />
        <DocCard label="Back" url={user.idFrontUrl /* mocked */} />
        <DocCard label="Selfie" url={user.selfieUrl} isSelfie />
      </div>

      {/* Automated checks */}
      <section>
        <p className="mb-1.5 text-xs font-medium text-muted">Automated checks</p>
        <div className="flex flex-col gap-1.5">
          <CheckRow ok label="NIN format and checksum valid" detail="Pass" />
          <CheckRow ok label="Face match to ID photo" detail="94%" />
          <CheckRow
            warn
            label="Document authenticity"
            detail="Hologram unclear"
          />
        </div>
      </section>

      {/* Actions */}
      <footer className="mt-2 flex gap-2 border-t border-border pt-4">
        <Button
          variant="primary"
          size="md"
          onClick={() => onDecide("Verified")}
          className="flex-[2]"
        >
          <ShieldIcon /> Approve
        </Button>
        <Button
          variant="outline"
          size="md"
          onClick={() => onDecide("Pending")}
          className="flex-1"
        >
          Request redo
        </Button>
        <Button
          variant="outline"
          size="md"
          onClick={() => onDecide("Rejected")}
          className="flex-1 border-danger/40 text-danger hover:bg-danger/10"
        >
          Reject
        </Button>
      </footer>
    </div>
  );
}

function DocCard({
  label,
  url,
  isSelfie,
}: {
  label: string;
  url?: string;
  isSelfie?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-md border border-border">
      <div className="flex items-center justify-between border-b border-border px-2 py-1.5 text-[10px] text-muted">
        {label}
        <ZoomIcon />
      </div>
      <div
        className={cn(
          "flex aspect-[1.4/1] items-center justify-center",
          isSelfie ? "bg-stone-700" : "bg-brand-800"
        )}
      >
        {url ? (
          <img src={url} alt={label} className="h-full w-full object-cover" />
        ) : (
          <span className="text-white/40">
            <ImageIcon />
          </span>
        )}
      </div>
    </div>
  );
}

function CheckRow({
  ok,
  warn,
  label,
  detail,
}: {
  ok?: boolean;
  warn?: boolean;
  label: string;
  detail: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2">
      <span
        className={cn(
          "flex h-6 w-6 items-center justify-center rounded-full",
          ok && "bg-brand-100 text-brand-700",
          warn && "bg-harvest-100 text-harvest-700"
        )}
        aria-hidden
      >
        {ok ? <CheckIcon /> : <AlertIcon />}
      </span>
      <span className="flex-1 text-sm text-fg">{label}</span>
      <span
        className={cn(
          "text-xs tabular",
          ok && "text-success",
          warn && "text-harvest-700"
        )}
      >
        {detail}
      </span>
    </div>
  );
}

function isInQueue(u: User, filter: Filter): boolean {
  if (filter === "pending") return u.kycStatus === "Pending";
  if (filter === "flagged") return u.kycStatus === "Rejected";
  if (filter === "resubmit") return u.kycStatus === "Not Submitted" && !!u.nin;
  if (filter === "approved") return u.kycStatus === "Verified";
  return false;
}

function CheckIcon() { return (<svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M20 6 9 17l-5-5" /></svg>); }
function AlertIcon() { return (<svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="m21 16-9-14L3 16h18Z" /><path d="M12 9v3M12 16h.01" /></svg>); }
function ZoomIcon() { return (<svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="11" cy="11" r="7" /><path d="M11 8v6M8 11h6M21 21l-4.3-4.3" /></svg>); }
function ImageIcon() { return (<svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-5-5L5 21" /></svg>); }
function ShieldIcon() { return (<svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></svg>); }
