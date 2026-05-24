import * as React from "react";
import { cn } from "../../lib/utils";

interface AppBarProps {
  /** Left side — usually a brand mark or a back button. */
  leading?: React.ReactNode;
  /** Center — usually the page title. Hidden on home routes. */
  title?: React.ReactNode;
  /** Right side — usually search + profile icon buttons. */
  trailing?: React.ReactNode;
  /** Use a transparent bar on top of camera/full-bleed views. */
  variant?: "default" | "transparent";
  className?: string;
}

/**
 * AppBar — sticky top bar, 56 dp tall, respects `safe-area-inset-top`.
 * Collapses on scroll via the parent scroll container's CSS, not here.
 */
export function AppBar({
  leading,
  title,
  trailing,
  variant = "default",
  className,
}: AppBarProps) {
  return (
    <header
      role="banner"
      className={cn(
        "sticky top-0 z-30 flex h-14 items-center justify-between gap-2 px-3 pt-[env(safe-area-inset-top)]",
        variant === "default"
          ? "border-b border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80"
          : "bg-transparent",
        className
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">{leading}</div>
      {title ? (
        <div className="min-w-0 truncate text-sm font-medium text-fg">{title}</div>
      ) : null}
      <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
        {trailing}
      </div>
    </header>
  );
}
