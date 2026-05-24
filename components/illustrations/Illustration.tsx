import * as React from "react";
import { cn } from "../../lib/utils";

/**
 * The five culturally-specific hero slots from DESIGN_SPEC §14.
 * Commission each from a Tanzanian/Kenyan illustrator and replace the
 * `placeholder` SVG with the final asset. Until then, the placeholders are
 * brand-tinted line drawings that read as recognisable shapes.
 */
export type IllustrationName =
  | "farmer-greeting"
  | "plant-scan-onboarding"
  | "first-sale"
  | "logistics-empty"
  | "kyc-verified"
  // unDraw-style generic slots — used by EmptyState everywhere.
  | "empty-cart"
  | "empty-orders"
  | "empty-search"
  | "no-internet";

interface IllustrationProps {
  name: IllustrationName;
  className?: string;
  /** Tweak the brand tint. Falls back to brand-500. */
  fill?: string;
}

/**
 * Illustration — single-color SVG, brand-tinted via CSS, lazy-loaded.
 *
 * Each entry below renders a tiny vector hint of its scene. Production builds
 * swap these for commissioned art via the standard <Illustration /> API.
 */
export function Illustration({ name, className, fill }: IllustrationProps) {
  const Svg = REGISTRY[name];
  return (
    <Svg
      className={cn("h-24 w-24", className)}
      style={fill ? { color: fill } : undefined}
      aria-hidden
    />
  );
}

type SvgProps = React.SVGProps<SVGSVGElement>;

const REGISTRY: Record<IllustrationName, React.FC<SvgProps>> = {
  "farmer-greeting": (p) => (
    <svg viewBox="0 0 120 120" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="60" cy="40" r="14" />
      <path d="M30 110c0-20 14-32 30-32s30 12 30 32" />
      <path d="M44 22l16-12 16 12" />
      <path d="M22 88c10 4 22 6 38 6s28-2 38-6" />
    </svg>
  ),
  "plant-scan-onboarding": (p) => (
    <svg viewBox="0 0 120 120" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" {...p}>
      <rect x="20" y="30" width="80" height="60" rx="8" />
      <circle cx="60" cy="60" r="14" />
      <path d="M60 60c0-10 6-18 14-22M60 60c0 10-6 18-14 22" />
    </svg>
  ),
  "first-sale": (p) => (
    <svg viewBox="0 0 120 120" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" {...p}>
      <rect x="20" y="40" width="80" height="60" rx="6" />
      <path d="M30 60h60M30 75h40M30 90h30" />
      <circle cx="86" cy="32" r="8" />
      <path d="M82 32l3 3 5-5" />
    </svg>
  ),
  "logistics-empty": (p) => (
    <svg viewBox="0 0 120 120" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M22 80V44h50v36" />
      <path d="M72 60h22l8 14v6H22" />
      <circle cx="38" cy="92" r="8" />
      <circle cx="86" cy="92" r="8" />
    </svg>
  ),
  "kyc-verified": (p) => (
    <svg viewBox="0 0 120 120" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M60 10l40 14v26c0 26-18 46-40 56-22-10-40-30-40-56V24l40-14z" />
      <path d="M44 58l12 12 22-22" />
    </svg>
  ),
  "empty-cart": (p) => (
    <svg viewBox="0 0 120 120" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M20 30h12l10 50h54l10-32H40" />
      <circle cx="50" cy="96" r="6" />
      <circle cx="86" cy="96" r="6" />
    </svg>
  ),
  "empty-orders": (p) => (
    <svg viewBox="0 0 120 120" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" {...p}>
      <rect x="26" y="22" width="68" height="80" rx="6" />
      <path d="M40 42h40M40 58h40M40 74h22" />
    </svg>
  ),
  "empty-search": (p) => (
    <svg viewBox="0 0 120 120" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="52" cy="52" r="28" />
      <path d="M74 74l22 22" />
    </svg>
  ),
  "no-internet": (p) => (
    <svg viewBox="0 0 120 120" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M14 50a64 64 0 0 1 92 0" />
      <path d="M30 66a40 40 0 0 1 60 0" />
      <path d="M46 82a18 18 0 0 1 28 0" />
      <circle cx="60" cy="100" r="3" />
      <path d="M20 100l80-80" />
    </svg>
  ),
};
