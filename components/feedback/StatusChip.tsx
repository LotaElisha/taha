import * as React from "react";
import { Badge } from "../ui/badge";
import { cn } from "../../lib/utils";

export type StatusValue =
  | "pending"
  | "processing"
  | "confirmed"
  | "in-transit"
  | "shipped"
  | "delivered"
  | "completed"
  | "cancelled"
  | "rejected"
  | "verified"
  | "not-submitted"
  | "active"
  | "low-stock"
  | "out-of-stock";

const MAP: Record<StatusValue, { label: string; variant: React.ComponentProps<typeof Badge>["variant"] }> = {
  pending: { label: "Pending", variant: "warning" },
  processing: { label: "Processing", variant: "warning" },
  confirmed: { label: "Confirmed", variant: "info" },
  "in-transit": { label: "In transit", variant: "info" },
  shipped: { label: "Shipped", variant: "info" },
  delivered: { label: "Delivered", variant: "success" },
  completed: { label: "Completed", variant: "success" },
  cancelled: { label: "Cancelled", variant: "default" },
  rejected: { label: "Rejected", variant: "danger" },
  verified: { label: "Verified", variant: "success" },
  "not-submitted": { label: "Not submitted", variant: "default" },
  active: { label: "Active", variant: "brand" },
  "low-stock": { label: "Low stock", variant: "warning" },
  "out-of-stock": { label: "Out of stock", variant: "danger" },
};

interface StatusChipProps {
  status: StatusValue;
  /** Override the default label for this status. */
  children?: React.ReactNode;
  className?: string;
}

/**
 * StatusChip — single source of truth for status badge colors across the app.
 * Use everywhere status appears (orders, KYC, bookings, stock).
 */
export function StatusChip({ status, children, className }: StatusChipProps) {
  const def = MAP[status];
  return (
    <Badge variant={def.variant} className={cn(className)}>
      {children ?? def.label}
    </Badge>
  );
}
