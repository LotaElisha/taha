import * as React from "react";
import { cn } from "../../lib/utils";
import { formatTZS } from "../../lib/utils";

interface PriceTagProps {
  value: number;
  /** Strikethrough original price for promo display. */
  compareAt?: number;
  /** Visual emphasis. */
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * PriceTag — TZS-bound currency formatter.
 * Currency is locked to TZS at launch per DESIGN_SPEC §14.
 * The data model still carries `currency` so we can flip later
 * without a migration.
 */
export function PriceTag({ value, compareAt, size = "md", className }: PriceTagProps) {
  const formatted = formatTZS(value);
  return (
    <span
      className={cn(
        "tabular inline-flex items-baseline gap-2 font-medium text-brand-700 dark:text-brand-300",
        size === "sm" && "text-sm",
        size === "md" && "text-base",
        size === "lg" && "text-xl",
        className
      )}
    >
      <span>{formatted}</span>
      {typeof compareAt === "number" && compareAt > value ? (
        <span className="text-xs font-normal text-muted line-through">
          {formatTZS(compareAt)}
        </span>
      ) : null}
    </span>
  );
}
