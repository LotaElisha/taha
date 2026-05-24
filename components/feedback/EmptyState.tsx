import * as React from "react";
import { cn } from "../../lib/utils";

interface EmptyStateProps {
  /** Decorative SVG or illustration. ~120 dp tall recommended. */
  illustration?: React.ReactNode;
  title: string;
  body?: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * EmptyState — one line title, one supporting sentence, one primary action.
 * Used by every list (orders, products, tools, bookings, reviews).
 */
export function EmptyState({
  illustration,
  title,
  body,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-12 text-center",
        className
      )}
      role="status"
    >
      {illustration ? (
        <div className="mb-2 text-brand-400" aria-hidden>
          {illustration}
        </div>
      ) : null}
      <h3 className="text-base font-semibold text-fg">{title}</h3>
      {body ? <p className="max-w-sm text-sm text-muted">{body}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
