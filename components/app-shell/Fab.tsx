import * as React from "react";
import { cn } from "../../lib/utils";

interface FabProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  className?: string;
}

/**
 * Floating Action Button — when BottomNav doesn't already host one.
 * Positioned 16 dp above the bottom-nav safe area; right aligned.
 */
export function Fab({ icon, label, onClick, className }: FabProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "fixed right-4 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg transition-colors hover:bg-brand-700 active:bg-brand-800 md:hidden",
        "bottom-[calc(env(safe-area-inset-bottom)+5.5rem)]",
        className
      )}
    >
      {icon}
    </button>
  );
}
