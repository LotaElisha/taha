import * as React from "react";
import { Drawer } from "vaul";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { toast } from "../ui/sonner";
import { apiFetch, ApiError } from "../../lib/apiClient";
import { cn } from "../../lib/utils";

/**
 * ReportIssueDrawer — bottom drawer that lets a farmer open a dispute on
 * a delivered order.
 *
 *   • Reason picker (chips) + optional description.
 *   • Submits to POST /api/v1/orders/{orderId}/disputes.
 *   • Surfaces server-side validation errors verbatim (e.g. window closed,
 *     duplicate dispute) — the same Drawer instance reopens with the error
 *     instead of toasting and dismissing, so the user knows what happened.
 */
const REASONS: { value: string; label: string; body: string }[] = [
  { value: "damaged", label: "Damaged", body: "Items arrived broken or spoiled." },
  { value: "wrong_items", label: "Wrong items", body: "What I got doesn’t match the order." },
  { value: "missing_items", label: "Missing items", body: "Some items weren’t in the delivery." },
  { value: "quality", label: "Quality", body: "Items don’t match the listing’s quality." },
  { value: "no_show", label: "No delivery", body: "Nothing was delivered." },
  { value: "other", label: "Other", body: "I’ll describe the issue below." },
];

export function ReportIssueDrawer({
  orderId,
  open,
  onOpenChange,
  onSubmitted,
}: {
  orderId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitted?: () => void;
}) {
  const [reason, setReason] = React.useState<string | null>(null);
  const [description, setDescription] = React.useState("");
  const [isWorking, setIsWorking] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (!open) {
      // Reset when the drawer closes so the next open is a clean slate.
      setReason(null);
      setDescription("");
      setError("");
      setIsWorking(false);
    }
  }, [open]);

  const submit = async () => {
    if (!reason) {
      setError("Pick a reason so we know how to help.");
      return;
    }
    setIsWorking(true);
    setError("");
    try {
      await apiFetch(`/api/v1/orders/${orderId}/disputes`, {
        method: "POST",
        body: { reason, description: description.trim() || undefined },
      });
      toast.success("Issue reported.", {
        description: "We’ll look into it and get back to you.",
      });
      onOpenChange(false);
      onSubmitted?.();
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.message || "Couldn’t open the dispute."
          : "Couldn’t open the dispute.";
      setError(msg);
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-[55] bg-black/40" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-[60] mt-24 flex max-h-[88vh] flex-col rounded-t-2xl bg-surface text-fg outline-none">
          <div className="mx-auto mt-2 h-1.5 w-12 shrink-0 rounded-full bg-border" />
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <Drawer.Title className="mt-2 text-lg font-semibold">
              Report an issue
            </Drawer.Title>
            <Drawer.Description className="mt-1 text-sm text-muted">
              Tell us what went wrong with order #{orderId}. Photos and
              receipts speed things up but aren’t required.
            </Drawer.Description>

            <div className="mt-4">
              <Label className="text-xs uppercase tracking-wide text-muted">
                Reason
              </Label>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {REASONS.map((r) => {
                  const active = reason === r.value;
                  return (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setReason(r.value)}
                      className={cn(
                        "rounded-md border px-3 py-2 text-left transition-colors",
                        active
                          ? "border-brand-600 bg-brand-50 text-brand-900 dark:bg-brand-900/40 dark:text-brand-200"
                          : "border-border bg-surface text-fg hover:bg-surface-2"
                      )}
                    >
                      <p className="text-sm font-medium">{r.label}</p>
                      <p className="mt-0.5 text-xs text-muted">{r.body}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4">
              <Label htmlFor="dispute-desc" className="text-xs uppercase tracking-wide text-muted">
                What happened? (optional)
              </Label>
              <textarea
                id="dispute-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                maxLength={2000}
                placeholder="e.g. The maize sack was wet and torn open."
                className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg outline-none focus-visible:border-brand-600 focus-visible:ring-2 focus-visible:ring-ring/40"
              />
            </div>

            {error ? (
              <p
                role="alert"
                className="mt-3 rounded-md bg-danger/10 px-3 py-2 text-sm text-danger"
              >
                {error}
              </p>
            ) : null}
          </div>

          <div className="border-t border-border p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                className="flex-1"
                onClick={() => onOpenChange(false)}
                disabled={isWorking}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="flex-1"
                onClick={submit}
                disabled={isWorking || !reason}
              >
                {isWorking ? "Sending…" : "Submit"}
              </Button>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
