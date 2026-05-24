import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * cn — merge Tailwind classes intelligently.
 * Use everywhere a component takes a `className` prop so callers can override.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as Tanzanian Shilling currency.
 * Locked to TZS at launch per DESIGN_SPEC §14.
 */
export function formatTZS(value: number): string {
  return new Intl.NumberFormat("sw-TZ", {
    style: "currency",
    currency: "TZS",
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format a date as a relative-or-absolute string.
 * Last 7 days → relative ("Yesterday, 4:32 PM"). Older → absolute ("12 May").
 */
export function formatRelativeDate(input: string | Date, locale = "en"): string {
  const d = typeof input === "string" ? new Date(input) : input;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

  if (Math.abs(diffMs) < sevenDaysMs) {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
    const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000));
    if (Math.abs(diffDays) < 1) {
      const diffHours = Math.round(diffMs / (60 * 60 * 1000));
      if (Math.abs(diffHours) < 1) {
        const diffMin = Math.round(diffMs / (60 * 1000));
        return rtf.format(-diffMin, "minute");
      }
      return rtf.format(-diffHours, "hour");
    }
    return rtf.format(-diffDays, "day");
  }
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(d);
}
