import * as React from "react";
import { cn } from "../../lib/utils";

export const CATEGORIES = [
  "All",
  "Seeds",
  "Fertilizers",
  "Pesticides",
  "Tools",
  "Animal Medicine",
  "Agrovet Services",
] as const;

export type CategoryValue = (typeof CATEGORIES)[number];

interface CategoryChipsProps {
  value: CategoryValue;
  onChange: (next: CategoryValue) => void;
  /** Translate the label for display while filtering on the raw value. */
  translate?: (cat: CategoryValue) => string;
}

/**
 * CategoryChips — horizontal scroll on mobile.
 * Features scroll port edge fades, smooth scroll snapping, active scaling, and premium active indicators.
 */
export function CategoryChips({ value, onChange, translate }: CategoryChipsProps) {
  return (
    <div className="relative mx-auto w-full max-w-7xl">
      {/* Scrollport fades */}
      <div className="absolute bottom-0 left-0 top-0 z-10 w-8 pointer-events-none bg-gradient-to-r from-bg to-transparent" />
      <div className="absolute bottom-0 right-0 top-0 z-10 w-8 pointer-events-none bg-gradient-to-l from-bg to-transparent" />

      <div
        className="no-scrollbar flex w-full gap-2 overflow-x-auto px-4 py-2 scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        role="tablist"
        aria-label="Product category"
      >
        <style>{`
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        {CATEGORIES.map((cat) => {
          const selected = cat === value;
          return (
            <button
              key={cat}
              role="tab"
              type="button"
              aria-selected={selected}
              onClick={() => onChange(cat)}
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 active:scale-95",
                selected
                  ? "bg-brand-600 dark:bg-brand-500 text-white shadow-md shadow-brand-600/30 dark:shadow-brand-500/20 scale-[1.02] ring-2 ring-brand-400/30"
                  : "border border-border/80 bg-surface text-muted hover:text-fg hover:border-brand-500/20 dark:hover:border-brand-400/20"
              )}
            >
              {translate ? translate(cat) : cat}
            </button>
          );
        })}
      </div>
    </div>
  );
}

