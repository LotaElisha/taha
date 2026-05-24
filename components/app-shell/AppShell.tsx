import * as React from "react";
import { cn } from "../../lib/utils";
import { AppBar } from "./AppBar";
import { BottomNav, type NavItem } from "./BottomNav";

interface AppShellProps {
  /** Custom AppBar — pass the full element to control left/title/right. */
  appBar?: React.ReactNode;
  /** Bottom nav items for mobile. Hidden automatically on `md` and up. */
  navItems?: NavItem[];
  /** Currently active nav item id. */
  activeNavId?: string;
  /** Page content. Scrolls inside the main region. */
  children: React.ReactNode;
  /** Optional desktop sidebar (≥ md). */
  sidebar?: React.ReactNode;
  className?: string;
}

/**
 * AppShell — the route-level layout primitive.
 *
 * Mobile (default): sticky AppBar → scrollable main → fixed BottomNav.
 * Desktop (`md+`): sticky AppBar → side-by-side [sidebar | main].
 *
 * Adds bottom padding equal to the BottomNav height plus safe-area inset
 * so content never gets hidden behind the nav.
 */
export function AppShell({
  appBar,
  navItems,
  activeNavId,
  sidebar,
  children,
  className,
}: AppShellProps) {
  return (
    <div className={cn("flex min-h-dvh flex-col bg-bg text-fg", className)}>
      {appBar ?? <AppBar />}

      <div className="flex flex-1 min-h-0">
        {sidebar ? (
          <aside className="hidden w-60 shrink-0 border-r border-border md:block">
            {sidebar}
          </aside>
        ) : null}

        <main
          className={cn(
            "flex-1 min-w-0 overflow-x-hidden",
            // Reserve room for the BottomNav on mobile so content can scroll past it.
            navItems && navItems.length
              ? "pb-[calc(env(safe-area-inset-bottom)+4.5rem)] md:pb-0"
              : "pb-[env(safe-area-inset-bottom)]"
          )}
        >
          {children}
        </main>
      </div>

      {navItems && navItems.length ? (
        <BottomNav items={navItems} activeId={activeNavId} />
      ) : null}
    </div>
  );
}
