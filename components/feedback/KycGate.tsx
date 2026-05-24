import * as React from "react";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui/button";
import { EmptyState } from "./EmptyState";

interface KycGateProps {
  /** What to render once the user is `Verified`. */
  children: React.ReactNode;
  /** Called when the user taps "Verify now" on the gate. */
  onStartKyc?: () => void;
  /** Allow access while KYC is `Pending` (default: false — gate stays up). */
  allowPending?: boolean;
}

/**
 * KycGate — wraps screens that require a verified KYC.
 * Replaces the current `alert('Please complete your KYC...')` pattern.
 * Shows a friendly empty-state for unverified users with a CTA to start.
 */
export function KycGate({ children, onStartKyc, allowPending = false }: KycGateProps) {
  const { user } = useAuth();
  const status = user?.kycStatus ?? "Not Submitted";

  if (status === "Verified") return <>{children}</>;
  if (allowPending && status === "Pending") return <>{children}</>;

  return (
    <EmptyState
      title={
        status === "Pending"
          ? "We're verifying your ID"
          : status === "Rejected"
            ? "Verification needs another look"
            : "Verify your ID to continue"
      }
      body={
        status === "Pending"
          ? "Most reviews take less than 24 hours. We'll notify you on your phone."
          : status === "Rejected"
            ? "There was an issue with the documents you submitted. Try again with clearer photos."
            : "Financial services and payouts require a one-time identity check. It takes about 2 minutes."
      }
      action={
        status === "Pending" ? null : (
          <Button variant="primary" onClick={onStartKyc}>
            {status === "Rejected" ? "Resubmit documents" : "Verify now"}
          </Button>
        )
      }
    />
  );
}
