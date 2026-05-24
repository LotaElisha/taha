import * as React from "react";
import { cn } from "../../lib/utils";

/**
 * Skeleton — animated placeholder block.
 * Every async surface should compose a skeleton that matches the loaded shape.
 */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-surface-2", className)}
      aria-hidden
      {...props}
    />
  );
}
