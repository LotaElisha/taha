import * as React from "react";
import { cn } from "../../lib/utils";

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
  /** Render this slot as the centered FAB instead of a flat tab. */
  fab?: boolean;
}

interface BottomNavProps {
  items: NavItem[]; // exactly 5 recommended (4 tabs + 1 FAB slot)
  activeId?: string;
  className?: string;
}

/**
 * BottomNav — phone-only thumb-reach navigation.
 * Features a high-end glassmorphic panel and an active, pulsing orb FAB.
 * Per DESIGN_SPEC §9.1.2.
 */
export function BottomNav({ items, activeId, className }: BottomNavProps) {
  return (
    <nav
      role="navigation"
      aria-label="Primary"
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 grid border-t border-border/50 bg-surface/85 backdrop-blur-lg pb-[env(safe-area-inset-bottom)] md:hidden shadow-[0_-4px_16px_rgba(0,0,0,0.03)]",
        className
      )}
      style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
    >
      <style>{`
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);
          }
          50% {
            box-shadow: 0 8px 28px rgba(16, 185, 129, 0.55);
          }
        }
      `}</style>
      {items.map((item) => {
        const isActive = item.id === activeId;
        if (item.fab) {
          return (
            <button
              key={item.id}
              type="button"
              onClick={item.onClick}
              aria-label={item.label}
              className="relative flex items-center justify-center pt-1 pb-3"
            >
              <span 
                className="-mt-7 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-brand-600 to-emerald-500 text-white shadow-[0_8px_20px_rgba(16,185,129,0.3)] ring-[5px] ring-bg transition-all duration-300 hover:scale-105 active:scale-95"
                style={{ animation: 'pulse-glow 3s infinite' }}
              >
                {item.icon}
              </span>
            </button>
          );
        }
        return (
          <button
            key={item.id}
            type="button"
            onClick={item.onClick}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex flex-col items-center justify-center gap-1.5 py-2 text-[10px] font-semibold transition-all duration-200 active:scale-95",
              isActive ? "text-brand-600 dark:text-brand-400" : "text-muted hover:text-fg"
            )}
          >
            <span className={cn("h-5 w-5 transition-all duration-200", isActive ? "text-brand-600 dark:text-brand-400 scale-110" : "text-muted")}>
              {item.icon}
            </span>
            <span className="tracking-wide">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

